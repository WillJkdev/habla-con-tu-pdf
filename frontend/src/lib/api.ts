import type {
  ApiResponse,
  AskRequest,
  AskResponse,
  DeleteResponse,
  StatusResponse,
  UploadResponse,
} from "./types";

const API_BASE_URL = "http://localhost:8000";

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  async uploadDocument(file: File): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/rag/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error("Upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  async getDocumentStatus(): Promise<ApiResponse<StatusResponse>> {
    return this.request<StatusResponse>("/rag/status");
  }

  async deleteDocument(docId: string): Promise<ApiResponse<DeleteResponse>> {
    return this.request<DeleteResponse>(`/rag/documents/${docId}`, {
      method: "DELETE",
    });
  }

  async askQuestion(request: AskRequest): Promise<ApiResponse<AskResponse>> {
    return this.request<AskResponse>("/rag/ask", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async downloadDocument(
    docId: string,
    filename: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/rag/documents/${docId}/download`
      );

      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Crear URL temporal para el blob
      const url = window.URL.createObjectURL(blob);

      // Crear elemento <a> temporal para iniciar la descarga
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      console.error("Download failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }
}

export const apiService = new ApiService();
