"""The two-step retrieval pipeline: normalize -> retrieve -> generate.

Raw embedding-similarity search on Roman Urdu queries against an English FAQ
knowledge base is unreliable (transliteration spelling varies). So instead:
  1. Normalize the incoming message to plain English (LLM call), used only
     for retrieval.
  2. Retrieve grounding FAQ chunks using the normalized text.
  3. Generate the reply in the user's original code-switched style,
     grounded in the retrieved chunks.
"""

import re

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from tenacity import retry, retry_if_exception, stop_after_attempt, wait_exponential

from app.config import settings
from app.embeddings import get_embeddings


def _is_rate_limit_error(exc: BaseException) -> bool:
    message = str(exc)
    return "429" in message or "RESOURCE_EXHAUSTED" in message or "rate limit" in message.lower()


rate_limit_retry = retry(
    retry=retry_if_exception(_is_rate_limit_error),
    wait=wait_exponential(multiplier=2, min=2, max=60),
    stop=stop_after_attempt(5),
    reraise=True,
)

NORMALIZE_SYSTEM_PROMPT = """You are a query normalization utility for a Pakistani fintech \
support system. The user message may be in Roman Urdu, English, or a code-switched mix of \
both, and may contain typos or inconsistent transliteration spelling.

Return exactly three lines, no explanation, quotes, or preamble:
LANGUAGE: classify the user's message as one of: english | roman_urdu | code_switched. \
Use "english" only if the message is entirely English. Use "roman_urdu" if it is almost \
entirely Urdu written in Latin script. Otherwise use "code_switched".
TYPE: classify as "question" if the message asks for information, requests help, or \
reports a problem. Classify as "smalltalk" if it is only a greeting, thanks, \
acknowledgement (e.g. "ok", "will try", "thanks yaar"), or goodbye, with no support \
question in it.
NORMALIZED: the message rewritten as a single, clear, plain-English question or statement \
suitable for searching an English-language FAQ knowledge base. Preserve the original meaning \
and intent exactly. Do not answer the question. Do not add information."""

GENERATE_SYSTEM_PROMPT = """You are a customer support assistant for Noor, a Pakistani \
fintech company (mobile wallet, EasyPaisa/JazzCash-linked transfers, bank transfers, CNIC/KYC \
verification, bill payments).

A LANGUAGE RULE below states which language to reply in, based on how the user wrote — \
follow it strictly. Never use Urdu script. Match the user's tone: if they wrote casually, \
stay casual; do not switch to stiff formal English.

Ground your answer strictly in the FAQ CONTEXT provided. If the context does not contain \
enough information to answer, say so honestly in the user's style and suggest escalating to a \
human agent — do not invent policy details, amounts, or timeframes that aren't in the context.

Only use the parts of the context that answer what the user actually asked. Never volunteer, \
mention, or hint at other support topics from the context that the user did not raise.

Keep the reply concise, like a real chat support message, not an essay."""


LANGUAGE_DIRECTIVES = {
    "english": "LANGUAGE RULE: The user wrote entirely in English. Reply in English only — no Roman Urdu words or phrases.",
    "roman_urdu": "LANGUAGE RULE: The user wrote in Roman Urdu. Reply in Roman Urdu (Latin script), keeping common English fintech terms (app, transaction, refund) where natural.",
    "code_switched": "LANGUAGE RULE: The user mixed Roman Urdu and English. Reply in the same natural mix.",
}


# Common Roman Urdu function/content words that rarely occur in English text.
# Deliberately excludes spellings that are also English words ("do", "is",
# "us", "to", "main"). Used as a deterministic guard over the LLM's language
# classification: an English message with typos still contains none of these.
ROMAN_URDU_MARKERS = frozenset(
    """mera meri mere mujhe mujh tum aap apna apni apne hai hain hoon hogi hoga
    raha rahi rahe gaya gayi gaye karo karein karna karke kiya kya kyun kaise
    kahan kab kaun nahi nahin mat acha achha theek thik yaar bhai behen paisa
    paise raqam sawal jawab madad shukriya mehrbani wala wale wali lekin magar
    kyunke agar phir dobara wapas abhi kal aaj sirf zyada kam thora thoda bohat
    bahut bhi aur ya ke ki ka ko se par mein andar bahar upar neeche saath bina
    hua hui hue tha thi thay chahiye sakta sakti sakte dena lena bhejo bheja
    batao bata dikhao likho likhein samajh pata chal gya gyi kro kr rha rhi rhe
    nai nhi hy hain""".split()
)


def _guard_language(raw_query: str, language: str) -> str:
    """Deterministic override for the LLM's language label. If the message
    contains no Roman Urdu marker words, it is English — full stop."""
    tokens = re.findall(r"[a-z']+", raw_query.lower())
    if not tokens:
        return language
    urdu_hits = sum(1 for token in tokens if token in ROMAN_URDU_MARKERS)
    if urdu_hits == 0:
        return "english"
    if language == "english":
        # Inverse case: the model said English but Urdu words are present.
        return "code_switched"
    return language


def _parse_normalize_output(text: str) -> tuple[str, str, str]:
    """Returns (normalized_query, language, message_type). Falls back
    gracefully if the model ignores the three-line format."""
    language = "code_switched"
    message_type = "question"
    normalized = text.strip()
    for line in text.splitlines():
        stripped = line.strip()
        if stripped.upper().startswith("LANGUAGE:"):
            candidate = stripped.split(":", 1)[1].strip().lower()
            if candidate in LANGUAGE_DIRECTIVES:
                language = candidate
        elif stripped.upper().startswith("TYPE:"):
            candidate = stripped.split(":", 1)[1].strip().lower()
            if candidate in ("question", "smalltalk"):
                message_type = candidate
        elif stripped.upper().startswith("NORMALIZED:"):
            normalized = stripped.split(":", 1)[1].strip()
    return normalized, language, message_type


@rate_limit_retry
def normalize_query(chat_model: ChatGoogleGenerativeAI, raw_query: str) -> tuple[str, str, str]:
    """Returns (normalized_query, language, message_type) in a single LLM call."""
    response = chat_model.invoke(
        [
            SystemMessage(content=NORMALIZE_SYSTEM_PROMPT),
            HumanMessage(content=raw_query),
        ]
    )
    normalized, language, message_type = _parse_normalize_output(response.text)
    return normalized, _guard_language(raw_query, language), message_type


@rate_limit_retry
def retrieve_faqs(vectorstore: Chroma, normalized_query: str, k: int = 3) -> list[Document]:
    return vectorstore.similarity_search(normalized_query, k=k)


@rate_limit_retry
def generate_reply(
    chat_model: ChatGoogleGenerativeAI,
    raw_query: str,
    faq_docs: list[Document],
    language: str = "code_switched",
) -> str:
    if faq_docs:
        context = "\n\n".join(doc.page_content for doc in faq_docs)
    else:
        # Small talk: no retrieval ran, so there is nothing to ground in —
        # and nothing the model should be tempted to bring up.
        context = (
            "(none — the user's message is a greeting, thanks, acknowledgement, or "
            "goodbye, not a support question. Reply with a brief, friendly "
            "acknowledgement in their language. Do not introduce, mention, or hint "
            "at any support topic.)"
        )
    directive = LANGUAGE_DIRECTIVES.get(language, LANGUAGE_DIRECTIVES["code_switched"])
    prompt = f"FAQ CONTEXT:\n{context}\n\n{directive}\n\nUSER'S ORIGINAL MESSAGE:\n{raw_query}"
    response = chat_model.invoke(
        [
            SystemMessage(content=GENERATE_SYSTEM_PROMPT),
            HumanMessage(content=prompt),
        ]
    )
    return response.text.strip()


class KafiPipeline:
    def __init__(self) -> None:
        self.embeddings = get_embeddings()
        self.chat_model = ChatGoogleGenerativeAI(
            model=settings.chat_model,
            google_api_key=settings.google_api_key,
            temperature=0.3,
        )
        self.vectorstore = Chroma(
            collection_name=settings.collection_name,
            embedding_function=self.embeddings,
            persist_directory=settings.chroma_persist_dir,
        )

    def run(self, raw_query: str, k: int = 3) -> dict:
        normalized, language, message_type = normalize_query(self.chat_model, raw_query)
        # Small talk skips retrieval entirely: similarity search always returns
        # top-k regardless of relevance, and stray FAQ context tempts the model
        # into volunteering topics the user never raised.
        faq_docs = []
        if message_type == "question":
            faq_docs = retrieve_faqs(self.vectorstore, normalized, k=k)
        reply = generate_reply(self.chat_model, raw_query, faq_docs, language=language)
        return {
            "reply": reply,
            "normalized_query": normalized,
            "detected_language": language,
            "message_type": message_type,
            "retrieved_faq_ids": [doc.metadata["faq_id"] for doc in faq_docs],
        }
