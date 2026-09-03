import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable
} from "react-native";
import { Image } from "expo-image";
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";
import { SUPPORTED_LANGUAGES, LanguageCode } from "../i18n";
import {
  Globe,
  HelpCircle,
  User,
  Wrench,
  ShieldAlert,
  ChevronDown,
  Check
} from "lucide-react-native";

interface HeaderNavProps {
  onOpenGuide: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ onOpenGuide }) => {
  const { language, setLanguage, currentLangConfig } = useLanguage();
  const { role, setRoleModalVisible } = useAuth();
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const getRoleIcon = () => {
    switch (role) {
      case "officer":
        return <Wrench size={14} color="#B45309" />;
      case "admin":
        return <ShieldAlert size={14} color="#047857" />;
      default:
        return <User size={14} color="#0369A1" />;
    }
  };

  const getRoleBadgeStyle = () => {
    switch (role) {
      case "officer":
        return { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" };
      case "admin":
        return { bg: "#D1FAE5", text: "#047857", border: "#A7F3D0" };
      default:
        return { bg: "#E0F2FE", text: "#0369A1", border: "#BAE6FD" };
    }
  };

  const badgeStyle = getRoleBadgeStyle();

  return (
    <View style={styles.headerContainer} testID="app-header-nav">
      {/* Brand & Tagline */}
      <View style={styles.brandGroup}>
        <Image
          source={require("../../assets/images/dropfix-logo.png")}
          style={styles.logoImage}
          contentFit="contain"
        />
        <View>
          <Text style={styles.brandTitle} testID="header-app-title">
            DROPFIX
          </Text>
          <Text style={styles.brandTagline}>SPOT IT. REPORT IT. FIX IT.</Text>
        </View>
      </View>

      {/* Action Controls: Language, Role Switcher, Guide Help */}
      <View style={styles.actionsGroup}>
        {/* Language Selector Pill */}
        <TouchableOpacity
          testID="header-language-picker-btn"
          style={styles.langPill}
          onPress={() => setIsLangMenuOpen(true)}
          activeOpacity={0.8}
        >
          <Globe size={14} color="#0284C7" />
          <Text style={styles.langPillText} numberOfLines={1}>
            {currentLangConfig.nativeLabel}
          </Text>
          <ChevronDown size={12} color="#64748B" />
        </TouchableOpacity>

        {/* Quick Role Switcher Pill */}
        <TouchableOpacity
          testID="header-role-switcher-btn"
          style={[
            styles.roleBadge,
            { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }
          ]}
          onPress={() => setRoleModalVisible(true)}
          activeOpacity={0.8}
        >
          {getRoleIcon()}
          <Text style={[styles.roleBadgeText, { color: badgeStyle.text }]}>
            {role.toUpperCase()}
          </Text>
        </TouchableOpacity>

        {/* Guide Help Button */}
        <TouchableOpacity
          testID="header-guide-help-btn"
          style={styles.guideBtn}
          onPress={onOpenGuide}
          activeOpacity={0.8}
        >
          <HelpCircle size={18} color="#0284C7" />
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={isLangMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLangMenuOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsLangMenuOpen(false)}
        >
          <Pressable style={styles.langMenuCard} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.langMenuTitle}>Select Language / மொழி</Text>
            {SUPPORTED_LANGUAGES.map((langItem) => {
              const isSelected = language === langItem.code;
              return (
                <TouchableOpacity
                  key={langItem.code}
                  testID={`header-lang-option-${langItem.code}`}
                  style={[
                    styles.langOptionItem,
                    isSelected && styles.langOptionItemActive
                  ]}
                  onPress={() => {
                    setLanguage(langItem.code as LanguageCode);
                    setIsLangMenuOpen(false);
                  }}
                >
                  <View>
                    <Text
                      style={[
                        styles.langNativeName,
                        isSelected && styles.langNativeNameActive
                      ]}
                    >
                      {langItem.nativeLabel}
                    </Text>
                    <Text style={styles.langEngName}>{langItem.label}</Text>
                  </View>
                  {isSelected && <Check size={18} color="#0284C7" />}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  brandGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5
  },
  brandTagline: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0284C7",
    letterSpacing: 0.5
  },
  actionsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  langPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD"
  },
  langPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
    maxWidth: 70
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "800"
  },
  guideBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2FE",
    justifyContent: "center",
    alignItems: "center"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24
  },
  langMenuCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8
  },
  langMenuTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  langOptionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4
  },
  langOptionItemActive: {
    backgroundColor: "#F0F9FF"
  },
  langNativeName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E293B"
  },
  langNativeNameActive: {
    color: "#0284C7"
  },
  langEngName: {
    fontSize: 11,
    color: "#64748B"
  }
});
