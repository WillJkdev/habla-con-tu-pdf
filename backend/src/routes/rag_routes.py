from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from typing import cast, List

from src.services.rag_service import RAGService, get_rag_service
from src.models.schemas import AskRequest, AskResponse, UploadResponse, StatusResponse, DeleteResponse, DocumentEntry

router = APIRouter()


@router.post("/ask", response_model=AskResponse)
async def ask(payload: AskRequest, service: RAGService = Depends(get_rag_service)):
    try:
        answer = service.ask(payload.question, doc_id=payload.doc_id)
        return AskResponse(answer=answer)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/upload", response_model=UploadResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    service: RAGService = Depends(get_rag_service),
):
    try:
        # Usar FileManager para manejar el archivo
        dest_path, original_name = service.file_manager.save_uploaded_file(file)

        # Verificar si es un archivo duplicado ANTES de crear entrada
        file_hash = service.file_manager.calculate_file_hash(dest_path)
        if file_hash:
            duplicate_entry = service.index_manager.find_duplicate_by_hash(file_hash)
            if duplicate_entry:
                # Eliminar archivo duplicado inmediatamente
                service.file_manager.delete_file(dest_path)
                print(f"[Upload] Archivo duplicado detectado, reutilizando: {duplicate_entry['doc_id']}")
                return UploadResponse(
                    uploaded=True, 
                    message=f"Archivo duplicado detectado. Reutilizando documento existente: {duplicate_entry['filename']}", 
                    doc_id=duplicate_entry['doc_id']
                )

        # Crear entrada preliminar y obtener doc_id
        doc_id = service.create_pending_entry(dest_path, original_name)

        # Programar indexación en background pasando doc_id para que se actualice la entrada
        background_tasks.add_task(service.add_pdf_from_path, dest_path, original_name, doc_id)

        return UploadResponse(uploaded=True, message="Upload received; indexing scheduled", doc_id=doc_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/status", response_model=StatusResponse)
def status(service: RAGService = Depends(get_rag_service)):
    s = service.status()
    return StatusResponse(
        documents=cast(List[DocumentEntry], s["documents"]), 
        total=cast(int, s["total"]), 
        chroma_persisted=cast(bool, s["chroma_persisted"])
    )


@router.delete("/documents/{doc_id}", response_model=DeleteResponse)
def delete_document(doc_id: str, service: RAGService = Depends(get_rag_service)):
    ok = service.delete_document(doc_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Document not found")
    return DeleteResponse(deleted=True, doc_id=doc_id)


@router.get("/documents/{doc_id}/download")
def download_document(doc_id: str, service: RAGService = Depends(get_rag_service)):
    """
    Descarga un archivo PDF por su doc_id.
    
    Args:
        doc_id: ID único del documento a descargar
        
    Returns:
        FileResponse con el archivo PDF
        
    Raises:
        HTTPException 404: Si el documento no existe o el archivo no se encuentra
        HTTPException 500: Si hay un error al acceder al archivo
    """
    try:
        # Validar que el documento existe en el índice
        entry = service.index_manager.get_entry(doc_id)
        if not entry:
            raise HTTPException(
                status_code=404, 
                detail=f"Documento con ID '{doc_id}' no encontrado"
            )
        
        # Obtener la ruta del archivo
        file_path = entry.get("path")
        if not file_path:
            raise HTTPException(
                status_code=404, 
                detail=f"Ruta del archivo no disponible para el documento '{doc_id}'"
            )
        
        # Verificar que el archivo existe físicamente
        if not service.file_manager.file_exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"Archivo físico no encontrado para el documento '{doc_id}'"
            )
        
        # Obtener el nombre original del archivo para la descarga
        filename = entry.get("filename", f"documento_{doc_id}.pdf")
        
        # Asegurar que el nombre del archivo tenga extensión .pdf
        if not filename.lower().endswith('.pdf'):
            filename += '.pdf'
        
        # Retornar el archivo con headers apropiados
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Cache-Control": "no-cache",
            }
        )
        
    except HTTPException:
        # Re-lanzar HTTPExceptions ya manejadas
        raise
    except Exception as exc:
        # Manejar cualquier otro error inesperado
        raise HTTPException(
            status_code=500, 
            detail=f"Error interno al descargar el documento: {str(exc)}"
        )
