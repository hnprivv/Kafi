"""Embeds noor_faq_knowledge_base.csv into the persistent ChromaDB collection.

Run once after regenerating the FAQ dataset:
    python -m app.ingest
"""

import pandas as pd
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_google_genai import GoogleGenerativeAIEmbeddings

from app.config import settings


def load_faq_documents(csv_path: str) -> list[Document]:
    df = pd.read_csv(csv_path, keep_default_na=False, na_values=[""])

    documents = []
    for _, row in df.iterrows():
        content = f"Question: {row['question_en']}\nAnswer: {row['answer_en']}"
        metadata = {
            "faq_id": row["faq_id"],
            "category": row["category"],
            "payment_method": row["payment_method"] if pd.notna(row["payment_method"]) else "N/A",
            "keywords": row["keywords"],
        }
        documents.append(Document(page_content=content, metadata=metadata))
    return documents


def build_vectorstore() -> Chroma:
    embeddings = GoogleGenerativeAIEmbeddings(
        model=settings.embedding_model,
        google_api_key=settings.google_api_key,
    )
    documents = load_faq_documents(settings.faq_csv_path)

    vectorstore = Chroma(
        collection_name=settings.collection_name,
        embedding_function=embeddings,
        persist_directory=settings.chroma_persist_dir,
    )
    # Reset the collection so re-running ingestion doesn't duplicate entries.
    existing_ids = vectorstore.get()["ids"]
    if existing_ids:
        vectorstore.delete(ids=existing_ids)

    ids = [doc.metadata["faq_id"] for doc in documents]
    vectorstore.add_documents(documents=documents, ids=ids)
    return vectorstore


if __name__ == "__main__":
    store = build_vectorstore()
    count = store.get()["ids"]
    print(f"Ingested {len(count)} FAQ documents into collection '{settings.collection_name}'.")
