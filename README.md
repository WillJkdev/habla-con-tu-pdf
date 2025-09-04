# 📄 Habla con tu PDF - Sistema RAG Completo

<div style="display: flex; align-items: center; justify-content: center; gap: 20px; margin: 40px 0;">
  <img src="https://img.icons8.com/color/48/pdf.png" alt="PDF" width="48" height="48" />
  <span style="font-size: 24px;">+</span>
  <img src="https://img.icons8.com/color/48/artificial-intelligence.png" alt="AI" width="48" height="48" />
</div>

Una aplicación completa de inteligencia artificial que permite subir documentos PDF y hacer preguntas inteligentes sobre su contenido utilizando tecnología RAG (Retrieval-Augmented Generation). Construida con **FastAPI** como backend y **Next.js** como frontend, ofrece una experiencia moderna e intuitiva para interactuar con tus documentos.

## 🏗️ Arquitectura del Proyecto

Este proyecto está estructurado en dos partes principales:

### 🎯 Backend (FastAPI + RAG)

- **Framework**: FastAPI para API REST moderna
- **IA**: Google Gemini para chat y embeddings
- **RAG**: LangChain para recuperación aumentada
- **Base de datos vectorial**: ChromaDB para búsqueda semántica
- **Procesamiento**: PyPDF para extracción de texto
- **Gestión asíncrona**: Procesamiento en segundo plano

### 🎨 Frontend (Next.js + TypeScript)

- **Framework**: Next.js 15 con App Router
- **Lenguaje**: TypeScript para type safety
- **UI/UX**: Tailwind CSS + Radix UI
- **Estado**: React hooks para gestión local
- **Temas**: Modo oscuro/claro integrado

## ✨ Características Principales

- **📄 Carga de PDFs**: Subida con drag & drop y procesamiento automático
- **🤖 Chat Inteligente**: Conversación natural sobre el contenido de documentos
- **🔍 Búsqueda Semántica**: Encuentra información relevante usando embeddings vectoriales
- **💾 Gestión de Documentos**: CRUD completo con filtrado y ordenamiento
- **📱 Responsive Design**: Optimizado para desktop y móvil
- **🌙 Modo Oscuro/Claro**: Toggle de tema integrado
- **💬 Historial de Chat**: Conversaciones persistentes por documento
- **⚡ Procesamiento Asíncrono**: Indexación en segundo plano
- **🚫 Detección de Duplicados**: Evita procesar archivos repetidos

## 🚀 Inicio Rápido

### Prerrequisitos

- Python 3.13+
- Node.js 18+
- npm o yarn
- Clave API de Google AI (Gemini)
- Git

### Instalación

1. **Clona el repositorio**

   ```bash
   git clone <url-del-repositorio>
   cd habla_con_tu_PDF
   ```

2. **Configura el Backend**

   ```bash
   cd backend
   
   # Con Poetry (recomendado)
   poetry install
   poetry env activate
   
   # O con pip
   pip install -r requirements.txt
   
   # Configura variables de entorno
   echo "GOOGLE_API_KEY=tu_clave_api_de_google" > .env
   
   # Inicia el servidor
   poetry run fastapi dev src/main.py
   ```

3. **Configura el Frontend**

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Obtén tu clave API de Google**
   - Ve a [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Crea una nueva clave API
   - Agrégala al archivo `.env` del backend

5. **Accede a las aplicaciones**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - Documentación API: [http://localhost:8000/docs](http://localhost:8000/docs)

## 📚 Documentación

### [📖 Backend - FastAPI](./backend/README.md)

Documentación completa del backend con FastAPI, incluyendo:

- Sistema RAG con LangChain
- API REST y endpoints
- Configuración de IA (Google Gemini)
- Base de datos vectorial (ChromaDB)
- Procesamiento de PDFs

### [🎨 Frontend - Next.js](./frontend/README.md)

Documentación del frontend con Next.js, incluyendo:

- Interfaz moderna y responsiva
- Gestión de documentos PDF
- Chat inteligente con IA
- Temas oscuro/claro
- Componentes UI con Radix

## 🛠️ Stack Tecnológico

### Backend

- **FastAPI** - Framework web moderno
- **Google Gemini** - IA para chat y embeddings
- **LangChain** - Framework RAG
- **ChromaDB** - Base de datos vectorial
- **PyPDF** - Procesamiento de PDFs
- **Poetry** - Gestión de dependencias

### Frontend

- **Next.js 15** - Framework React
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Estilos modernos
- **Radix UI** - Componentes accesibles
- **Lucide React** - Iconos
- **Sonner** - Notificaciones toast
- **next-themes** - Gestión de temas

## 📁 Estructura del Proyecto

```
habla_con_tu_PDF/
├── backend/           # FastAPI + RAG
│   ├── src/
│   │   ├── main.py           # Punto de entrada
│   │   ├── config.py         # Configuración
│   │   ├── models/           # Modelos Pydantic
│   │   ├── routes/           # Endpoints API
│   │   ├── services/         # Lógica de negocio
│   │   ├── db/               # ChromaDB
│   │   └── utils/            # Utilidades
│   ├── data/pdfs/           # Almacenamiento PDFs
│   ├── chroma_db/           # Base de datos vectorial
│   └── README.md
├── frontend/          # Next.js App
│   ├── src/
│   │   ├── app/              # App Router
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # Utilidades y API
│   └── README.md
└── README.md         # Este archivo
```

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🔗 Enlaces Útiles

- **Documentación FastAPI**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)
- **Documentación Next.js**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Google AI Studio**: [https://makersuite.google.com/](https://makersuite.google.com/)
- **LangChain**: [https://python.langchain.com/](https://python.langchain.com/)
- **ChromaDB**: [https://www.trychroma.com/](https://www.trychroma.com/)
- **Tailwind CSS**: [https://tailwindcss.com/](https://tailwindcss.com/)
- **Radix UI**: [https://www.radix-ui.com/](https://www.radix-ui.com/)

## 📞 Soporte

Si tienes alguna pregunta o problema:

- Abre un issue en GitHub
- Revisa la documentación específica de cada parte
- Consulta las guías de instalación
- Verifica que tengas la clave API de Google AI configurada

## 🚨 Solución de Problemas Comunes

### Error: "Falta GOOGLE_API_KEY en .env"
- Asegúrate de tener el archivo `.env` en la carpeta `backend/` con tu clave API

### Error de memoria con PDFs grandes
- Reduce `CHUNK_SIZE` en `backend/src/config.py`
- Considera dividir PDFs muy grandes

### Problemas con ChromaDB
- Elimina la carpeta `backend/chroma_db/` para reiniciar la base de datos
- Verifica permisos de escritura en el directorio

### Frontend no se conecta al backend
- Verifica que el backend esté ejecutándose en `http://localhost:8000`
- Revisa la configuración de CORS en `backend/src/main.py`

---

Desarrollado con ❤️ usando **FastAPI + Next.js + Google Gemini**

**Tecnologías**: RAG + LangChain + ChromaDB + TypeScript
