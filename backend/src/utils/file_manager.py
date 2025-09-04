import os
import shutil
import uuid
from typing import Optional, List
from fastapi import UploadFile


class FileManager:
    """Maneja operaciones de archivos PDF."""
    
    def __init__(self, storage_dir: str):
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
    
    def save_uploaded_file(self, file: UploadFile) -> tuple[str, str]:
        """
        Guarda un archivo subido y retorna la ruta y nombre original.
        
        Args:
            file: Archivo subido via FastAPI
            
        Returns:
            Tupla con (ruta_destino, nombre_original)
        """
        original_name = file.filename or f"{uuid.uuid4()}.pdf"
        dest_name = f"{uuid.uuid4()}_{original_name}"
        dest_path = os.path.join(self.storage_dir, dest_name)
        
        # Guardar archivo en disco
        with open(dest_path, "wb") as out_f:
            shutil.copyfileobj(file.file, out_f)
        
        return dest_path, original_name
    
    def delete_file(self, file_path: Optional[str]) -> bool:
        """
        Elimina un archivo del disco si existe.
        
        Args:
            file_path: Ruta del archivo a eliminar
            
        Returns:
            True si se eliminó exitosamente, False en caso contrario
        """
        if not file_path:
            return False
            
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception:
            pass
        
        return False
    
    def file_exists(self, file_path: str) -> bool:
        """
        Verifica si un archivo existe.
        
        Args:
            file_path: Ruta del archivo
            
        Returns:
            True si el archivo existe
        """
        return os.path.exists(file_path)
    
    def get_safe_filename(self, filename: Optional[str], fallback_extension: str = ".pdf") -> str:
        """
        Genera un nombre de archivo seguro.
        
        Args:
            filename: Nombre original del archivo
            fallback_extension: Extensión por defecto si no se proporciona nombre
            
        Returns:
            Nombre de archivo seguro
        """
        if not filename:
            return f"{uuid.uuid4()}{fallback_extension}"
        
        # Aquí se podrían agregar más validaciones de seguridad
        return filename
    
    def validate_pdf_file(self, file_path: str) -> bool:
        """
        Valida que un archivo sea un PDF válido.
        
        Args:
            file_path: Ruta del archivo a validar
            
        Returns:
            True si es un PDF válido
        """
        if not self.file_exists(file_path):
            return False
        
        # Verificación básica por extensión
        return file_path.lower().endswith('.pdf')
    
    def get_file_size(self, file_path: str) -> Optional[int]:
        """
        Obtiene el tamaño de un archivo en bytes.
        
        Args:
            file_path: Ruta del archivo
            
        Returns:
            Tamaño en bytes o None si el archivo no existe
        """
        try:
            if self.file_exists(file_path):
                return os.path.getsize(file_path)
        except Exception:
            pass
        
        return None
    
    def get_base_filename(self, file_path: str) -> str:
        """
        Obtiene el nombre base de un archivo desde su ruta.
        
        Args:
            file_path: Ruta completa del archivo
            
        Returns:
            Nombre base del archivo
        """
        return os.path.basename(file_path)
    
    def generate_unique_filename(self, original_name: Optional[str] = None, extension: str = ".pdf") -> str:
        """
        Genera un nombre único para un archivo.
        
        Args:
            original_name: Nombre original del archivo (opcional)
            extension: Extensión del archivo
            
        Returns:
            Nombre único del archivo
        """
        if original_name:
            return f"{uuid.uuid4()}_{original_name}"
        else:
            return f"{uuid.uuid4()}{extension}"
    
    def create_full_path(self, filename: str) -> str:
        """
        Crea la ruta completa para un archivo en el directorio de almacenamiento.
        
        Args:
            filename: Nombre del archivo
            
        Returns:
            Ruta completa del archivo
        """
        return os.path.join(self.storage_dir, filename)
    
    def calculate_file_hash(self, file_path: str) -> Optional[str]:
        """
        Calcula el hash MD5 de un archivo para detectar duplicados.
        
        Args:
            file_path: Ruta del archivo
            
        Returns:
            Hash MD5 del archivo o None si hay error
        """
        if not self.file_exists(file_path):
            return None
        
        try:
            import hashlib
            hash_md5 = hashlib.md5()
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception:
            return None
    
    def is_duplicate_file(self, new_file_path: str, existing_files: List[str]) -> Optional[str]:
        """
        Verifica si un archivo es duplicado comparando hashes.
        
        Args:
            new_file_path: Ruta del archivo nuevo
            existing_files: Lista de archivos existentes para comparar
            
        Returns:
            Ruta del archivo duplicado encontrado o None si no hay duplicados
        """
        new_hash = self.calculate_file_hash(new_file_path)
        if not new_hash:
            return None
        
        for existing_file in existing_files:
            if self.file_exists(existing_file):
                existing_hash = self.calculate_file_hash(existing_file)
                if existing_hash and existing_hash == new_hash:
                    return existing_file
        
        return None
