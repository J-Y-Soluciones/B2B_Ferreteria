//src/shared/components/ui/BottomHotkeyBar.tsx
export interface HotkeyItem {
  readonly key: string;
  readonly label: string;
  readonly action?: () => void;
  readonly disabled?: boolean;
}

export interface BottomHotkeyBarProps {
  readonly hotkeys: readonly HotkeyItem[];
}

export function BottomHotkeyBar({ hotkeys }: BottomHotkeyBarProps) {
  return (
    <footer className="h-10 border-t border-border-subtle bg-surface/90 backdrop-blur-md px-4 flex items-center justify-between text-xs font-mono select-none shrink-0 z-30">
      <div className="flex items-center gap-4 overflow-x-auto py-1">
        {hotkeys.map((hk) => (
          <button
            key={hk.key}
            type="button"
            onClick={hk.action}
            disabled={hk.disabled}
            className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded transition-colors ${
              hk.disabled
                ? "opacity-40 cursor-not-allowed text-foreground-muted"
                : "hover:bg-surface-elevated text-foreground-secondary hover:text-foreground active:scale-95"
            }`}
          >
            <kbd className="bg-surface-elevated border border-border-strong text-brand font-bold px-1.5 py-0.5 rounded shadow-xs">
              {hk.key}
            </kbd>
            <span>{hk.label}</span>
          </button>
        ))}
      </div>
      <div className="hidden sm:flex items-center gap-2 text-foreground-muted text-[11px]">
        <span>JYPoS Core v1.0.0</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Terminal
          Listo
        </span>
      </div>
    </footer>
  );
}
