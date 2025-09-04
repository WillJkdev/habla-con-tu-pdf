import os
import uuid
from typing import Optional, Dict, List, Any, Union

from fastapi import Request
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA

from src.config import settings
from src.db.chroma_db import ChromaDBManager
from src.utils import PDFProcessor, FileManager, IndexManager

PDF_STORE_DIR = "data/pdfs"
CHROMA_DIR = settings.CHROMA_PERSIST_DIR  # p.e. "./chroma_db"
INDEX_FILE = os.path.join(CHROMA_DIR, "docs_index.json")
MAX_DOCS = 5


class RAGService:
    def __init__(self):
        # Inicializar utilities
        self.pdf_processor = PDFProcessor()
        self.file_manager = FileManager(PDF_STORE_DIR)
        self.index_manager = IndexManager(INDEX_FILE)
        
        # Inicializar ChromaDB manager
        self.chroma_db = ChromaDBManager(CHROMA_DIR)
        
        # LLM para respuesta
        self.llm = ChatGoogleGenerativeAI(
            model=settings.CHAT_MODEL,
            google_api_key=settings.GOOGLE_API_KEY
        )

    # Los métodos _load_index, _save_index y _split_pdf ahora están en utilities
    
    # ---------- index (docs metadata) ----------
    def create_pending_entry(self, source_path: str, filename: Optional[str] = None) -> str:
        """
        Crea una entrada preliminar en el índice con status='processing' y devuelve el doc_id.
        La tarea de indexación podrá usar ese doc_id para actualizar la misma entrada.
        """
        if not self.file_manager.file_exists(source_path):
            raise FileNotFoundError(f"El archivo {source_path} no existe")

        doc_id = str(uuid.uuid4())
        safe_filename = filename or self.file_manager.get_base_filename(source_path)
        
        # Obtener el tamaño del archivo y páginas
        file_size = self.file_manager.get_file_size(source_path)
        try:
            pages_count = self.pdf_processor.count_pdf_pages(source_path)
        except Exception:
            pages_count = None

        self.index_manager.create_entry(doc_id, safe_filename, source_path, "processing", file_size, pages_count)
        return doc_id

    # ---------- add / upload ----------
    def add_pdf_from_path(self, source_path: str, filename: Optional[str] = None, doc_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Indexa un PDF desde ruta. Si se pasa doc_id existente, actualiza la entrada existente
        en lugar de crear una nueva.
        """
        if not self.file_manager.file_exists(source_path):
            self.index_manager.mark_as_failed(doc_id) if doc_id else None
            raise FileNotFoundError(f"El archivo {source_path} no existe")

        # si no se pasó doc_id, generar uno (comportamiento antiguo)
        if doc_id is None:
            doc_id = str(uuid.uuid4())
            safe_filename = filename or self.file_manager.get_base_filename(source_path)
            # Obtener el tamaño del archivo y páginas
            file_size = self.file_manager.get_file_size(source_path)
            try:
                pages_count = self.pdf_processor.count_pdf_pages(source_path)
            except Exception:
                pages_count = None
            self.index_manager.create_entry(doc_id, safe_filename, source_path, "processing", file_size, pages_count)
        else:
            safe_filename = filename or self.file_manager.get_base_filename(source_path)
            # Si ya existe la entrada pero no tiene tamaño o páginas, agregarlos
            entry = self.index_manager.get_entry(doc_id)
            if entry:
                if entry.get("size") is None:
                    file_size = self.file_manager.get_file_size(source_path)
                    if file_size is not None:
                        self.index_manager.add_file_size(doc_id, file_size)
                
                if entry.get("pages") is None:
                    try:
                        pages_count = self.pdf_processor.count_pdf_pages(source_path)
                        self.index_manager.add_pages_count(doc_id, pages_count)
                    except Exception:
                        pass

        print(f"[RAGService] Iniciando indexación de {safe_filename} (doc_id={doc_id})")

        # chunking usando PDFProcessor - usar get_pdf_info para eficiencia
        try:
            pdf_info = self.pdf_processor.get_pdf_info(source_path)
            chunks = pdf_info["chunks"]
            pages_count = pdf_info["pages"]
            
            # Actualizar páginas si no se había guardado antes
            entry = self.index_manager.get_entry(doc_id)
            if entry and entry.get("pages") is None:
                self.index_manager.add_pages_count(doc_id, pages_count)
                
        except Exception:
            self.index_manager.mark_as_failed(doc_id)
            raise

        # generar metadatos e IDs usando PDFProcessor
        metadatas = self.pdf_processor.create_metadata(doc_id, safe_filename, len(chunks))
        ids = self.pdf_processor.generate_chunk_ids(doc_id, len(chunks))

        # añadir a Chroma usando ChromaDBManager
        try:
            self.chroma_db.add_documents(chunks, metadatas, ids)
        except Exception:
            self.index_manager.mark_as_failed(doc_id)
            raise

        # actualizar entrada con datos finales usando IndexManager
        self.index_manager.mark_as_completed(doc_id, len(chunks))
        
        # Agregar hash del archivo para detección de duplicados futuros
        file_hash = self.file_manager.calculate_file_hash(source_path)
        if file_hash:
            self.index_manager.add_file_hash(doc_id, file_hash)

        print(f"[RAGService] Indexación completada: {safe_filename} (doc_id={doc_id}, chunks={len(chunks)})")

        # mantener límite usando IndexManager
        deleted_doc_id = self.index_manager.enforce_max_documents(MAX_DOCS, doc_id)
        if deleted_doc_id:
            self.delete_document(deleted_doc_id)

        # Obtener información del archivo para el retorno
        file_size = self.file_manager.get_file_size(source_path)
        entry = self.index_manager.get_entry(doc_id)
        pages_count = entry.get("pages") if entry else None
        
        return {
            "doc_id": doc_id,
            "filename": safe_filename,
            "chunks": len(chunks),
            "path": source_path,
            "status": "ready",
            "size": file_size,
            "pages": pages_count,
        }

    # ---------- delete ----------
    def delete_document(self, doc_id: str) -> bool:
        # Buscar entrada usando IndexManager
        entry = self.index_manager.get_entry(doc_id)
        if not entry:
            print(f"[RAGService] Documento {doc_id} no encontrado en el índice")
            return False

        # Verificar cuántos chunks existen antes de eliminar
        chunks_before = self.chroma_db.count_document_chunks(doc_id)
        print(f"[RAGService] Eliminando documento {doc_id} ({chunks_before} chunks)")

        # Eliminar del índice usando IndexManager
        deleted_entry = self.index_manager.delete_entry(doc_id)
        if not deleted_entry:
            print(f"[RAGService] Error al eliminar entrada del índice: {doc_id}")
            return False

        # intentar borrar embeddings por metadata usando ChromaDBManager
        try:
            self.chroma_db.delete_by_metadata({"doc_id": doc_id})
            
            # Verificar que la eliminación fue exitosa
            if not self.chroma_db.verify_document_deleted(doc_id):
                print(f"[RAGService] ADVERTENCIA: Eliminación incompleta de embeddings para {doc_id}")
                # fallback: reconstruir la BD desde index
                print(f"[RAGService] Reconstruyendo base de datos como fallback...")
                self._rebuild_chroma_from_index()
                
        except Exception as e:
            print(f"[RAGService] Error al eliminar embeddings: {str(e)}")
            # fallback: reconstruir la BD desde index
            print(f"[RAGService] Reconstruyendo base de datos como fallback...")
            self._rebuild_chroma_from_index()

        # borrar archivo pdf del disco usando FileManager
        file_deleted = self.file_manager.delete_file(entry.get("path"))
        if file_deleted:
            print(f"[RAGService] Archivo físico eliminado: {entry.get('path')}")
        else:
            print(f"[RAGService] No se pudo eliminar archivo físico: {entry.get('path')}")

        # Limpiar cola de embeddings para evitar rastros
        queue_cleaned = self.chroma_db.cleanup_embeddings_queue()
        
        # Si la limpieza detecta registros huérfanos, reconstruir la base
        if not queue_cleaned:
            print(f"[RAGService] Detectados registros huérfanos, iniciando reconstrucción preventiva...")
            self._rebuild_chroma_from_index()
        
        print(f"[RAGService] Documento eliminado completamente: {doc_id}")
        return True

    def _rebuild_chroma_from_index(self):
        all_chunks: List[Any] = []
        all_metas: List[Dict[str, Any]] = []
        for entry in self.index_manager.get_all_entries():
            chunks = self.pdf_processor.load_and_split_pdf(entry["path"])
            metas = self.pdf_processor.create_metadata(entry["doc_id"], entry["filename"], len(chunks))
            all_chunks.extend(chunks)
            all_metas.extend(metas)
        self.chroma_db.rebuild_from_documents(all_chunks, all_metas)

    # ---------- ask ----------
    def ask(self, question: str, doc_id: Optional[str] = None, k: Optional[int] = None) -> str:
        k = k or settings.K

        retriever = self.chroma_db.get_retriever({
            "k": k,
            "filter": {"doc_id": doc_id} if doc_id else None
        })

        # Recuperar documentos con invoke en lugar de get_relevant_documents
        docs = retriever.invoke(question)

        if not docs:
            return f"No encontré información para el documento con id '{doc_id}'." if doc_id else "No encontré información relevante."

        # Usar invoke en lugar de run
        qa = RetrievalQA.from_chain_type(
            llm=self.llm,
            retriever=retriever,
            chain_type="stuff"
        )

        result = qa.invoke({"query": question})
        return result["result"] if isinstance(result, dict) else result  # type: ignore[return-value]

    # ---------- status ----------
    def status(self) -> Dict[str, Union[List[Dict[str, Any]], int, bool]]:
        # Limpiar documentos en processing que pueden haber fallado
        self._cleanup_stale_processing_documents()
        
        return {
            "documents": self.index_manager.get_all_entries(),
            "total": self.index_manager.count_entries(),
            "chroma_persisted": self.chroma_db.is_persisted(),
        }
    
    def _cleanup_stale_processing_documents(self) -> None:
        """Limpia documentos que quedaron en estado 'processing' por más de 5 minutos."""
        from datetime import datetime, timezone, timedelta
        
        processing_docs = self.index_manager.find_entries_by_status("processing")
        current_time = datetime.now(timezone.utc)
        
        for doc in processing_docs:
            try:
                uploaded_at = datetime.fromisoformat(doc["uploaded_at"].replace('Z', '+00:00'))
                if current_time - uploaded_at > timedelta(minutes=5):
                    print(f"[RAGService] Limpiando documento obsoleto: {doc['doc_id']}")
                    self.index_manager.mark_as_failed(doc["doc_id"])
                    # Intentar eliminar archivo huérfano
                    self.file_manager.delete_file(doc.get("path"))
            except Exception as e:
                print(f"[RAGService] Error al limpiar documento {doc['doc_id']}: {str(e)}")
                continue



def get_rag_service(request: Request) -> RAGService:
    """Dependency: retorna la instancia singleton guardada en app.state.rag_service."""
    service = getattr(request.app.state, "rag_service", None)
    if service is None:
        service = create_rag_service_singleton()
        request.app.state.rag_service = service
    return service


# factory para dependencia (mejor registrar singleton en main via app.state)
def create_rag_service_singleton():
    return RAGService()
