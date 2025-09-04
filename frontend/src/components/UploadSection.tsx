import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload } from "lucide-react";

interface UploadSectionProps {
  isDragOver: boolean;
  isLoadingDocuments: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function UploadSection({
  isDragOver,
  isLoadingDocuments,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}: UploadSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-left-4 duration-700 delay-100">
      <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 transition-transform group-hover:scale-110" />
            Subir Documentos
          </CardTitle>
          <CardDescription>
            Arrastra y suelta tus archivos PDF o haz clic para seleccionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
              isDragOver
                ? "border-primary bg-primary/10 scale-105 shadow-lg"
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <Upload
              className={`h-12 w-12 mx-auto mb-4 text-muted-foreground transition-all duration-300 ${
                isDragOver ? "text-primary scale-110" : "group-hover:scale-105"
              }`}
            />
            <p className="text-lg font-medium mb-2">Arrastra tus PDFs aquí</p>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar archivos
            </p>
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
            />
            <Button
              asChild
              className="transition-all duration-200 hover:scale-105"
            >
              <label htmlFor="file-upload" className="cursor-pointer">
                Seleccionar Archivos
              </label>
            </Button>
          </div>
          <div className="mt-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  isLoadingDocuments
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-green-500"
                }`}
              />
              <p className="text-xs text-muted-foreground">
                Backend:{" "}
                {isLoadingDocuments ? "Conectando..." : "localhost:8000"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
