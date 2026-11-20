"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";

type RecognitionResultEvent = Event & {
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
};
type RecognitionErrorEvent = Event & { error: string };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;

const languages = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "kn-IN", label: "Kannada" },
];
let memoryVoiceLanguage = "en-IN";

function getSavedLanguage() {
  try {
    const savedLanguage = window.localStorage.getItem("medvita-voice-language");
    const supportedLanguage = languages.find((option) => option.code === savedLanguage)?.code;
    if (supportedLanguage) memoryVoiceLanguage = supportedLanguage;
    return supportedLanguage ?? memoryVoiceLanguage;
  } catch {
    return memoryVoiceLanguage;
  }
}

function subscribeToLanguage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("medvita-voice-language-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("medvita-voice-language-change", callback);
  };
}

export default function VoiceDictation({ targetId }: { targetId: string }) {
  const language = useSyncExternalStore(subscribeToLanguage, getSavedLanguage, () => "en-IN");
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<Recognition | null>(null);
  const startingTextRef = useRef("");

  useEffect(() => () => recognitionRef.current?.abort(), []);

  function changeLanguage(nextLanguage: string) {
    memoryVoiceLanguage = nextLanguage;
    try { window.localStorage.setItem("medvita-voice-language", nextLanguage); } catch {
      // Keep this selection for the current page when browser storage is disabled.
    }
    window.dispatchEvent(new Event("medvita-voice-language-change"));
  }

  function stop() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  function start() {
    const browserWindow = window as Window & {
      SpeechRecognition?: RecognitionConstructor;
      webkitSpeechRecognition?: RecognitionConstructor;
    };
    const SpeechRecognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    const target = document.getElementById(targetId);
    if (!(target instanceof HTMLTextAreaElement)) {
      setMessage("The note field is not available. Close this panel and try again.");
      return;
    }
    if (!SpeechRecognition) {
      setMessage("Voice input is not supported by this browser. You can still type your note.");
      return;
    }

    recognitionRef.current?.abort();
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = false;
    startingTextRef.current = target.value;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      const proposedValue = [startingTextRef.current.trim(), transcript].filter(Boolean).join(startingTextRef.current.trim() ? " " : "");
      const nextValue = target.maxLength >= 0 ? proposedValue.slice(0, target.maxLength) : proposedValue;
      const valueSetter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
      valueSetter?.call(target, nextValue);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      setMessage(nextValue.length < proposedValue.length ? "The transcript reached this note's character limit. Review it before saving." : "Transcript added. Review it before saving.");
    };
    recognition.onerror = (event) => {
      setRecording(false);
      setMessage(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access was not allowed. You can still type your note."
        : event.error === "no-speech"
          ? "No speech was detected. Try again or type your note."
          : "Voice input stopped. Check your browser connection or type your note.");
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    setMessage("Listening. Speak clearly, then choose Stop recording.");
    setRecording(true);
    try {
      recognition.start();
    } catch {
      setRecording(false);
      setMessage("Voice input could not start. Check microphone access or type your note.");
    }
  }

  return <details className="voice-dictation">
    <summary>Use voice input</summary>
    <label htmlFor={`${targetId}-voice-language`}>Spoken language</label>
    <select id={`${targetId}-voice-language`} value={language} onChange={(event) => changeLanguage(event.target.value)} disabled={recording}>
      {languages.map((option) => <option value={option.code} key={option.code}>{option.label}</option>)}
    </select>
    <button className="secondary-button voice-dictation-button" type="button" onClick={recording ? stop : start}>
      {recording ? <><MicOff size={15} /> Stop recording</> : <><Mic size={15} /> Start voice input</>}
    </button>
    <p className="voice-dictation-privacy">Your browser may send audio to its speech service for transcription. MedVita does not receive or save the audio. Check the text before saving.</p>
    {message && <p className="voice-dictation-status" role="status">{message}</p>}
  </details>;
}
