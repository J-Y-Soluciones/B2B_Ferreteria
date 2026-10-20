import { useEffect, useRef } from "react";

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  maxIntervalMs?: number;
  minLength?: number;
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  maxIntervalMs = 50,
  minLength = 3,
  enabled = true,
}: UseBarcodeScannerOptions): void {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorar teclas modificadoras
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      const currentTime = performance.now();
      const interval = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Si el tiempo entre caracteres excede el umbral, se limpia el buffer (escritura humana manual)
      if (interval > maxIntervalMs) {
        bufferRef.current = "";
      }

      if (event.key === "Enter") {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length >= minLength) {
          // Si el escaneo ocurrió dentro de un input, prevenimos el submit accidental
          event.preventDefault();
          event.stopPropagation();
          onScan(scannedCode);
        }
        bufferRef.current = "";
        return;
      }

      // Acumular caracteres alfanuméricos estándar
      if (event.key.length === 1) {
        // Si el usuario está escribiendo en un input a velocidad humana (>50ms), no acumular
        if (isInput && interval > maxIntervalMs) {
          bufferRef.current = "";
          return;
        }

        bufferRef.current += event.key;
      }
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, [onScan, maxIntervalMs, minLength, enabled]);
}
