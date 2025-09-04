from typing import List, Dict, Any
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document

from src.config import settings


class PDFProcessor:
    """Maneja el procesamiento y división de documentos PDF."""
    
    def __init__(self):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP,
            separators=["\n\n", "\n", ".", " ", ""],
        )
    
    def load_and_split_pdf(self, file_path: str) -> List[Document]:
        """
        Carga un PDF y lo divide en chunks.
        
        Args:
            file_path: Ruta al archivo PDF
            
        Returns:
            Lista de documentos divididos en chunks
            
        Raises:
            FileNotFoundError: Si el archivo no existe
            RuntimeError: Si no se pueden extraer chunks del PDF
        """
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"El archivo {file_path} no existe")
        
        try:
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            chunks = self.splitter.split_documents(docs)
            
            if not chunks:
                raise RuntimeError("No se pudieron extraer chunks del PDF")
                
            return chunks
            
        except Exception as e:
            raise RuntimeError(f"Error al procesar PDF {file_path}: {str(e)}")
    
    def create_metadata(self, doc_id: str, filename: str, num_chunks: int) -> List[Dict[str, Any]]:
        """
        Crea metadatos para los chunks de un documento.
        
        Args:
            doc_id: ID único del documento
            filename: Nombre del archivo
            num_chunks: Número de chunks
            
        Returns:
            Lista de metadatos para cada chunk
        """
        return [
            {
                "doc_id": doc_id, 
                "filename": filename, 
                "chunk_index": str(i),  # Convertir a string para consistencia
                "total_chunks": str(num_chunks),  # Total de chunks como string
                "document_type": "pdf"  # Tipo de documento
            } 
            for i in range(num_chunks)
        ]
    
    def generate_chunk_ids(self, doc_id: str, num_chunks: int) -> List[str]:
        """
        Genera IDs únicos para los chunks de un documento.
        
        Args:
            doc_id: ID único del documento
            num_chunks: Número de chunks
            
        Returns:
            Lista de IDs únicos para cada chunk
        """
        return [f"{doc_id}_{i}" for i in range(num_chunks)]
    
    def count_pdf_pages(self, file_path: str) -> int:
        """
        Cuenta el número de páginas de un archivo PDF.
        
        Args:
            file_path: Ruta al archivo PDF
            
        Returns:
            Número de páginas del PDF
            
        Raises:
            FileNotFoundError: Si el archivo no existe
            RuntimeError: Si no se puede leer el PDF
        """
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"El archivo {file_path} no existe")
        
        try:
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            
            # Cada documento en la lista representa una página
            return len(docs)
            
        except Exception as e:
            # Fallback: intentar con PyPDF2 directamente si PyPDFLoader falla
            try:
                try:
                    import PyPDF2  # type: ignore
                except ImportError:
                    raise RuntimeError(f"Error al contar páginas del PDF {file_path}: PyPDF2 no disponible: {str(e)}")
                
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)  # type: ignore
                    return len(pdf_reader.pages)  # type: ignore
            except Exception:
                raise RuntimeError(f"Error al contar páginas del PDF {file_path}: {str(e)}")
    
    def get_pdf_info(self, file_path: str) -> Dict[str, Any]:
        """
        Obtiene información completa de un archivo PDF (páginas y chunks).
        
        Args:
            file_path: Ruta al archivo PDF
            
        Returns:
            Diccionario con información del PDF (pages, chunks)
            
        Raises:
            FileNotFoundError: Si el archivo no existe
            RuntimeError: Si no se puede procesar el PDF
        """
        import os
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"El archivo {file_path} no existe")
        
        try:
            loader = PyPDFLoader(file_path)
            docs = loader.load()
            chunks = self.splitter.split_documents(docs)
            
            return {
                "pages": len(docs),
                "chunks": chunks
            }
            
        except Exception as e:
            raise RuntimeError(f"Error al obtener información del PDF {file_path}: {str(e)}")