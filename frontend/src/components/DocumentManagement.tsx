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
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterOption, LocalDocument, SortOption } from "@/lib/types";
import { formatDate, formatFileSize } from "@/lib/utils/formatting";
import { getStatusBadge } from "@/lib/utils/statusUtils";
import {
  Calendar,
  Download,
  FileText,
  Filter,
  Loader2,
  MoreVertical,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";

interface DocumentManagementProps {
  documents: LocalDocument[];
  filteredAndSortedDocuments: LocalDocument[];
  isLoadingDocuments: boolean;
  searchQuery: string;
  sortBy: SortOption;
  filterBy: FilterOption;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: SortOption) => void;
  onFilterChange: (filter: FilterOption) => void;
  onLoadDocuments: () => void;
  onDeleteAllDocuments: () => void;
  onDeleteDocument: (id: string) => void;
  onDownloadDocument: (id: string, filename: string) => void;
}

export function DocumentManagement({
  documents,
  filteredAndSortedDocuments,
  isLoadingDocuments,
  searchQuery,
  sortBy,
  filterBy,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onLoadDocuments,
  onDeleteAllDocuments,
  onDeleteDocument,
  onDownloadDocument,
}: DocumentManagementProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700 delay-200">
      <Card className="hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mis Documentos ({filteredAndSortedDocuments.length})
                {isLoadingDocuments && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </CardTitle>
              <CardDescription>
                Gestiona tus documentos PDF subidos
              </CardDescription>
            </div>
            {documents.length > 0 && (
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
                    onClick={onLoadDocuments}
                    className="hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDeleteAllDocuments}
                    className="text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar todos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 && (
            <div className="space-y-4 mb-6 animate-in fade-in-0 slide-in-from-top-2 duration-500">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors" />
                  <Input
                    placeholder="Buscar documentos..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select
                  value={filterBy}
                  onValueChange={(value: FilterOption) => onFilterChange(value)}
                >
                  <SelectTrigger className="w-[140px] transition-all duration-200 hover:scale-105">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ready">Listos</SelectItem>
                    <SelectItem value="processing">Procesando</SelectItem>
                    <SelectItem value="failed">Con errores</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(value: SortOption) => onSortChange(value)}
                >
                  <SelectTrigger className="w-[140px] transition-all duration-200 hover:scale-105">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="name">Nombre</SelectItem>
                    <SelectItem value="size">Tamaño</SelectItem>
                    <SelectItem value="status">Estado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {documents.length === 0 && !isLoadingDocuments ? (
            <div className="text-center py-8 animate-in fade-in-0 zoom-in-95 duration-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">No hay documentos aún</p>
              <p className="text-sm text-muted-foreground">
                Sube tu primer PDF para comenzar
              </p>
            </div>
          ) : isLoadingDocuments ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
              <p className="text-muted-foreground animate-pulse">
                Cargando documentos...
              </p>
            </div>
          ) : filteredAndSortedDocuments.length === 0 ? (
            <div className="text-center py-8 animate-in fade-in-0 zoom-in-95 duration-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
              <p className="text-muted-foreground">
                No se encontraron documentos
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta con otros términos de búsqueda
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedDocuments.map((doc, index) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] animate-in fade-in-0 slide-in-from-left-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-8 w-8 text-primary flex-shrink-0 transition-transform hover:scale-110" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{doc.name}</p>
                        <div className="animate-in fade-in-0 zoom-in-95 duration-300">
                          {getStatusBadge(doc.status)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.pages && <span>{doc.pages} páginas</span>}
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(doc.uploadedAt)}</span>
                        </div>
                      </div>
                      {doc.status === "processing" &&
                        doc.uploadProgress !== undefined && (
                          <div className="animate-in fade-in-0 slide-in-from-left-2 duration-300">
                            <Progress
                              value={doc.uploadProgress}
                              className="mt-2 h-1"
                            />
                          </div>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.status === "ready" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDownloadDocument(doc.id, doc.name)}
                        className="text-muted-foreground hover:text-primary transition-all duration-200 hover:scale-110"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteDocument(doc.id)}
                      className="text-muted-foreground hover:text-destructive transition-all duration-200 hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
