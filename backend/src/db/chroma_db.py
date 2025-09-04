import os
from typing import List, Dict, Any, Optional
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_chroma import Chroma
from langchain.schema import Document

from src.config import settings


class ChromaDBManager:
    """Maneja todas las operaciones específicas de ChromaDB."""
    
    def __init__(self, persist_directory: str):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)
        
        # Inicializar embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            google_api_key=settings.GOOGLE_API_KEY,
            transport="rest",
        )
        
        # Inicializar base de datos
        self._init_db()
    
    def _init_db(self):
        """Inicializa la base de datos ChromaDB."""
        try:
            self.db = Chroma(
                persist_directory=self.persist_directory, 
                embedding_function=self.embeddings
            )
        except Exception:
            # Fallback: crear/abrir igualmente
            self.db = Chroma(
                persist_directory=self.persist_directory, 
                embedding_function=self.embeddings
            )
    
    def add_documents(self, chunks: List[Document], metadatas: List[Dict[str, Any]], ids: List[str]) -> None:
        """Añade documentos a ChromaDB con estrategia de compatibilidad."""
        try:
            # Validar datos antes de insertar
            self._validate_insertion_data(chunks, metadatas, ids)
            
            # Normalizar metadatos para consistencia
            normalized_metadatas = self._normalize_metadata(metadatas)
            
            try:
                print(f"[ChromaDB] Insertando {len(chunks)} chunks con add_documents")
                self.db.add_documents(documents=chunks, metadatas=normalized_metadatas, ids=ids)
                print(f"[ChromaDB] Inserción exitosa con add_documents")
            except TypeError:
                # Fallback para versiones de ChromaDB que requieren texts
                print(f"[ChromaDB] Fallback: usando add_texts")
                texts = [d.page_content for d in chunks]
                self.db.add_texts(texts, metadatas=normalized_metadatas, ids=ids)  # type: ignore[arg-type]
                print(f"[ChromaDB] Inserción exitosa con add_texts")
                
        except Exception as e:
            raise RuntimeError(f"Error al añadir documentos a ChromaDB: {str(e)}")
    
    def _validate_insertion_data(self, chunks: List[Document], metadatas: List[Dict[str, Any]], ids: List[str]) -> None:
        """Valida que los datos de inserción sean consistentes."""
        if len(chunks) != len(metadatas) or len(chunks) != len(ids):
            raise ValueError(f"Longitudes inconsistentes: chunks={len(chunks)}, metadatas={len(metadatas)}, ids={len(ids)}")
        
        if not chunks:
            raise ValueError("No hay chunks para insertar")
        
        # Verificar que los IDs sean únicos
        if len(set(ids)) != len(ids):
            raise ValueError("IDs duplicados encontrados")
        
        # Verificar que los metadatos tengan las claves requeridas
        required_keys = {"doc_id", "filename", "chunk_index"}
        for i, metadata in enumerate(metadatas):
            missing_keys = required_keys - set(metadata.keys())
            if missing_keys:
                raise ValueError(f"Metadatos incompletos en chunk {i}: faltan {missing_keys}")
    
    def _normalize_metadata(self, metadatas: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Normaliza metadatos para asegurar tipos consistentes."""
        normalized: List[Dict[str, Any]] = []
        for metadata in metadatas:
            # Crear copia y asegurar que todos los valores sean strings
            normalized_meta: Dict[str, Any] = {}
            for key, value in metadata.items():
                if isinstance(value, (int, float, bool)):
                    normalized_meta[key] = str(value)
                elif isinstance(value, str):
                    normalized_meta[key] = value
                else:
                    normalized_meta[key] = str(value)
            normalized.append(normalized_meta)
        return normalized
    
    def delete_by_metadata(self, where: Dict[str, Any]) -> None:
        """Elimina documentos por metadata con estrategia robusta."""
        try:
            # Primero verificar qué documentos existen antes de eliminar
            results = self.db.get(where=where, include=["metadatas", "documents"])
            
            if not results or not results.get("ids"):
                print(f"[ChromaDB] No se encontraron documentos para eliminar con filtro: {where}")
                return
            
            ids_to_delete = results["ids"]
            print(f"[ChromaDB] Eliminando {len(ids_to_delete)} documentos con filtro: {where}")
            
            # Estrategia 1: Eliminar por IDs específicos (más preciso que por metadata)
            try:
                print(f"[ChromaDB] Intentando eliminación por IDs: {ids_to_delete[:3]}...")  # Mostrar solo los primeros 3
                self.db.delete(ids=ids_to_delete)
                
                # Verificar que la eliminación fue exitosa
                verification = self.db.get(where=where, include=["metadatas"])
                if verification and verification.get("ids"):
                    remaining_ids = verification["ids"]
                    print(f"[ChromaDB] ADVERTENCIA: {len(remaining_ids)} documentos permanecen después de eliminación por IDs")
                    # Fallback: usar where como respaldo
                    self.db.delete(where=where)
                    # Forzar persistencia para procesar cola
                    self._force_persistence()
                    # Verificación final
                    final_verification = self.db.get(where=where, include=["metadatas"])
                    if final_verification and final_verification.get("ids"):
                        raise RuntimeError(f"Eliminación fallida: {len(final_verification['ids'])} documentos permanecen")
                
                print(f"[ChromaDB] Eliminación exitosa: {len(ids_to_delete)} documentos eliminados por IDs")
                
            except Exception as e:
                print(f"[ChromaDB] Error en eliminación por IDs, intentando por metadata: {str(e)}")
                # Fallback: eliminar usando where
                self.db.delete(where=where)
                # Forzar persistencia
                self._force_persistence()
                
                # Verificación final después del fallback
                verification = self.db.get(where=where, include=["metadatas"])
                if verification and verification.get("ids"):
                    remaining_ids = verification["ids"]
                    print(f"[ChromaDB] ADVERTENCIA: {len(remaining_ids)} documentos no fueron eliminados después del fallback")
                    raise RuntimeError(f"Eliminación incompleta: {len(remaining_ids)} documentos permanecen")
                
                print(f"[ChromaDB] Eliminación exitosa por fallback: {len(ids_to_delete)} documentos eliminados")
                
        except Exception as e:
            raise RuntimeError(f"Error al eliminar documentos de ChromaDB: {str(e)}")
    
    def _force_persistence(self) -> None:
        """Fuerza la persistencia para procesar la cola de embeddings."""
        try:
            if hasattr(self.db, '_client') and hasattr(self.db._client, 'persist'):  # type: ignore[misc]
                self.db._client.persist()  # type: ignore[attr-defined]
                print("[ChromaDB] Persistencia forzada para procesar cola de embeddings")
        except Exception as e:
            print(f"[ChromaDB] Error al forzar persistencia: {str(e)}")
    
    def get_retriever(self, search_kwargs: Dict[str, Any]):
        """Retorna un retriever configurado."""
        return self.db.as_retriever(search_kwargs=search_kwargs)
    
    def rebuild_from_documents(self, all_chunks: List[Any], all_metas: List[Dict[str, Any]]) -> None:
        """Reconstruye la base de datos desde cero para eliminar registros huérfanos."""
        try:
            print("[ChromaDB] Iniciando reconstrucción completa de la base de datos...")
            
            # Estrategia: eliminar colección y recrear para limpiar completamente embeddings_queue
            collection_name = "langchain"  # Nombre por defecto de langchain-chroma
            
            try:
                # Intentar eliminar la colección existente si existe
                if hasattr(self.db, '_client'):
                    client = self.db._client  # type: ignore[attr-defined]
                    if hasattr(client, 'delete_collection'):
                        try:
                            client.delete_collection(name=collection_name)  # type: ignore[attr-defined]
                            print("[ChromaDB] Colección existente eliminada")
                        except Exception:
                            print("[ChromaDB] No se pudo eliminar colección (puede no existir)")
            except Exception as e:
                print(f"[ChromaDB] Error al eliminar colección: {str(e)}")
            
            # Crear nueva base de datos limpia
            if all_chunks and all_metas:
                print(f"[ChromaDB] Recreando base con {len(all_chunks)} chunks...")
                new_db = Chroma.from_documents(  # type: ignore[misc]
                    all_chunks, 
                    embedding=self.embeddings, 
                    persist_directory=self.persist_directory
                )
                self.db = new_db
                print("[ChromaDB] Reconstrucción completada exitosamente")
            else:
                # Si no hay documentos, crear base vacía
                print("[ChromaDB] Creando base de datos vacía...")
                self.db = Chroma(
                    persist_directory=self.persist_directory, 
                    embedding_function=self.embeddings
                )
                print("[ChromaDB] Base de datos vacía creada")
                
        except Exception as e:
            print(f"[ChromaDB] Error durante reconstrucción: {str(e)}")
            # Fallback: intentar recrear base vacía
            try:
                self.db = Chroma(
                    persist_directory=self.persist_directory, 
                    embedding_function=self.embeddings
                )
                print("[ChromaDB] Fallback: base de datos vacía creada")
            except Exception as fallback_error:
                print(f"[ChromaDB] Error crítico en fallback: {str(fallback_error)}")
                raise
    
    def is_persisted(self) -> bool:
        """Verifica si la base de datos está persistida."""
        return os.path.isdir(self.persist_directory) and bool(os.listdir(self.persist_directory))
    
    def get_embeddings(self):
        """Retorna la instancia de embeddings."""
        return self.embeddings
    
    def verify_document_deleted(self, doc_id: str) -> bool:
        """
        Verifica que un documento fue completamente eliminado de ChromaDB.
        
        Args:
            doc_id: ID del documento a verificar
            
        Returns:
            True si el documento fue completamente eliminado
        """
        try:
            results = self.db.get(
                where={"doc_id": doc_id}, 
                include=["metadatas", "documents"]
            )
            
            if not results or not results.get("ids"):
                return True  # No se encontraron documentos, eliminación exitosa
            
            remaining_count = len(results["ids"])
            print(f"[ChromaDB] ADVERTENCIA: {remaining_count} chunks del documento {doc_id} aún existen")
            return False
            
        except Exception as e:
            print(f"[ChromaDB] Error al verificar eliminación: {str(e)}")
            return False
    
    def count_document_chunks(self, doc_id: str) -> int:
        """
        Cuenta cuántos chunks existen para un documento específico.
        
        Args:
            doc_id: ID del documento
            
        Returns:
            Número de chunks encontrados
        """
        try:
            results = self.db.get(
                where={"doc_id": doc_id}, 
                include=["metadatas"]
            )
            
            if not results or not results.get("ids"):
                return 0
            
            return len(results["ids"])
            
        except Exception:
            return 0
    
    def cleanup_embeddings_queue(self) -> bool:
        """
        Limpia la cola de embeddings que podrían quedar después de eliminaciones.
        Implementa múltiples estrategias para evitar vectores vacíos en embeddings_queue.
        
        Returns:
            True si la limpieza fue exitosa
        """
        try:
            print("[ChromaDB] Iniciando limpieza intensiva de cola de embeddings...")
            
            # Estrategia 1: Forzar persistencia múltiple
            success_count = 0
            for attempt in range(3):
                try:
                    if hasattr(self.db, '_client'):
                        client = self.db._client  # type: ignore[attr-defined]
                        
                        # Intentar diferentes métodos de limpieza
                        if hasattr(client, 'persist'):
                            client.persist()  # type: ignore[attr-defined]
                            success_count += 1
                            
                        # Pequeña pausa entre intentos
                        import time
                        time.sleep(0.1)
                        
                except Exception as e:
                    print(f"[ChromaDB] Intento {attempt + 1} de limpieza falló: {str(e)}")
                    continue
            
            if success_count > 0:
                print(f"[ChromaDB] Cola de embeddings limpiada exitosamente ({success_count}/3 intentos)")
                
                # Estrategia 2: Verificar que no hay registros huérfanos
                try:
                    # Intentar obtener registros con metadata vacía o inconsistente
                    all_records = self.db.get(include=["metadatas", "documents"])
                    if all_records and all_records.get("ids"):
                        empty_metadata_count = 0
                        for metadata in all_records.get("metadatas", []):
                            if not metadata or not metadata.get("doc_id"):
                                empty_metadata_count += 1
                        
                        if empty_metadata_count > 0:
                            print(f"[ChromaDB] ADVERTENCIA: {empty_metadata_count} registros con metadata vacía detectados")
                            # Estos registros problemáticos requerirían reconstrucción de la base
                            return False
                        
                except Exception as e:
                    print(f"[ChromaDB] Error al verificar registros huérfanos: {str(e)}")
                
                return True
            else:
                print("[ChromaDB] No se pudo acceder a métodos de limpieza de cola")
                return False
                
        except Exception as e:
            print(f"[ChromaDB] Error al limpiar cola de embeddings: {str(e)}")
            return False
    
    def get_document_hash(self, doc_id: str) -> Optional[str]:
        """
        Obtiene un hash del documento para detectar duplicados.
        
        Args:
            doc_id: ID del documento
            
        Returns:
            Hash del contenido del documento o None si no existe
        """
        try:
            results = self.db.get(
                where={"doc_id": doc_id}, 
                include=["documents", "metadatas"]
            )
            
            if not results or not results.get("documents"):
                return None
            
            # Crear hash basado en el contenido de todos los chunks
            import hashlib
            content = "".join(results["documents"])
            return hashlib.md5(content.encode()).hexdigest()
            
        except Exception as e:
            print(f"[ChromaDB] Error al obtener hash del documento: {str(e)}")
            return None
