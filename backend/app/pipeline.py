"""The two-step retrieval pipeline: normalize -> retrieve -> generate.

Raw embedding-similarity search on Roman Urdu queries against an English FAQ
knowledge base is unreliable (transliteration spelling varies). So instead:
  1. Normalize the incoming message to plain English (LLM call), used only
     for retrieval.
  2. Retrieve grounding FAQ chunks using the normalized text.
  3. Generate the reply in the user's original code-switched style,
     grounded in the retrieved chunks.
"""

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

Rewrite the message as a single, clear, plain-English question or statement suitable for \
searching an English-language FAQ knowledge base. Preserve the original meaning and intent \
exactly. Do not answer the question. Do not add information. Return only the rewritten text, \
with no explanation, quotes, or preamble."""

GENERATE_SYSTEM_PROMPT = """You are a customer support assistant for Noor, a Pakistani \
fintech company (mobile wallet, EasyPaisa/JazzCash-linked transfers, bank transfers, CNIC/KYC \
verification, bill payments).

Reply in the same style and language mix as the user's ORIGINAL message below (Roman Urdu, \
English, or code-switched) — do not switch to formal Urdu script, and do not switch to stiff \
formal English if the user wrote casually. Match their tone.

Ground your answer strictly in the FAQ CONTEXT provided. If the context does not contain \
enough information to answer, say so honestly in the user's style and suggest escalating to a \
human agent — do not invent policy details, amounts, or timeframes that aren't in the context.

Keep the reply concise, like a real chat support message, not an essay."""


@rate_limit_retry
def normalize_query(chat_model: ChatGoogleGenerativeAI, raw_query: str) -> str:
    response = chat_model.invoke(
        [
            SystemMessage(content=NORMALIZE_SYSTEM_PROMPT),
            HumanMessage(content=raw_query),
        ]
    )
    return response.text.strip()


@rate_limit_retry
def retrieve_faqs(vectorstore: Chroma, normalized_query: str, k: int = 3) -> list[Document]:
    return vectorstore.similarity_search(normalized_query, k=k)


@rate_limit_retry
def generate_reply(chat_model: ChatGoogleGenerativeAI, raw_query: str, faq_docs: list[Document]) -> str:
    context = "\n\n".join(doc.page_content for doc in faq_docs)
    prompt = f"FAQ CONTEXT:\n{context}\n\nUSER'S ORIGINAL MESSAGE:\n{raw_query}"
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
        normalized = normalize_query(self.chat_model, raw_query)
        faq_docs = retrieve_faqs(self.vectorstore, normalized, k=k)
        reply = generate_reply(self.chat_model, raw_query, faq_docs)
        return {
            "reply": reply,
            "normalized_query": normalized,
            "retrieved_faq_ids": [doc.metadata["faq_id"] for doc in faq_docs],
        }
