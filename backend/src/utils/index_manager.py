import os
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from threading import Lock


class IndexManager:
    """Maneja el índice JSON de documentos."""
    
    def __init__(self, index_file_path: str):
        self.index_file = index_file_path
        self.index: List[Dict[str, Any]] = []
        self._lock = Lock()
        self._load_index()
    
    def _load_index(self) -> None:
        """Carga el índice desde el archivo JSON."""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, "r", encoding="utf-8") as f:
                    self.index = json.load(f)
            except Exception:
                self.index = []
                self._save_index()
        else:
            self.index = []
            self._save_index()
    
    def _save_index(self) -> None:
        """Guarda el índice en el archivo JSON."""
        try:
            # Crear directorio si no existe
            os.makedirs(os.path.dirname(self.index_file), exist_ok=True)
            
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump(self.index, f, indent=2, ensure_ascii=False)
        except Exception:
            pass
    
    def create_entry(self, doc_id: str, filename: str, file_path: str, status: str = "processing", size: Optional[int] = None, pages: Optional[int] = None) -> Dict[str, Any]:
        """
        Crea una nueva entrada en el índice.
        
        Args:
            doc_id: ID único del documento
            filename: Nombre del archivo
            file_path: Ruta del archivo
            status: Estado inicial del documento
            size: Tamaño del archivo en bytes
            pages: Número de páginas del PDF
            
        Returns:
            La entrada creada
        """
        entry = {
            "doc_id": doc_id,
            "filename": filename,
            "uploaded_at": datetime.now(timezone.utc).isoformat(),
            "indexed_at": None,
            "chunks": 0,
            "path": file_path,
            "status": status,
            "size": size,
            "pages": pages,
        }
        
        with self._lock:
            self.index.append(entry)
            self._save_index()
        
        return entry
    
    def update_entry(self, doc_id: str, **updates: Any) -> bool:
        """
        Actualiza una entrada existente.
        
        Args:
            doc_id: ID del documento a actualizar
            **updates: Campos a actualizar
            
        Returns:
            True si se actualizó exitosamente
        """
        with self._lock:
            for entry in self.index:
                if entry["doc_id"] == doc_id:
                    entry.update(updates)
                    self._save_index()
                    return True
        return False
    
    def mark_as_completed(self, doc_id: str, chunks_count: int) -> bool:
        """
        Marca un documento como completamente indexado.
        
        Args:
            doc_id: ID del documento
            chunks_count: Número de chunks procesados
            
        Returns:
            True si se actualizó exitosamente
        """
        return self.update_entry(
            doc_id,
            indexed_at=datetime.now(timezone.utc).isoformat(),
            chunks=chunks_count,
            status="ready"
        )
    
    def mark_as_failed(self, doc_id: str) -> bool:
        """
        Marca un documento como fallido.
        
        Args:
            doc_id: ID del documento
            
        Returns:
            True si se actualizó exitosamente
        """
        return self.update_entry(doc_id, status="failed")
    
    def delete_entry(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Elimina una entrada del índice.
        
        Args:
            doc_id: ID del documento a eliminar
            
        Returns:
            La entrada eliminada o None si no se encontró
        """
        with self._lock:
            for i, entry in enumerate(self.index):
                if entry["doc_id"] == doc_id:
                    deleted_entry = self.index.pop(i)
                    self._save_index()
                    return deleted_entry
        return None
    
    def get_entry(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene una entrada específica.
        
        Args:
            doc_id: ID del documento
            
        Returns:
            La entrada o None si no se encuentra
        """
        for entry in self.index:
            if entry["doc_id"] == doc_id:
                return entry
        return None
    
    def get_all_entries(self) -> List[Dict[str, Any]]:
        """
        Obtiene todas las entradas del índice.
        
        Returns:
            Lista con todas las entradas
        """
        return self.index.copy()
    
    def get_oldest_entry(self) -> Optional[Dict[str, Any]]:
        """
        Obtiene la entrada más antigua basada en uploaded_at.
        
        Returns:
            La entrada más antigua o None si el índice está vacío
        """
        if not self.index:
            return None
        
        return min(self.index, key=lambda e: e["uploaded_at"])
    
    def count_entries(self) -> int:
        """
        Cuenta el número total de entradas.
        
        Returns:
            Número de entradas en el índice
        """
        return len(self.index)
    
    def cleanup_failed_entries(self) -> List[str]:
        """
        Elimina todas las entradas con status='failed'.
        
        Returns:
            Lista de doc_ids eliminados
        """
        removed_ids: List[str] = []
        with self._lock:
            original_count = len(self.index)
            self.index = [e for e in self.index if e.get("status") != "failed"]
            
            if len(self.index) < original_count:
                self._save_index()
                            
        return removed_ids
    
    def enforce_max_documents(self, max_docs: int, current_doc_id: Optional[str] = None) -> Optional[str]:
        """
        Aplica el límite máximo de documentos eliminando el más antiguo si es necesario.
        
        Args:
            max_docs: Número máximo de documentos permitidos
            current_doc_id: ID del documento recién agregado (no se eliminará)
            
        Returns:
            doc_id del documento eliminado o None si no se eliminó ninguno
        """
        with self._lock:
            if len(self.index) <= max_docs:
                return None
            
            oldest = self.get_oldest_entry()
            if not oldest:
                return None
            
            # No eliminar el documento recién agregado
            if current_doc_id and oldest["doc_id"] == current_doc_id:
                return None
            
            # Eliminar el documento más antiguo
            deleted_entry = self.delete_entry(oldest["doc_id"])
            return deleted_entry["doc_id"] if deleted_entry else None
    
    def find_entries_by_status(self, status: str) -> List[Dict[str, Any]]:
        """
        Encuentra todas las entradas con un estado específico.
        
        Args:
            status: Estado a buscar (e.g., 'ready', 'processing', 'failed')
            
        Returns:
            Lista de entradas con el estado especificado
        """
        return [entry for entry in self.index if entry.get("status") == status]
    
    def add_file_hash(self, doc_id: str, file_hash: str) -> bool:
        """
        Agrega el hash de un archivo a su entrada en el índice.
        
        Args:
            doc_id: ID del documento
            file_hash: Hash MD5 del archivo
            
        Returns:
            True si se actualizó exitosamente
        """
        return self.update_entry(doc_id, file_hash=file_hash)
    
    def add_file_size(self, doc_id: str, file_size: int) -> bool:
        """
        Agrega el tamaño de un archivo a su entrada en el índice.
        
        Args:
            doc_id: ID del documento
            file_size: Tamaño del archivo en bytes
            
        Returns:
            True si se actualizó exitosamente
        """
        return self.update_entry(doc_id, size=file_size)
    
    def add_pages_count(self, doc_id: str, pages: int) -> bool:
        """
        Agrega la cantidad de páginas de un PDF a su entrada en el índice.
        
        Args:
            doc_id: ID del documento
            pages: Número de páginas del PDF
            
        Returns:
            True si se actualizó exitosamente
        """
        return self.update_entry(doc_id, pages=pages)
    
    def find_duplicate_by_hash(self, file_hash: str) -> Optional[Dict[str, Any]]:
        """
        Busca un documento existente con el mismo hash de archivo.
        
        Args:
            file_hash: Hash MD5 del archivo a buscar
            
        Returns:
            Entrada del documento duplicado o None si no existe
        """
        for entry in self.index:
            if entry.get("file_hash") == file_hash:
                return entry
        return None
    
    def get_all_file_paths(self) -> List[str]:
        """
        Obtiene todas las rutas de archivos en el índice.
        
        Returns:
            Lista de rutas de archivos
        """
        paths: List[str] = []
        for entry in self.index:
            path = entry.get("path")
            if path:
                paths.append(path)
        return paths
