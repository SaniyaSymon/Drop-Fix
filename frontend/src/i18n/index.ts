import en from "./en.json";
import ta from "./ta.json";
import te from "./te.json";
import kn from "./kn.json";
import ml from "./ml.json";

export type LanguageCode = "en" | "ta" | "te" | "kn" | "ml";

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  speechLocale: string;
  fontFamilyFallback: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", speechLocale: "en-IN", fontFamilyFallback: "Inter, sans-serif" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", speechLocale: "ta-IN", fontFamilyFallback: "Noto Sans Tamil, sans-serif" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", speechLocale: "te-IN", fontFamilyFallback: "Noto Sans Telugu, sans-serif" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", speechLocale: "kn-IN", fontFamilyFallback: "Noto Sans Kannada, sans-serif" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", speechLocale: "ml-IN", fontFamilyFallback: "Noto Sans Malayalam, sans-serif" }
];

export const translations: Record<LanguageCode, any> = {
  en,
  ta,
  te,
  kn,
  ml
};

export function getNestedTranslation(obj: any, path: string): string {
  if (!obj) return path;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === "object" && part in curr) {
      curr = curr[part];
    } else {
      return path; // Fallback to path string
    }
  }
  return typeof curr === "string" ? curr : path;
}
