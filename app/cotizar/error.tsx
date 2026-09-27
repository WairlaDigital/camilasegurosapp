"use client";

import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Button, buttonVariants } from "@/components/ui/button";

// Shown when a flow screen cannot load its data (e.g. the catalog API is down).
export default function QuoteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container className="flex flex-col items-center gap-6 py-24 text-center">
      <h1 className="text-subtitle font-medium text-ink-strong lg:text-title">No pudimos cargar esta página</h1>
      <p className="max-w-md text-ink-muted">Puede ser un problema momentáneo. Inténtalo de nuevo en unos segundos.</p>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={reset}>Reintentar</Button>
        <Link href="/" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Volver al inicio
        </Link>
      </div>
    </Container>
  );
}
