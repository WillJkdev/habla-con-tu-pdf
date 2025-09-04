import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "processing":
      return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
    case "ready":
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-destructive" />;
    default:
      return null;
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case "processing":
      return "Procesando...";
    case "ready":
      return "Listo";
    case "failed":
      return "Error";
    default:
      return status;
  }
};

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "processing":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 flex items-center gap-1"
        >
          {getStatusIcon(status)}
          {getStatusText(status)}
        </Badge>
      );
    case "ready":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 flex items-center gap-1"
        >
          {getStatusIcon(status)}
          {getStatusText(status)}
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          {getStatusIcon(status)}
          {getStatusText(status)}
        </Badge>
      );
    default:
      return null;
  }
};
