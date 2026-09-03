import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform
} from "react-native";
import { useLanguage } from "../context/LanguageContext";
import {
  HelpCircle,
  Volume2,
  VolumeX,
  FilePlus,
  Search,
  MapPin,
  Mic,
  ShieldCheck,
  X
} from "lucide-react-native";

interface GuideNavigatorModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateAction: (screen: string) => void;
}

export const GuideNavigatorModal: React.FC<GuideNavigatorModalProps> = ({
  visible,
  onClose,
  onNavigateAction
}) => {
  const { t, speak, stopSpeaking, isSpeaking, language } = useLanguage();

  const guideCards = [
    {
      id: "report",
      icon: FilePlus,
      color: "#0284C7",
      bgColor: "#E0F2FE",
      title: t("guide.action_report") || "Need to report bad water? Tap Report",
      speech:
        language === "ta"
          ? "குடிநீர் பிரச்சனை குறித்து புகார் அளிக்க புகார் பொத்தானை அழுத்தவும்."
          : language === "te"
          ? "నీటి సమస్యపై ఫిర్యాదు చేయడానికి రిపోర్ట్ బటన్ నొక్కండి."
          : language === "kn"
          ? "ನೀರಿನ ಸಮಸ್ಯೆಯ ಬಗ್ಗೆ ದೂರು ನೀಡಲು ರಿಪೋರ್ಟ್ ಬಟನ್ ಒತ್ತಿ."
          : language === "ml"
          ? "വെള്ളത്തിന് പ്രശ്നമുണ്ടെങ്കിൽ റിപ്പോർട്ട് ബട്ടൺ അമർത്തുക."
          : "To report water contamination, tap the Report button."
    },
    {
      id: "track",
      icon: Search,
      color: "#8B5CF6",
      bgColor: "#EDE9FE",
      title: t("guide.action_track") || "Need to check your complaint? Tap Track",
      speech:
        language === "ta"
          ? "உங்கள் புகாரின் நிலையை அறிய ட்ராக் பொத்தானை அழுத்தவும்."
          : language === "te"
          ? "ఫిర్యాదు పరిస్థితి తెలుసుకోవడానికి ట్రాక్ నొక్కండి."
          : language === "kn"
          ? "ದೂರಿನ ಸ್ಥಿತಿ ತಿಳಿಯಲು ಟ್ರ್ಯಾಕ್ ಬಟನ್ ಒತ್ತಿ."
          : language === "ml"
          ? "പരാതി വിവരമറിയാൻ ട്രാക്ക് ബട്ടൺ അമർത്തുക."
          : "To check your complaint status, tap Track."
    },
    {
      id: "map",
      icon: MapPin,
      color: "#F59E0B",
      bgColor: "#FEF3C7",
      title: t("guide.action_map") || "Want to see issues nearby? Tap Map",
      speech:
        language === "ta"
          ? "உங்கள் பகுதியில் உள்ள நீர் சிக்கல்களை பார்க்க வரைபடம் செல்லவும்."
          : language === "te"
          ? "మీ ప్రాంతంలోని నీటి సమస్యలను చూడటానికి మ్యాప్ తెరవండి."
          : language === "kn"
          ? "ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳನ್ನು ನೋಡಲು ನಕ್ಷೆ ತೆರೆಯಿರಿ."
          : language === "ml"
          ? "സമീപത്തെ പ്രശ്നങ്ങൾ കാണാൻ മാപ്പ് തുറക്കുക."
          : "To view reported issues on the South India map, tap Map."
    },
    {
      id: "voice",
      icon: Mic,
      color: "#EC4899",
      bgColor: "#FCE7F3",
      title: t("guide.action_voice") || "Difficulty typing? Tap Voice Assistant",
      speech:
        language === "ta"
          ? "டைப் செய்ய கடினமாக இருந்தால் குரல் உதவியாளரிடம் தமிழில் பேசவும்."
          : language === "te"
          ? "టైప్ చేయడం కష్టమైతే వాయిస్ అసిస్టెంట్‌లో మాట్లాడండి."
          : language === "kn"
          ? "ಟೈಪ್ ಮಾಡಲು ಕಷ್ಟವಾದರೆ ಧ್ವನಿ ಸಹಾಯಕ ಬಳಸಿ."
          : language === "ml"
          ? "ടൈപ്പ് ചെയ്യാൻ ബുദ്ധിമുട്ടാണെങ്കിൽ വോയ്സ് അസിസ്റ്റന്റ് ഉപയോഗിക്കുക."
          : "If you have difficulty typing, tap Voice Assistant to speak."
    },
    {
      id: "safety",
      icon: ShieldCheck,
      color: "#10B981",
      bgColor: "#D1FAE5",
      title: t("guide.action_safety") || "Need clean drinking water tips? Tap Safety",
      speech:
        language === "ta"
          ? "குடிநீரை பாதுகாப்பாக கொதிக்க வைக்கும் வழிகளுக்கு பாதுகாப்பு பகுதி செல்லவும்."
          : language === "te"
          ? "సురక్షిత నీటి చిట్కాల కోసం సేఫ్టీ విభాగం చూడండి."
          : language === "kn"
          ? "ಸುರಕ್ಷಿತ ನೀರಿನ ಸಲಹೆಗಳಿಗಾಗಿ ಸುರಕ್ಷತೆ ವಿಭಾಗಕ್ಕೆ ಹೋಗಿ."
          : language === "ml"
          ? "കുടിവെള്ള സുരക്ഷാ നിർദ്ദേശങ്ങൾക്ക് സേഫ്റ്റി വിഭാഗം കാണുക."
          : "For safe boiling and drinking water guidelines, tap Water Safety."
    }
  ];

  const handleReadFullGuide = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullText = guideCards.map((c) => c.speech).join(". ");
      speak(fullText);
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
        <View style={styles.sheetContainer} testID="guide-navigator-modal">
          <View style={styles.sheetHeader}>
            <View style={styles.titleRow}>
              <View style={styles.iconBadge}>
                <HelpCircle size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={styles.guideTitle} testID="guide-navigator-title">
                  {t("guide.name")}
                </Text>
                <Text style={styles.guideSubtitle}>{t("guide.subtitle")}</Text>
              </View>
            </View>

            <TouchableOpacity
              testID="close-guide-btn"
              style={styles.closeBtn}
              onPress={() => {
                stopSpeaking();
                onClose();
              }}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Audio narration button */}
          <TouchableOpacity
            testID="guide-read-aloud-btn"
            style={[styles.audioToggleBtn, isSpeaking && styles.audioToggleBtnActive]}
            onPress={handleReadFullGuide}
          >
            {isSpeaking ? (
              <>
                <VolumeX size={18} color="#FFFFFF" />
                <Text style={styles.audioToggleTextActive}>
                  {t("guide.stop_audio")}
                </Text>
              </>
            ) : (
              <>
                <Volume2 size={18} color="#0369A1" />
                <Text style={styles.audioToggleText}>
                  {t("guide.listen_aloud")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <ScrollView style={styles.cardsScroll} showsVerticalScrollIndicator={false}>
            {guideCards.map((card) => {
              const IconComp = card.icon;
              return (
                <TouchableOpacity
                  key={card.id}
                  testID={`guide-action-${card.id}-btn`}
                  style={styles.actionCard}
                  onPress={() => {
                    stopSpeaking();
                    onClose();
                    onNavigateAction(card.id);
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[styles.actionIconWrap, { backgroundColor: card.bgColor }]}
                  >
                    <IconComp size={24} color={card.color} />
                  </View>

                  <View style={styles.actionContent}>
                    <Text style={styles.actionCardTitle}>{card.title}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.cardSpeakBtn}
                    onPress={() => speak(card.speech)}
                  >
                    <Volume2 size={16} color="#64748B" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            testID="dismiss-guide-btn"
            style={styles.doneButton}
            onPress={() => {
              stopSpeaking();
              onClose();
            }}
          >
            <Text style={styles.doneButtonText}>{t("guide.close_guide")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end"
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "85%"
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center"
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  guideSubtitle: {
    fontSize: 12,
    color: "#64748B"
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F1F5F9"
  },
  audioToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E0F2FE",
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BAE6FD"
  },
  audioToggleBtnActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7"
  },
  audioToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0369A1"
  },
  audioToggleTextActive: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  cardsScroll: {
    maxHeight: 380
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  actionContent: {
    flex: 1
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B",
    lineHeight: 18
  },
  cardSpeakBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#F1F5F9"
  },
  doneButton: {
    backgroundColor: "#0F172A",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF"
  }
});
