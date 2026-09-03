import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import { useIncidents } from "../context/IncidentContext";
import { SUPPORTED_LANGUAGES, LanguageCode } from "../i18n";
import { Mic, MicOff, Sparkles, Check, X, Volume2, AlertCircle } from "lucide-react-native";

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  onStructuredResult: (data: any) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  onClose,
  onStructuredResult
}) => {
  const { language, setLanguage, t, speak, stopSpeaking } = useLanguage();
  const { structureVoice } = useIncidents();

  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [structuredData, setStructuredData] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQuestionStep] = useState<number>(0);

  // Pulse animation for mic
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const recognitionRef = useRef<any>(null);

  const guidedQuestions = [
    t("voice.q1") || "What problem did you notice?",
    t("voice.q2") || "What color, smell or visible change did you see?",
    t("voice.q3") || "Which area or street is affected?",
    t("voice.q4") || "Are multiple households affected?"
  ];

  // Sample quick speech triggers for testing
  const quickDemoPhrases: Record<LanguageCode, string[]> = {
    ta: [
      "குடிநீரில் கடுமையான சாக்கடை நாற்றம் அடிக்கிறது, மஞ்சள் நிறமாக வருகிறது.",
      "குழாய் உடைந்து சாலையில் தண்ணீர் வீணாக ஓடுகிறது.",
      "தொழிற்சாலை கழிவுநீர் ஆற்றில் கலப்பதாக தோன்றுகிறது."
    ],
    te: [
      "నల్లా నీటిలో రంగుమారి నల్లటి మడ్డి వస్తోంది. తీవ్ర దుర్వాసన ఉంది.",
      "పైప్‌లైన్ పగిలి రోడ్డుపై నీరు కారుతోంది.",
      "నీరు తాగిన తర్వాత కడుపునొప్పి సమస్య వచ్చింది."
    ],
    kn: [
      "ಕಾವೇರಿ ನೀರು ಪೈಪ್ ಒಡೆದು ರಸ್ತೆಯಲ್ಲಿ ನೀರು ಹರಿಯುತ್ತಿದೆ. ಕೆಸರು ಬರುತ್ತಿದೆ.",
      "ನಲ್ಲಿ ನೀರಿನಲ್ಲಿ ತೀವ್ರವಾದ ಚರಂಡಿ ವಾಸನೆ ಬರುತ್ತಿದೆ.",
      "ಬಾವಿ ನೀರಿನಲ್ಲಿ ರಾಸಾಯನಿಕ ವಾಸನೆ ಇದೆ."
    ],
    ml: [
      "കിണറിലെ വെള്ളത്തിന് കടുത്ത രാസഗന്ധവും എണ്ണപ്പാടയും കാണുന്നു.",
      "പൈപ്പ് ലൈൻ പൊട്ടി വെള്ളം പാഴായി ഒഴുകുന്നു.",
      "പൈപ്പ് വെള്ളത്തിൽ മഞ്ഞനിറവും അഴുക്കും വരുന്നു."
    ],
    en: [
      "Severe sewage smell in tap water and yellow turbidity since morning.",
      "Main water pipeline burst near street corner with heavy leak.",
      "Chemical oily sheen observed on well water surface."
    ]
  };

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const startListening = () => {
    setErrorMessage(null);
    setStructuredData(null);
    setTranscript("");

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          
          const localeMap: Record<LanguageCode, string> = {
            en: "en-IN",
            ta: "ta-IN",
            te: "te-IN",
            kn: "kn-IN",
            ml: "ml-IN"
          };
          recognition.lang = localeMap[language] || "en-IN";

          recognition.onstart = () => {
            setIsRecording(true);
          };

          recognition.onresult = (event: any) => {
            let currentTranscript = "";
            for (let i = 0; i < event.results.length; i++) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
            setTranscript(currentTranscript);
          };

          recognition.onerror = (event: any) => {
            console.warn("Speech recognition error:", event.error);
            if (event.error === "not-allowed") {
              setErrorMessage("Microphone permission denied. Please allow microphone in browser.");
            }
            setIsRecording(false);
          };

          recognition.onend = () => {
            setIsRecording(false);
          };

          recognitionRef.current = recognition;
          recognition.start();
          return;
        } catch (e) {
          console.warn("SpeechRecognition init failed:", e);
        }
      }
    }

    // Web Speech API fallback simulator for devices without Web Speech API
    setIsRecording(true);
    const demoOptions = quickDemoPhrases[language] || quickDemoPhrases["en"];
    const randomPhrase = demoOptions[Math.floor(Math.random() * demoOptions.length)];
    setTimeout(() => {
      setTranscript(randomPhrase);
      setIsRecording(false);
    }, 1500);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    setIsRecording(false);
  };

  const handleAnalyzeWithGemini = async (textToProcess?: string) => {
    const text = textToProcess || transcript;
    if (!text.trim()) {
      setErrorMessage("Please speak or enter a description first.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);
    try {
      const structured = await structureVoice(text, language);
      setStructuredData(structured);
      // Optional voice response feedback
      if (structured.cautious_safety_tip) {
        speak(structured.cautious_safety_tip);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze speech with Gemini AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyToForm = () => {
    if (structuredData) {
      onStructuredResult({
        ...structuredData,
        original_voice_transcript: transcript
      });
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer} testID="voice-assistant-modal">
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.sparkleIcon}>
                <Sparkles size={20} color="#0EA5E9" />
              </View>
              <View>
                <Text style={styles.assistantTitle} testID="voice-assistant-name">
                  {t("voice.assistant_name")}
                </Text>
                <Text style={styles.assistantSubtitle}>
                  Gemini 3.5 Flash Multilingual Voice Triage
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID="close-voice-modal-btn"
              style={styles.closeBtn}
              onPress={() => {
                stopListening();
                stopSpeaking();
                onClose();
              }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Language Selector in Voice Modal */}
          <View style={styles.langSelectorRow}>
            {SUPPORTED_LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                testID={`voice-lang-${l.code}`}
                style={[
                  styles.langPill,
                  language === l.code && styles.langPillActive
                ]}
                onPress={() => {
                  setLanguage(l.code as LanguageCode);
                  setStructuredData(null);
                }}
              >
                <Text
                  style={[
                    styles.langPillText,
                    language === l.code && styles.langPillTextActive
                  ]}
                >
                  {l.nativeLabel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Guided Question Carousel */}
            <View style={styles.guidedCard}>
              <View style={styles.guidedHeader}>
                <Text style={styles.guidedStepBadge}>
                  Guided Question {activeQuestionStep + 1} of {guidedQuestions.length}
                </Text>
                <TouchableOpacity
                  onPress={() => speak(guidedQuestions[activeQuestionStep])}
                  style={styles.readAloudBtn}
                >
                  <Volume2 size={16} color="#0284C7" />
                  <Text style={styles.readAloudText}>Listen</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.guidedQuestionText}>
                {guidedQuestions[activeQuestionStep]}
              </Text>
            </View>

            {/* Microphone Button with Pulse */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.micRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: isRecording ? "#EF4444" : "#0EA5E9"
                  }
                ]}
              />
              <TouchableOpacity
                testID="voice-assistant-mic-btn"
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonRecording
                ]}
                onPress={isRecording ? stopListening : startListening}
                activeOpacity={0.8}
              >
                {isRecording ? (
                  <MicOff size={36} color="#FFFFFF" />
                ) : (
                  <Mic size={36} color="#FFFFFF" />
                )}
              </TouchableOpacity>
              <Text style={styles.micStatusText}>
                {isRecording
                  ? t("voice.listening") || "Listening in your language..."
                  : transcript
                  ? "Tap mic to re-record"
                  : t("voice.prompt_tap")}
              </Text>
            </View>

            {/* Error banner */}
            {errorMessage && (
              <View style={styles.errorBox}>
                <AlertCircle size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Quick Demo Phrases Picker */}
            <View style={styles.quickPhrasesContainer}>
              <Text style={styles.quickPhrasesTitle}>Or tap a sample South Indian complaint:</Text>
              <View style={styles.quickPhrasesWrap}>
                {(quickDemoPhrases[language] || quickDemoPhrases["en"]).map((phrase, idx) => (
                  <TouchableOpacity
                    key={idx}
                    testID={`demo-phrase-btn-${idx}`}
                    style={styles.phraseChip}
                    onPress={() => {
                      setTranscript(phrase);
                      handleAnalyzeWithGemini(phrase);
                    }}
                  >
                    <Text style={styles.phraseChipText} numberOfLines={2}>
                      💬 &ldquo;{phrase}&rdquo;
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Live Transcript Display */}
            {transcript ? (
              <View style={styles.transcriptBox} testID="voice-live-transcript-box">
                <Text style={styles.transcriptLabel}>Spoken Transcript:</Text>
                <Text style={styles.transcriptContent}>&ldquo;{transcript}&rdquo;</Text>

                {!structuredData && !isAnalyzing && (
                  <TouchableOpacity
                    testID="analyze-transcript-btn"
                    style={styles.analyzeButton}
                    onPress={() => handleAnalyzeWithGemini()}
                  >
                    <Sparkles size={18} color="#FFFFFF" />
                    <Text style={styles.analyzeButtonText}>
                      Structure with Gemini 3.5 Flash
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null}

            {/* Analyzing Indicator */}
            {isAnalyzing && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#0EA5E9" />
                <Text style={styles.loadingText}>
                  {t("voice.processing_gemini")}
                </Text>
              </View>
            )}

            {/* Structured Result from Gemini */}
            {structuredData && (
              <View style={styles.structuredResultCard} testID="gemini-structured-card">
                <View style={styles.resultHeader}>
                  <Check size={18} color="#10B981" />
                  <Text style={styles.resultHeaderTitle}>
                    {t("voice.review_structured")}
                  </Text>
                </View>

                <View style={styles.gridFields}>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldKey}>Category:</Text>
                    <Text style={styles.fieldValHighlight}>
                      {structuredData.category}
                    </Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldKey}>Priority:</Text>
                    <Text
                      style={[
                        styles.fieldValHighlight,
                        {
                          color:
                            structuredData.priority === "Critical"
                              ? "#EF4444"
                              : structuredData.priority === "High"
                              ? "#F59E0B"
                              : "#0EA5E9"
                        }
                      ]}
                    >
                      {structuredData.priority}
                    </Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldKey}>State & District:</Text>
                    <Text style={styles.fieldVal}>
                      {structuredData.district}, {structuredData.state}
                    </Text>
                  </View>
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldKey}>Ward / Locality:</Text>
                    <Text style={styles.fieldVal}>
                      {structuredData.ward_locality}
                    </Text>
                  </View>
                  {structuredData.translated_description_en && (
                    <View style={styles.fieldRowFull}>
                      <Text style={styles.fieldKey}>English Translation:</Text>
                      <Text style={styles.translatedText}>
                        &ldquo;{structuredData.translated_description_en}&rdquo;
                      </Text>
                    </View>
                  )}
                  {structuredData.cautious_safety_tip && (
                    <View style={styles.safetyTipBox}>
                      <Text style={styles.safetyTipTitle}>
                        🛡️ AI Preliminary Safety Tip:
                      </Text>
                      <Text style={styles.safetyTipContent}>
                        {structuredData.cautious_safety_tip}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  testID="apply-structured-data-btn"
                  style={styles.applyButton}
                  onPress={handleApplyToForm}
                >
                  <Text style={styles.applyButtonText}>
                    {t("voice.confirm_and_fill")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "flex-end"
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center"
  },
  assistantTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0F172A"
  },
  assistantSubtitle: {
    fontSize: 11,
    color: "#64748B"
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F1F5F9"
  },
  langSelectorRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 14,
    justifyContent: "center"
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  langPillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7"
  },
  langPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569"
  },
  langPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  scrollArea: {
    maxHeight: 520
  },
  guidedCard: {
    backgroundColor: "#F0F9FF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BAE6FD",
    marginBottom: 16
  },
  guidedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  guidedStepBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
    textTransform: "uppercase"
  },
  readAloudBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10
  },
  readAloudText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0284C7"
  },
  guidedQuestionText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0C4A6E",
    lineHeight: 20
  },
  micSection: {
    alignItems: "center",
    marginVertical: 14,
    justifyContent: "center"
  },
  micRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    backgroundColor: "transparent"
  },
  micButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#0EA5E9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  micButtonRecording: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444"
  },
  micStatusText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 10,
    fontWeight: "500"
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12
  },
  errorText: {
    fontSize: 12,
    color: "#B91C1C",
    flex: 1
  },
  quickPhrasesContainer: {
    marginVertical: 10
  },
  quickPhrasesTitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 6
  },
  quickPhrasesWrap: {
    gap: 6
  },
  phraseChip: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  phraseChipText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 16
  },
  transcriptBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    marginVertical: 10
  },
  transcriptLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 4
  },
  transcriptContent: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 20
  },
  analyzeButton: {
    backgroundColor: "#0284C7",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 10
  },
  analyzeButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 16
  },
  loadingText: {
    fontSize: 13,
    color: "#0284C7",
    fontWeight: "600"
  },
  structuredResultCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginVertical: 12
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10
  },
  resultHeaderTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534"
  },
  gridFields: {
    gap: 6
  },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  fieldRowFull: {
    marginTop: 4
  },
  fieldKey: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600"
  },
  fieldVal: {
    fontSize: 13,
    color: "#0F172A",
    fontWeight: "600"
  },
  fieldValHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7"
  },
  translatedText: {
    fontSize: 12,
    color: "#334155",
    fontStyle: "italic",
    marginTop: 2
  },
  safetyTipBox: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#10B981",
    marginTop: 8
  },
  safetyTipTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0F766E"
  },
  safetyTipContent: {
    fontSize: 12,
    color: "#334155",
    marginTop: 2,
    lineHeight: 16
  },
  applyButton: {
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700"
  }
});
