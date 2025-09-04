import type { ChatMessage } from "./types";

const CHAT_STORAGE_KEY = "pdf-chat-conversations";
const CHAT_HISTORY_VERSION = "1.0";

/**
 * Convierte un timestamp a Date de forma segura
 */
const safeParseDate = (timestamp: string | Date): Date => {
  if (timestamp instanceof Date) {
    return timestamp;
  }

  const date = new Date(timestamp);
  // Verificar si la fecha es válida
  if (isNaN(date.getTime())) {
    console.warn(
      "Timestamp inválido detectado, usando fecha actual:",
      timestamp
    );
    return new Date();
  }

  return date;
};

export interface StoredConversation {
  documentId: string;
  documentName?: string;
  messages: ChatMessage[];
  lastUpdated: string;
}

export interface ChatStorage {
  version: string;
  conversations: Record<string, StoredConversation>;
}

/**
 * Obtiene todas las conversaciones almacenadas
 */
export const getAllConversations = (): ChatStorage => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) {
      return {
        version: CHAT_HISTORY_VERSION,
        conversations: {},
      };
    }

    const parsed = JSON.parse(stored) as ChatStorage;

    // Verificar versión y migrar si es necesario
    if (parsed.version !== CHAT_HISTORY_VERSION) {
      console.log("Migrando formato de conversaciones...");
      return {
        version: CHAT_HISTORY_VERSION,
        conversations: {},
      };
    }

    return parsed;
  } catch (error) {
    console.error("Error al cargar conversaciones:", error);
    return {
      version: CHAT_HISTORY_VERSION,
      conversations: {},
    };
  }
};

/**
 * Obtiene la conversación para un documento específico
 */
export const getConversationByDocument = (
  documentId: string
): ChatMessage[] => {
  const storage = getAllConversations();
  const conversation = storage.conversations[documentId];

  if (!conversation) {
    return [];
  }

  // Convertir timestamps de string a Date al cargar de forma segura
  return conversation.messages.map((message) => ({
    ...message,
    timestamp: safeParseDate(message.timestamp as string | Date),
  }));
};

/**
 * Guarda una conversación para un documento específico
 */
export const saveConversation = (
  documentId: string,
  messages: ChatMessage[],
  documentName?: string
): void => {
  try {
    const storage = getAllConversations();

    storage.conversations[documentId] = {
      documentId,
      documentName,
      messages,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Error al guardar conversación:", error);
  }
};

/**
 * Elimina la conversación de un documento específico
 */
export const deleteConversation = (documentId: string): void => {
  try {
    const storage = getAllConversations();
    delete storage.conversations[documentId];
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    console.error("Error al eliminar conversación:", error);
  }
};

/**
 * Elimina todas las conversaciones
 */
export const clearAllConversations = (): void => {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (error) {
    console.error("Error al limpiar conversaciones:", error);
  }
};

/**
 * Obtiene estadísticas del almacenamiento
 */
export const getStorageStats = () => {
  const storage = getAllConversations();
  const conversationCount = Object.keys(storage.conversations).length;
  let totalMessages = 0;

  Object.values(storage.conversations).forEach((conv) => {
    totalMessages += conv.messages.length;
  });

  return {
    conversationCount,
    totalMessages,
    lastUpdated: Math.max(
      ...Object.values(storage.conversations).map((conv) =>
        new Date(conv.lastUpdated).getTime()
      )
    ),
  };
};

/**
 * Obtiene el tamaño aproximado del almacenamiento en bytes
 */
export const getStorageSize = (): number => {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    return stored ? new Blob([stored]).size : 0;
  } catch (error) {
    console.error("Error al calcular tamaño de almacenamiento:", error);
    return 0;
  }
};
