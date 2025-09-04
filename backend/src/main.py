# src/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.rag_routes import router as rag_router
from src.config import settings

app = FastAPI(title="Habla con tu PDF - API")

# validar API key al arrancar
if not settings.GOOGLE_API_KEY:
    raise RuntimeError("Falta GOOGLE_API_KEY en .env. Añade tu clave y vuelve a ejecutar.")

# Lista de orígenes permitidos
origins = [
    "http://localhost:3000",
    "https://tu-frontend.com",
]

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # ["GET", "POST"] si quieres limitar
    allow_headers=["*"],
)


# incluir las rutas RAG
app.include_router(rag_router, prefix="/rag", tags=["RAG"])
