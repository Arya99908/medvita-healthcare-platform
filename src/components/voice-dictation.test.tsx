import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import VoiceDictation from "./voice-dictation";

afterEach(() => {
  cleanup();
  delete (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition;
  delete (window as Window & { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
});

describe("voice dictation", () => {
  it("inserts a final transcript into the chosen note field and exposes Indian languages", () => {
    let recognitionLanguage = "";
    let resultHandler: ((event: unknown) => void) | null = null;
    const start = vi.fn();
    class MockRecognition {
      private currentLanguage = "";
      continuous = false;
      interimResults = false;
      get lang() { return this.currentLanguage; }
      set lang(value: string) { this.currentLanguage = value; recognitionLanguage = value; }
      get onresult() { return resultHandler; }
      set onresult(value: ((event: unknown) => void) | null) { resultHandler = value; }
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start = start;
      stop = vi.fn();
      abort = vi.fn();
    }
    (window as Window & { SpeechRecognition?: unknown }).SpeechRecognition = MockRecognition;
    document.body.innerHTML = '<textarea id="dictation-target">Existing note</textarea>';
    const target = document.querySelector<HTMLTextAreaElement>("#dictation-target")!;
    render(<VoiceDictation targetId="dictation-target" />);

    expect(screen.getByRole("option", { name: "Hindi" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Kannada" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Spoken language"), { target: { value: "kn-IN" } });
    expect(window.localStorage.getItem("medvita-voice-language")).toBe("kn-IN");
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));

    expect(recognitionLanguage).toBe("kn-IN");
    act(() => resultHandler?.({ results: [{ isFinal: true, 0: { transcript: "follow up tomorrow" } }] }));
    expect(start).toHaveBeenCalledTimes(1);
    expect(target.value).toBe("Existing note follow up tomorrow");
    expect(screen.getByText(/MedVita does not receive or save the audio/)).toBeTruthy();
  });

  it("keeps typing available when speech recognition is unsupported", () => {
    document.body.innerHTML = '<textarea id="dictation-fallback"></textarea>';
    render(<VoiceDictation targetId="dictation-fallback" />);
    fireEvent.click(screen.getByRole("button", { name: "Start voice input" }));
    expect(screen.getByRole("status").textContent).toMatch(/not supported/i);
    expect(document.querySelector("#dictation-fallback")).toBeTruthy();
  });
});
