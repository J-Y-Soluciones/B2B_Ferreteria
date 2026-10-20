import { useEffect } from "react";

export type ShortcutAction = (e: KeyboardEvent) => void;

export interface ShortcutMap {
  [key: string]: ShortcutAction;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // Permitir siempre la recarga nativa con Ctrl+R, Cmd+R o F5 nativo
      if (e.key === "F5" && (e.ctrlKey || e.metaKey || !shortcuts["F5"])) {
        return;
      }

      // Si el usuario presiona F5 simple y no queremos bloquear la recarga durante testing:
      if (e.key === "F5" && !e.altKey) {
        // Dejar pasar al navegador para reload natural
        return;
      }

      const isFunctionKey = /^F[1-9]|F1[0-2]$/.test(e.key);
      const isEscape = e.key === "Escape";

      if (isInput && !isFunctionKey && !isEscape) {
        return;
      }

      const key = e.key;
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key](e);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
