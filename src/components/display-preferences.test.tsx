import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DisplayPreferencesControl, DisplayPreferencesProvider } from "./display-preferences";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

function renderReader() {
  return render(<DisplayPreferencesProvider><DisplayPreferencesControl /><main><h1>Patient overview</h1><p>Appointments and care notes</p></main></DisplayPreferencesProvider>);
}

describe("read-aloud accessibility control", () => {
  it("reads the visible main content in English and can be stopped", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak, cancel } });
    const utterances: { text: string; lang: string }[] = [];
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      lang = "";
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) { utterances.push(this); }
    });
    renderReader();

    fireEvent.click(document.querySelector(".display-preferences > summary")!);
    fireEvent.click(screen.getByRole("button", { name: "Read page aloud (English)" }));

    expect(utterances[0]?.text).toMatch(/Patient overview.*Appointments and care notes/);
    expect(utterances[0]?.lang).toBe("en-IN");
    expect(speak).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toMatch(/using your device speech voice/i);

    fireEvent.click(screen.getByRole("button", { name: "Stop reading" }));
    expect(cancel).toHaveBeenCalled();
  });

  it("explains when browser speech output is unavailable", () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    vi.stubGlobal("SpeechSynthesisUtterance", undefined);
    renderReader();

    fireEvent.click(document.querySelector(".display-preferences > summary")!);
    fireEvent.click(screen.getByRole("button", { name: "Read page aloud (English)" }));

    expect(screen.getByRole("status").textContent).toMatch(/not supported/i);
    expect(screen.getByText(/device screen reader/i)).toBeTruthy();
  });
});
