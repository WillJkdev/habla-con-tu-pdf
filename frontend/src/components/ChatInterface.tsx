import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage, LocalDocument } from "@/lib/types";
import { formatTime } from "@/lib/utils/formatting";
import {
  Bot,
  MessageCircle,
  MoreVertical,
  RefreshCw,
  Send,
  Trash2,
  User,
} from "lucide-react";
import { RefObject } from "react";

interface ChatInterfaceProps {
  chatMessages: ChatMessage[];
  currentMessage: string;
  selectedDocumentId: string;
  isTyping: boolean;
  readyDocuments: LocalDocument[];
  chatScrollRef: RefObject<HTMLDivElement | null>;
  onMessageChange: (message: string) => void;
  onDocumentChange: (documentId: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onClearChat: () => void;
  onClearAllHistory: () => void;
}

export function ChatInterface({
  chatMessages,
  currentMessage,
  selectedDocumentId,
  isTyping,
  readyDocuments,
  chatScrollRef,
  onMessageChange,
  onDocumentChange,
  onSendMessage,
  onKeyPress,
  onClearChat,
  onClearAllHistory,
}: ChatInterfaceProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-right-4 duration-700 delay-300">
      <Card className="h-[600px] min-h-[600px] flex flex-col hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 transition-transform hover:scale-110" />
                Chat con PDF
              </CardTitle>
              <CardDescription>
                Haz preguntas sobre tus documentos
              </CardDescription>
            </div>
            {chatMessages.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:scale-105 transition-transform"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="animate-in fade-in-0 slide-in-from-top-2 duration-200"
                >
                  <DropdownMenuItem
                    onClick={onClearChat}
                    className="hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Limpiar chat actual
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onClearAllHistory}
                    className="text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpiar todo el historial
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {readyDocuments.length > 0 && (
            <div className="pt-4 animate-in fade-in-0 slide-in-from-top-2 duration-500">
              <Select
                value={selectedDocumentId}
                onValueChange={onDocumentChange}
              >
                <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                  <SelectValue placeholder="Seleccionar documento" />
                </SelectTrigger>
                <SelectContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                  <SelectItem value="all">Todos los documentos</SelectItem>
                  {readyDocuments.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {readyDocuments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center animate-in fade-in-0 zoom-in-95 duration-500">
                <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                <p className="text-muted-foreground mb-2">
                  No hay documentos listos
                </p>
                <p className="text-sm text-muted-foreground">
                  Sube y procesa un PDF para comenzar a chatear
                </p>
              </div>
            </div>
          ) : (
            <>
              {chatMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center animate-in fade-in-0 zoom-in-95 duration-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground mb-2">
                      ¡Comienza la conversación!
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Haz una pregunta sobre{" "}
                      {selectedDocumentId === "all"
                        ? "tus documentos"
                        : "el documento seleccionado"}
                    </p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="flex-1 h-0" ref={chatScrollRef}>
                  <div className="p-4">
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          } animate-in fade-in-0 slide-in-from-bottom-4 duration-500`}
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {message.type === "ai" && (
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 animate-in zoom-in-95 duration-300">
                              <Bot className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                          <div
                            className={`max-w-[calc(100%-3rem)] w-fit rounded-lg px-4 py-2 transition-all duration-300 hover:scale-[1.02] break-words ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground shadow-lg"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {formatTime(message.timestamp)}
                            </p>
                          </div>
                          {message.type === "user" && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 animate-in zoom-in-95 duration-300">
                              <User className="h-4 w-4 text-secondary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex gap-3 justify-start animate-in fade-in-0 slide-in-from-left-4 duration-300">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                          <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-current rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              />
                              <div
                                className="w-2 h-2 bg-current rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              )}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escribe tu pregunta aquí..."
                    value={currentMessage}
                    onChange={(e) => onMessageChange(e.target.value)}
                    onKeyDown={onKeyPress}
                    className="flex-1 min-h-[60px] max-h-[120px] resize-none transition-all duration-200 focus:scale-[1.02]"
                    disabled={isTyping}
                  />
                  <Button
                    onClick={onSendMessage}
                    disabled={!currentMessage.trim() || isTyping}
                    className="self-end transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                  >
                    <Send
                      className={`h-4 w-4 transition-transform ${
                        isTyping ? "animate-pulse" : "hover:translate-x-0.5"
                      }`}
                    />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 animate-in fade-in-0 duration-500 delay-200">
                  Presiona Enter para enviar, Shift+Enter para nueva línea
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
