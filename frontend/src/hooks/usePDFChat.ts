import { apiService } from "@/lib/api";
import {
  clearAllConversations,
  deleteConversation,
  getConversationByDocument,
  saveConversation,
} from "@/lib/chat-storage";
import type {
  ChatMessage,
  DocumentEntry,
  FilterOption,
  LocalDocument,
  SortOption,
} from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function usePDFChat() {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const previousDocumentIdRef = useRef<string>(selectedDocumentId);
  const chatMessagesRef = useRef<ChatMessage[]>(chatMessages);
  const isInitialLoadRef = useRef<boolean>(true);
  const isLoadingConversationRef = useRef<boolean>(false);
  const messagesOwnerDocumentRef = useRef<string>(selectedDocumentId);

  // Mantener la referencia de mensajes actualizada
  useEffect(() => {
    chatMessagesRef.current = chatMessages;
  }, [chatMessages]);

  const loadConversationForCurrentDocument = useCallback(() => {
    try {
      isLoadingConversationRef.current = true;
      const messages = getConversationByDocument(selectedDocumentId);
      setChatMessages(messages);

      // Actualizar el propietario de los mensajes cargados
      messagesOwnerDocumentRef.current = selectedDocumentId;

      // Resetear la bandera después de un breve delay para permitir que React procese el cambio
      setTimeout(() => {
        isLoadingConversationRef.current = false;
      }, 50);
    } catch (error) {
      console.error("Error al cargar conversación:", error);
      isLoadingConversationRef.current = false;
      // No mostrar toast de error para no molestar al usuario
    }
  }, [selectedDocumentId]);

  const handleDocumentChange = useCallback(
    (newDocumentId: string) => {
      // Solo guardar si realmente hay mensajes Y no estamos cargando una conversación
      if (chatMessages.length > 0 && !isLoadingConversationRef.current) {
        // Usar el propietario real de los mensajes, no el documento seleccionado actual
        const ownerDocumentId = messagesOwnerDocumentRef.current;
        const ownerDocumentName =
          ownerDocumentId === "all"
            ? "Todos los documentos"
            : documents.find((doc) => doc.id === ownerDocumentId)?.name;

        console.log(
          `Guardando conversación de "${ownerDocumentId}" (propietario real) con ${chatMessages.length} mensajes antes del cambio`
        );
        saveConversation(ownerDocumentId, chatMessages, ownerDocumentName);
      } else {
        console.log(
          `Saltando guardado - mensajes: ${chatMessages.length}, cargando: ${isLoadingConversationRef.current}`
        );
      }

      // Cambiar documento
      setSelectedDocumentId(newDocumentId);
    },
    [chatMessages, documents]
  );

  // Load documents and conversations on component mount
  useEffect(() => {
    loadDocuments();
    loadConversationForCurrentDocument();
    // Marcar que la carga inicial terminó después de un breve delay
    setTimeout(() => {
      isInitialLoadRef.current = false;
    }, 100);
  }, [loadConversationForCurrentDocument]);

  // Load conversation when document selection changes
  useEffect(() => {
    if (previousDocumentIdRef.current !== selectedDocumentId) {
      // Actualizar referencia
      previousDocumentIdRef.current = selectedDocumentId;

      // Cargar nueva conversación
      console.log(`Cargando conversación para "${selectedDocumentId}"`);
      loadConversationForCurrentDocument();

      // Marcar que no estamos en carga inicial después del cambio
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  }, [selectedDocumentId, loadConversationForCurrentDocument]);

  // Auto-save conversations when messages change (only for current document)
  useEffect(() => {
    // Solo auto-guardar si:
    // 1. No estamos en la carga inicial
    // 2. No estamos cargando una conversación
    // 3. Hay mensajes
    // 4. Estamos en el documento correcto
    if (
      !isInitialLoadRef.current &&
      !isLoadingConversationRef.current &&
      chatMessages.length > 0 &&
      previousDocumentIdRef.current === selectedDocumentId
    ) {
      const documentName =
        selectedDocumentId === "all"
          ? "Todos los documentos"
          : documents.find((doc) => doc.id === selectedDocumentId)?.name;

      console.log(
        `Auto-guardando conversación para "${selectedDocumentId}" con ${chatMessages.length} mensajes`
      );
      saveConversation(selectedDocumentId, chatMessages, documentName);
    }
  }, [chatMessages, selectedDocumentId, documents]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      // Only scroll if there are messages and ScrollArea is rendered
      if (chatScrollRef.current && chatMessages.length > 0) {
        // Try multiple selectors to find the viewport
        const viewport =
          (chatScrollRef.current.querySelector(
            "[data-radix-scroll-area-viewport]"
          ) as HTMLElement) ||
          (chatScrollRef.current.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLElement);

        if (viewport) {
          // Use requestAnimationFrame for better performance
          requestAnimationFrame(() => {
            viewport.scrollTo({
              top: viewport.scrollHeight,
              behavior: "smooth",
            });
          });
        }
      }
    };

    // Small delay to ensure DOM is updated and rendered
    const timeoutId = setTimeout(scrollToBottom, 150);
    return () => clearTimeout(timeoutId);
  }, [chatMessages, isTyping]);

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    const toastId = toast.loading("Cargando documentos...");
    try {
      const response = await apiService.getDocumentStatus();
      if (response.success && response.data) {
        // La API devuelve un objeto con la propiedad 'documents'
        const documentsArray = response.data.documents;
        if (Array.isArray(documentsArray)) {
          const apiDocs = documentsArray.map((doc: DocumentEntry) => ({
            id: doc.doc_id,
            name: doc.filename,
            size: doc.size,
            status: doc.status as "processing" | "ready" | "failed",
            uploadedAt: new Date(doc.uploaded_at),
            pages: doc.pages,
          }));
          setDocuments(apiDocs);
          toast.success("Documentos cargados", { id: toastId });
        } else {
          console.error("No se encontró array de documentos:", response.data);
          setDocuments([]);
          toast.success("No hay documentos", { id: toastId });
        }
      } else {
        toast.error("Error al cargar documentos", {
          id: toastId,
          description:
            response.error || "No se pudieron cargar los documentos.",
        });
      }
    } catch (error) {
      console.log("Error al cargar documentos", error);
      toast.error("Error de conexión", {
        id: toastId,
        description:
          "No se pudo conectar con el servidor. Verifica que esté ejecutándose en localhost:8000.",
      });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleFiles = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        // Check for duplicates
        const isDuplicate = documents.some((doc) => doc.name === file.name);
        if (isDuplicate) {
          toast.error("Archivo duplicado", {
            description: `${file.name} ya está en tu biblioteca.`,
          });
          continue;
        }

        // Create temporary document for UI feedback
        const tempDoc: LocalDocument = {
          id: `temp-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          status: "processing",
          uploadProgress: 0,
          uploadedAt: new Date(),
        };

        setDocuments((prev) => [...prev, tempDoc]);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setDocuments((prev) =>
            prev.map((doc) =>
              doc.id === tempDoc.id
                ? {
                    ...doc,
                    uploadProgress: Math.min(
                      (doc.uploadProgress || 0) + 15,
                      90
                    ),
                  }
                : doc
            )
          );
        }, 300);

        try {
          const response = await apiService.uploadDocument(file);

          clearInterval(progressInterval);

          if (response.success && response.data) {
            // Replace temp document with real document data
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === tempDoc.id
                  ? {
                      id: response.data!.doc_id || tempDoc.id,
                      name: file.name,
                      size: file.size,
                      status: "processing",
                      uploadedAt: new Date(),
                      uploadProgress: 100,
                    }
                  : doc
              )
            );

            toast.success("¡Archivo subido!", {
              description: `${file.name} está siendo procesado.`,
            });

            // Poll for status updates if document is still processing
            if (response.data.doc_id) {
              pollDocumentStatus(response.data.doc_id);
            }
          } else {
            // Remove temp document and show error
            setDocuments((prev) => prev.filter((doc) => doc.id !== tempDoc.id));
            toast.error("Error al subir", {
              description:
                response.error || `No se pudo procesar ${file.name}.`,
            });
          }
        } catch (error) {
          console.error("Error al subir archivo", error);
          clearInterval(progressInterval);
          setDocuments((prev) => prev.filter((doc) => doc.id !== tempDoc.id));
          toast.error("Error de conexión", {
            description: "No se pudo conectar con el servidor.",
          });
        }
      }
    },
    [documents]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type === "application/pdf"
      );

      if (files.length === 0) {
        toast.error("Archivo no válido", {
          description: "Por favor, sube solo archivos PDF.",
        });
        return;
      }

      handleFiles(files);
    },
    [handleFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    },
    [handleFiles]
  );

  const pollDocumentStatus = async (docId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) return;

      try {
        const response = await apiService.getDocumentStatus();
        if (response.success && response.data) {
          const updatedDoc = response.data.documents.find(
            (doc: DocumentEntry) => doc.doc_id === docId
          );
          if (updatedDoc && updatedDoc.status !== "processing") {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === docId
                  ? {
                      ...doc,
                      status: updatedDoc.status as
                        | "processing"
                        | "ready"
                        | "failed",
                      pages: updatedDoc.chunks,
                    }
                  : doc
              )
            );

            if (updatedDoc.status === "ready") {
              toast.success("¡Documento listo!", {
                description: `${updatedDoc.filename} está listo para usar.`,
              });
            } else if (updatedDoc.status === "failed") {
              toast.error("Error al procesar", {
                description: `No se pudo procesar ${updatedDoc.filename}.`,
              });
            }
            return;
          }
        }
      } catch (error) {
        console.error("Error polling document status:", error);
      }

      attempts++;
      setTimeout(poll, 10000); // Poll every 10 seconds
    };

    setTimeout(poll, 5000); // Start polling after 5 seconds
  };

  const deleteDocument = async (id: string) => {
    try {
      const response = await apiService.deleteDocument(id);
      if (response.success) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
        // Remove messages related to this document
        setChatMessages((prev) => prev.filter((msg) => msg.documentId !== id));
        // Remove conversation from localStorage
        deleteConversation(id);
        toast.success("Documento eliminado", {
          description: "El documento y su historial han sido eliminados.",
        });
      } else {
        toast.error("Error al eliminar", {
          description: response.error || "No se pudo eliminar el documento.",
        });
      }
    } catch (error) {
      console.error("Error al eliminar documento", error);
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor.",
      });
    }
  };

  const deleteAllDocuments = async () => {
    const deletePromises = documents.map((doc) =>
      apiService.deleteDocument(doc.id)
    );

    try {
      await Promise.all(deletePromises);
      setDocuments([]);
      setChatMessages([]);
      clearAllConversations();
      toast.success("Todos los documentos eliminados", {
        description: "Tu biblioteca y todo el historial han sido limpiados.",
      });
    } catch (error) {
      console.error("Error al eliminar todos los documentos", error);
      toast.error("Error al eliminar", {
        description: "Algunos documentos no pudieron ser eliminados.",
      });
      // Reload documents to get current state
      loadDocuments();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
    messagesOwnerDocumentRef.current = selectedDocumentId; // Reset owner to current document
    deleteConversation(selectedDocumentId);
    toast.success("Chat limpiado", {
      description: "El historial de conversación ha sido eliminado.",
    });
  };

  const clearAllHistory = () => {
    setChatMessages([]);
    messagesOwnerDocumentRef.current = selectedDocumentId; // Reset owner to current document
    clearAllConversations();
    toast.success("Historial completo eliminado", {
      description:
        "Todas las conversaciones han sido eliminadas de todos los documentos.",
    });
  };

  const handleDownloadDocument = async (docId: string, filename: string) => {
    const toastId = toast.loading("Descargando archivo...");

    try {
      const result = await apiService.downloadDocument(docId, filename);

      if (result.success) {
        toast.success("Descarga completada", {
          id: toastId,
          description: `${filename} se ha descargado correctamente.`,
        });
      } else {
        toast.error("Error en la descarga", {
          id: toastId,
          description: result.error || "No se pudo descargar el archivo.",
        });
      }
    } catch (error) {
      console.error("Error al descargar documento:", error);
      toast.error("Error de conexión", {
        id: toastId,
        description: "No se pudo conectar con el servidor.",
      });
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const readyDocuments = documents.filter((doc) => doc.status === "ready");
    if (readyDocuments.length === 0) {
      toast.error("No hay documentos listos", {
        description: "Sube y procesa al menos un PDF antes de hacer preguntas.",
      });
      return;
    }

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: "user",
      content: currentMessage,
      timestamp: new Date(),
      documentId: selectedDocumentId === "all" ? undefined : selectedDocumentId,
    };

    setChatMessages((prev) => [...prev, userMessage]);
    // Actualizar el propietario de los mensajes cuando se agrega un nuevo mensaje
    messagesOwnerDocumentRef.current = selectedDocumentId;

    const questionText = currentMessage;
    setCurrentMessage("");
    setIsTyping(true);

    try {
      const response = await apiService.askQuestion({
        question: questionText,
        doc_id: selectedDocumentId === "all" ? undefined : selectedDocumentId,
      });

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          type: "ai",
          content: response.data.answer,
          timestamp: new Date(),
          documentId:
            selectedDocumentId === "all" ? undefined : selectedDocumentId,
        };

        setChatMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || "No se pudo procesar la pregunta");
      }
    } catch (error) {
      toast.error("Error en el chat", {
        description:
          error instanceof Error
            ? error.message
            : "No se pudo procesar tu pregunta.",
      });

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        type: "ai",
        content:
          "Lo siento, no pude procesar tu pregunta en este momento. Por favor, inténtalo de nuevo.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterBy !== "all") {
      filtered = filtered.filter((doc) => doc.status === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "date":
          return b.uploadedAt.getTime() - a.uploadedAt.getTime();
        case "size":
          return b.size - a.size;
        case "status":
          const statusOrder = { ready: 0, processing: 1, failed: 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [documents, searchQuery, filterBy, sortBy]);

  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  return {
    // State
    documents,
    isDragOver,
    searchQuery,
    sortBy,
    filterBy,
    chatMessages,
    currentMessage,
    selectedDocumentId,
    isTyping,
    isLoadingDocuments,
    readyDocuments,
    filteredAndSortedDocuments,

    // Refs
    chatScrollRef,

    // Actions
    setSearchQuery,
    setSortBy,
    setFilterBy,
    setCurrentMessage,
    handleDocumentChange,
    loadDocuments,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    deleteDocument,
    deleteAllDocuments,
    clearChat,
    clearAllHistory,
    handleDownloadDocument,
    handleSendMessage,
    handleKeyPress,
  };
}
