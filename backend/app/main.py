from fastapi import FastAPI
from pydantic import BaseModel

from app.pipeline import KafiPipeline

app = FastAPI(title="Kafi API")

_pipeline = KafiPipeline()


class ChatRequest(BaseModel):
    message: str


class DebugRetrieveRequest(BaseModel):
    query: str
    k: int = 3


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
def chat(request: ChatRequest):
    return _pipeline.run(request.message)


@app.post("/debug/retrieve")
def debug_retrieve(request: DebugRetrieveRequest):
    """Raw retrieval against the FAQ collection, no normalization or generation."""
    results = _pipeline.vectorstore.similarity_search_with_score(request.query, k=request.k)
    return [
        {
            "faq_id": doc.metadata["faq_id"],
            "category": doc.metadata["category"],
            "content": doc.page_content,
            "score": score,
        }
        for doc, score in results
    ]
