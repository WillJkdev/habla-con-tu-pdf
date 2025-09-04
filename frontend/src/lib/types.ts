// Modelos basados en FastAPI/Pydantic
export interface AskRequest {
  question: string;
  doc_id?: string;
}

export interface AskResponse {
  answer: string;
}

export interface UploadResponse {
  uploaded: boolean;
  message: string;
  doc_id?: string;
}

export interface DocumentEntry {
  doc_id: string;
  filename: string;
  uploaded_at: string;
  chunks: number;
  path?: string;
  status: "processing" | "ready" | "failed";
  file_hash?: string;
  size: number;
  pages: number;
}

export interface StatusResponse {
  documents: DocumentEntry[];
  total: number;
  chroma_persisted: boolean;
}

export interface DeleteResponse {
  deleted: boolean;
  doc_id: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Interfaz local para el frontend (transformada)
export interface Document {
  id: string;
  name: string;
  size: number;
  status: "processing" | "ready" | "failed";
  uploadedAt: Date;
  pages?: number;
}

export interface LocalDocument extends Document {
  uploadProgress?: number;
}

export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  documentId?: string;
}

export type SortOption = "name" | "date" | "size" | "status";
export type FilterOption = "all" | "ready" | "processing" | "failed";
