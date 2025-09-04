
from pydantic import BaseModel
from typing import List, Optional

class AskRequest(BaseModel):
    question: str
    doc_id: Optional[str] = None

class AskResponse(BaseModel):
    answer: str

class UploadResponse(BaseModel):
    uploaded: bool
    message: str
    doc_id: Optional[str] = None

class DocumentEntry(BaseModel):
    doc_id: str
    filename: str
    uploaded_at: str
    chunks: int
    path: Optional[str]
    status: str
    file_hash: Optional[str] = None
    size: Optional[int] = None
    pages: Optional[int] = None

class StatusResponse(BaseModel):
    documents: List[DocumentEntry]
    total: int
    chroma_persisted: bool

class DeleteResponse(BaseModel):
    deleted: bool
    doc_id: str
