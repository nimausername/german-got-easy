/**
 * Speaks German text via pre-generated neural MP3 when available,
 * otherwise falls back to the browser Speech Synthesis API.
 */

let activeAudio: HTMLAudioElement | null = null;

/**
 * Stops any in-flight neural or browser speech playback.
 */
export const stopGermanSpeech = (): void => {
  if (typeof window === "undefined") return;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.src = "";
    activeAudio = null;
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Speaks German text with the browser Speech Synthesis API when available.
 */
export const speakGerman = (text: string): void => {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") {
    return;
  }

  const trimmed = text.trim();
  if (!trimmed) return;

  stopGermanSpeech();
  const utterance = new SpeechSynthesisUtterance(trimmed);
  utterance.lang = "de-DE";
  utterance.rate = 0.92;

  const voices = window.speechSynthesis.getVoices();
  const germanVoice =
    voices.find((voice) => voice.lang.toLowerCase().startsWith("de")) ??
    voices.find((voice) => voice.lang.toLowerCase().includes("de"));
  if (germanVoice) {
    utterance.voice = germanVoice;
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Plays pre-generated neural audio when `audioUrl` is set; otherwise browser TTS.
 */
export const playGerman = (text: string, audioUrl?: string | null): void => {
  if (typeof window === "undefined") return;

  const trimmed = text.trim();
  if (!trimmed && !audioUrl) return;

  stopGermanSpeech();

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    activeAudio = audio;
    void audio.play().catch(() => {
      if (activeAudio === audio) {
        activeAudio = null;
      }
      if (trimmed) {
        speakGerman(trimmed);
      }
    });
    audio.addEventListener(
      "ended",
      () => {
        if (activeAudio === audio) {
          activeAudio = null;
        }
      },
      { once: true },
    );
    return;
  }

  speakGerman(trimmed);
};

/**
 * Returns true when browser TTS appears available.
 */
export const canSpeakGerman = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(window.speechSynthesis && typeof SpeechSynthesisUtterance !== "undefined");
};

/**
 * Returns true when neural audio or browser TTS can play this phrase.
 */
export const canPlayGerman = (audioUrl?: string | null): boolean =>
  Boolean(audioUrl) || canSpeakGerman();
