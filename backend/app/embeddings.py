"""Local embedding client, shared by ingestion and the pipeline.

Replaces the Gemini embedding API (1000 RPD free-tier cap, which blocked
full-dataset evals). Runs a quantized ONNX model on CPU via fastembed —
no API quota, no torch dependency, small enough for Render's free tier.

The two-step pipeline guarantees retrieval only ever sees English text
(normalized queries against English FAQ answers), so an English-only
model is sufficient.
"""

from fastembed import TextEmbedding
from langchain_core.embeddings import Embeddings

from app.config import settings

# Official BGE instruction for short-query-to-passage retrieval. Applied to
# queries only; BGE passages are embedded without a prefix.
BGE_QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "


class LocalEmbeddings(Embeddings):
    def __init__(self, model_name: str, cache_dir: str) -> None:
        self.model = TextEmbedding(model_name=model_name, cache_dir=cache_dir)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return [vector.tolist() for vector in self.model.embed(texts)]

    def embed_query(self, text: str) -> list[float]:
        vector = next(iter(self.model.embed([BGE_QUERY_INSTRUCTION + text])))
        return vector.tolist()


def get_embeddings() -> LocalEmbeddings:
    return LocalEmbeddings(
        model_name=settings.embedding_model,
        cache_dir=settings.embedding_cache_dir,
    )
