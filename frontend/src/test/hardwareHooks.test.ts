import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useBarcodeScanner } from "@/shared/hooks/useBarcodeScanner";
import { useKeyboardShortcuts } from "@/shared/hooks/useKeyboardShortcuts";

describe("useBarcodeScanner", () => {
  it("debe capturar ráfagas rápidas de pistola USB que terminan con Enter", () => {
    const onScan = vi.fn();
    renderHook(() =>
      useBarcodeScanner({ onScan, maxIntervalMs: 50, minLength: 3 }),
    );

    // Simula ráfaga rápida (<50ms entre caracteres)
    const barcode = "77012345";
    for (const char of barcode) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: char }));
    }
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("77012345");
  });
});

describe("useKeyboardShortcuts", () => {
  it("debe ejecutar la acción asociada a una tecla de función como F2", () => {
    const onF2 = vi.fn();
    renderHook(() => useKeyboardShortcuts({ F2: onF2 }));

    const event = new KeyboardEvent("keydown", { key: "F2", cancelable: true });
    window.dispatchEvent(event);

    expect(onF2).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);
  });
});
