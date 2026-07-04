from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    google_api_key: str
    chroma_persist_dir: str = "./chroma_db"
    faq_csv_path: str = "../data/noor_faq_knowledge_base.csv"
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    embedding_cache_dir: str = "./model_cache"
    chat_model: str = "models/gemini-3.1-flash-lite"
    collection_name: str = "noor_faq"


settings = Settings()
