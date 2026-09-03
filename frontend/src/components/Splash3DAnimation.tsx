import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../context/LanguageContext";
import { SUPPORTED_LANGUAGES, LanguageCode } from "../i18n";
import { Droplet, ChevronRight, Sparkles } from "lucide-react-native";

const { height } = Dimensions.get("window");

interface Splash3DAnimationProps {
  onComplete: () => void;
}

export const Splash3DAnimation: React.FC<Splash3DAnimationProps> = ({ onComplete }) => {
  const { language, setLanguage } = useLanguage();

  const dropScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle breathing pulse for 3D droplet and caustic glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.08,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulseScale]);

  return (
    <View style={styles.container} testID="dropfix-splash-screen">
      <LinearGradient
        colors={["#031A2F", "#082F49", "#0C4A6E", "#075985"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Brand & Logo Section */}
      <View style={styles.brandSection}>
        <Animated.View style={[styles.logoCard, { transform: [{ scale: pulseScale }] }]}>
          <Image
            source={require("../../assets/images/dropfix-logo.png")}
            style={styles.logoImage}
            contentFit="contain"
          />
        </Animated.View>

        <Text style={styles.brandTitle} testID="splash-brand-title">
          DROPFIX
        </Text>

        <View style={styles.taglineBadge}>
          <Text style={styles.taglineText} testID="splash-brand-tagline">
            SPOT IT. REPORT IT. FIX IT.
          </Text>
        </View>

        <Text style={styles.coverageText}>
          Smart Water-Quality & Citizen Safety Platform for South India
        </Text>
        <Text style={styles.statesPillText}>
          Tamil Nadu • Kerala • Karnataka • Andhra Pradesh • Telangana • Puducherry
        </Text>
      </View>

      {/* Language Selector & Launch CTA */}
      <View style={styles.bottomSection}>
        <Text style={styles.languagePrompt}>
          Choose Language / மொழியைத் தேர்வு செய்க
        </Text>

        <View style={styles.langGrid}>
          {SUPPORTED_LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <TouchableOpacity
                key={item.code}
                testID={`splash-lang-btn-${item.code}`}
                style={[
                  styles.langPill,
                  isSelected && styles.langPillActive
                ]}
                onPress={() => setLanguage(item.code as LanguageCode)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.langText,
                    isSelected && styles.langTextActive
                  ]}
                >
                  {item.nativeLabel}
                </Text>
                {isSelected && <View style={styles.activeDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          testID="splash-enter-app-btn"
          style={styles.launchBtn}
          onPress={onComplete}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={["#0EA5E9", "#0284C7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.launchGradient}
          >
            <Text style={styles.launchBtnText}>
              {language === "ta"
                ? "தொடங்குக (Launch DROPFIX)"
                : language === "te"
                ? "ప్రారంభించండి (Launch)"
                : language === "kn"
                ? "ಪ್ರಾರಂಭಿಸಿ (Launch)"
                : language === "ml"
                ? "തുടങ്ങുക (Launch)"
                : "Launch DROPFIX"}
            </Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#031A2F",
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20
  },
  brandSection: {
    alignItems: "center",
    marginTop: height * 0.04,
    width: "100%"
  },
  logoCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#FFFFFF",
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 16
  },
  logoImage: {
    width: "100%",
    height: "100%"
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 2
  },
  taglineBadge: {
    backgroundColor: "rgba(14, 165, 233, 0.25)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.4)"
  },
  taglineText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#38BDF8",
    letterSpacing: 1.5
  },
  coverageText: {
    fontSize: 13,
    color: "#E2E8F0",
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
    paddingHorizontal: 10
  },
  statesPillText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 6,
    textAlign: "center"
  },
  bottomSection: {
    width: "100%",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    alignItems: "center"
  },
  languagePrompt: {
    fontSize: 13,
    color: "#CBD5E1",
    fontWeight: "600",
    marginBottom: 12
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(30, 41, 59, 0.9)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  langPillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#38BDF8"
  },
  langText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94A3B8"
  },
  langTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF"
  },
  launchBtn: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6
  },
  launchGradient: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10
  },
  launchBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5
  }
});
