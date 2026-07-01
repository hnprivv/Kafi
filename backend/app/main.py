from fastapi import FastAPI
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pydantic import BaseModel

from app.config import settings

app = FastAPI(title="Kafi API")

_embeddings = GoogleGenerativeAIEmbeddings(
    model=settings.embedding_model,
    google_api_key=settings.google_api_key,
)
_vectorstore = Chroma(
    collection_name=settings.collection_name,
    embedding_function=_embeddings,
    persist_directory=settings.chroma_persist_dir,
)


class RetrieveRequest(BaseModel):
    query: str
    k: int = 3


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/debug/retrieve")
def debug_retrieve(request: RetrieveRequest):
    """Raw retrieval against the FAQ collection, no normalization or generation.
    Exists to sanity-check ingestion before the full two-step pipeline is wired up.
    """
    results = _vectorstore.similarity_search_with_score(request.query, k=request.k)
    return [
        {
            "faq_id": doc.metadata["faq_id"],
            "category": doc.metadata["category"],
            "content": doc.page_content,
            "score": score,
        }
        for doc, score in results
    ]
