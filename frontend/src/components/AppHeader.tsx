import { ThemeToggle } from "@/components/ThemeToggle";

export function AppHeader() {
  return (
    <div className="relative text-center mb-8 animate-in fade-in-0 slide-in-from-top-4 duration-700">
      {/* Theme Toggle Button - Positioned absolute in top right */}
      <div className="absolute top-0 right-0">
        <ThemeToggle />
      </div>

      <h1 className="text-4xl font-bold text-foreground mb-2 text-balance">
        Habla con tu PDF
      </h1>
      <p className="text-lg text-muted-foreground text-pretty">
        Sube tus documentos PDF y haz preguntas inteligentes sobre su contenido
      </p>
    </div>
  );
}
