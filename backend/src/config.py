from pydantic_settings import BaseSettings
from pydantic import SecretStr
from typing import Optional

class Settings(BaseSettings):
    GOOGLE_API_KEY: Optional[SecretStr] = None
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    K: int = 2
    EMBEDDING_MODEL: str = "models/embedding-001"
    CHAT_MODEL: str = "gemini-2.5-pro-exp-03-25"

    class Config:
        env_file = ".env"

settings = Settings()
