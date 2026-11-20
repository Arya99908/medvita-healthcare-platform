"use client";

import { Contrast, Settings2, Square, Volume2 } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

type DisplayPreferences = {
  fontScale: number;
  highContrast: boolean;
  changeFontScale: (amount: number) => void;
  toggleHighContrast: () => void;
};

const STORAGE_KEY = "medvita-display-preferences";
const DisplayPreferencesContext = createContext<DisplayPreferences | null>(null);
const DEFAULT_PREFERENCES = { fontScale: 1, highContrast: false };
let cachedRaw: string | null | undefined;
let cachedValue = DEFAULT_PREFERENCES;

function getPreferencesSnapshot() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    const value: unknown = JSON.parse(raw ?? "null");
    if (value && typeof value === "object") {
      const saved = value as { fontScale?: unknown; highContrast?: unknown };
      cachedValue = {
        fontScale: typeof saved.fontScale === "number" && saved.fontScale >= 0.92 && saved.fontScale <= 1.28 ? saved.fontScale : 1,
        highContrast: typeof saved.highContrast === "boolean" ? saved.highContrast : false,
      };
    } else cachedValue = DEFAULT_PREFERENCES;
  } catch {
    cachedRaw = null;
    cachedValue = DEFAULT_PREFERENCES;
  }
  return cachedValue;
}

function subscribeToPreferences(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("medvita-display-preferences-updated", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("medvita-display-preferences-updated", onChange);
  };
}

function savePreferences(value: typeof DEFAULT_PREFERENCES) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  cachedRaw = null;
  window.dispatchEvent(new Event("medvita-display-preferences-updated"));
}

export function DisplayPreferencesProvider({ children }: { children: ReactNode }) {
  const { fontScale, highContrast } = useSyncExternalStore(subscribeToPreferences, getPreferencesSnapshot, () => DEFAULT_PREFERENCES);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
    document.documentElement.classList.toggle("medvita-high-contrast", highContrast);
  }, [fontScale, highContrast]);

  const value: DisplayPreferences = {
    fontScale,
    highContrast,
    changeFontScale: (amount) => savePreferences({ ...getPreferencesSnapshot(), fontScale: Math.max(0.92, Math.min(1.28, Number((getPreferencesSnapshot().fontScale + amount).toFixed(2)))) }),
    toggleHighContrast: () => savePreferences({ ...getPreferencesSnapshot(), highContrast: !getPreferencesSnapshot().highContrast }),
  };

  return <DisplayPreferencesContext.Provider value={value}>{children}</DisplayPreferencesContext.Provider>;
}

export function useDisplayPreferences() {
  const value = useContext(DisplayPreferencesContext);
  if (!value) throw new Error("Display preference controls must be inside DisplayPreferencesProvider.");
  return value;
}

export function DisplayPreferencesControl() {
  const { fontScale, highContrast, changeFontScale, toggleHighContrast } = useDisplayPreferences();
  const [speaking, setSpeaking] = useState(false);
  const [speechMessage, setSpeechMessage] = useState("");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  function stopReading() {
    window.speechSynthesis?.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
  }

  function toggleReadAloud() {
    if (speaking) {
      stopReading();
      return;
    }
    if (!window.speechSynthesis || typeof SpeechSynthesisUtterance !== "function") {
      setSpeechMessage("Read-aloud is not supported by this browser. You can use your device screen reader.");
      return;
    }
    const mainContent = document.querySelector("main");
    const pageText = (mainContent?.innerText ?? mainContent?.textContent)?.replace(/\s+/g, " ").trim();
    if (!pageText) {
      setSpeechMessage("There is no page text available to read yet.");
      return;
    }
    const limit = 8_000;
    const utterance = new SpeechSynthesisUtterance(pageText.slice(0, limit));
    utterance.lang = "en-IN";
    utterance.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = () => {
      setSpeaking(false);
      utteranceRef.current = null;
      setSpeechMessage("Read-aloud stopped. Check your device speech settings or use its screen reader.");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    setSpeechMessage(pageText.length > limit ? "Reading the first part of this page in English." : "Reading this page in English using your device speech voice.");
  }

  return (
    <details className="display-preferences floating">
      <summary aria-label="Open display options"><Settings2 size={17} /><span>Display</span></summary>
      <div className="display-preferences-panel" aria-label="Display options">
        <strong>Display options</strong>
        <div className="display-font-controls" aria-label="Text size">
          <button type="button" aria-label="Decrease text size" onClick={() => changeFontScale(-0.08)} disabled={fontScale <= 0.92}>A−</button>
          <span aria-live="polite">{Math.round(fontScale * 100)}%</span>
          <button type="button" aria-label="Increase text size" onClick={() => changeFontScale(0.08)} disabled={fontScale >= 1.28}>A+</button>
        </div>
        <button className="display-contrast-toggle" type="button" aria-pressed={highContrast} onClick={toggleHighContrast}>
          <Contrast size={16} /> High contrast <span>{highContrast ? "On" : "Off"}</span>
        </button>
        <button className="display-read-aloud" type="button" aria-pressed={speaking} onClick={toggleReadAloud}>
          {speaking ? <Square size={15} /> : <Volume2 size={16} />}{speaking ? "Stop reading" : "Read page aloud (English)"}
        </button>
        {speechMessage && <p className="display-speech-status" role="status">{speechMessage}</p>}
      </div>
    </details>
  );
}
