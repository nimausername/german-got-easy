/**
 * Fires a short celebration burst when a lesson is passed.
 * Skips when the user prefers reduced motion.
 * Loads canvas-confetti on demand so it stays out of the initial lesson chunk.
 */
export const fireLessonConfetti = (score: number): void => {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const strong = score >= 0.9;
  const colors = ["#2a6f7a", "#4aa3b0", "#e8f0f4", "#1a3d44", "#7bc4ce"];

  void import("canvas-confetti").then(({ default: confetti }) => {
    void confetti({
      particleCount: strong ? 120 : 80,
      spread: strong ? 78 : 62,
      startVelocity: strong ? 42 : 34,
      origin: { y: 0.62 },
      colors,
      disableForReducedMotion: true,
    });

    if (!strong) return;

    window.setTimeout(() => {
      void confetti({
        particleCount: 50,
        angle: 60,
        spread: 48,
        origin: { x: 0.12, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
      void confetti({
        particleCount: 50,
        angle: 120,
        spread: 48,
        origin: { x: 0.88, y: 0.7 },
        colors,
        disableForReducedMotion: true,
      });
    }, 180);
  });
};
