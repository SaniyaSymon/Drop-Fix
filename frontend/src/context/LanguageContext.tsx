import React, { createContext, useContext, useState, useEffect } from "react";
import { Platform } from "react-native";
import { LanguageCode, SUPPORTED_LANGUAGES, translations, getNestedTranslation } from "../i18n";
import { storage } from "@/src/utils/storage";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  t: (key: string) => string;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  isSpeaking: boolean;
  currentLangConfig: (typeof SUPPORTED_LANGUAGES)[0];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLangState] = useState<LanguageCode>("en");
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>("dropfix_preferred_lang", "en");
      if (saved && ["en", "ta", "te", "kn", "ml"].includes(saved)) {
        setLangState(saved as LanguageCode);
      }
    })();
  }, []);

  const setLanguage = async (newLang: LanguageCode) => {
    setLangState(newLang);
    await storage.setItem("dropfix_preferred_lang", newLang);
  };

  const currentLangConfig =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const t = (key: string): string => {
    const langDict = translations[language] || translations["en"];
    const translated = getNestedTranslation(langDict, key);
    if (translated === key && language !== "en") {
      // Fallback to English dictionary if key not found in chosen language
      return getNestedTranslation(translations["en"], key);
    }
    return translated;
  };

  const speak = (text: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLangConfig.speechLocale;
        utterance.rate = 0.95;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("TTS speak failed", e);
        setIsSpeaking(false);
      }
    } else {
      console.log("Spoken prompt requested:", text);
    }
  };

  const stopSpeaking = () => {
    if (Platform.OS === "web" && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        speak,
        stopSpeaking,
        isSpeaking,
        currentLangConfig
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
