import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

interface AppearancePrefs {
  largerText?: boolean;
  reduceMotion?: boolean;
  language?: "hi" | "en";
}

const parseBio = (bio: unknown): { appearance?: AppearancePrefs } => {
  if (typeof bio !== "string" || !bio) return {};
  try {
    return JSON.parse(bio);
  } catch {
    return {};
  }
};

/** Applies the real, persisted Settings > Appearance/Language preferences as
 * data-attributes on <html>, matched by CSS rules in index.css. Runs once at
 * the app root so the effect is genuinely global, not just on the Settings page. */
export const useAppearanceEffects = () => {
  const { user } = useAuth();
  const { appearance } = parseBio(user?.bio);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-larger-text", String(!!appearance?.largerText));
    root.setAttribute("data-reduce-motion", String(!!appearance?.reduceMotion));
    root.setAttribute("data-hide-hindi", String(appearance?.language === "en"));
  }, [appearance?.largerText, appearance?.reduceMotion, appearance?.language]);
};
