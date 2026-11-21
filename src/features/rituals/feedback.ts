import type { ToastOptions } from "@/components/feedback/ToastProvider";

export function getRitualSavedToast(isRevealed: boolean, partnerDisplayName: string): ToastOptions {
  if (isRevealed) {
    return {
      tone: "success",
      emoji: "✨",
      title: "Both answers are revealed",
      message: `See what you and ${partnerDisplayName} shared today.`,
    };
  }

  return {
    tone: "success",
    emoji: "🔒",
    title: "Your answer is saved",
    message: `It stays private until ${partnerDisplayName} answers too.`,
  };
}
