import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable
} from "react-native";
import { useAuth, UserRole } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { User, ShieldAlert, Wrench, CheckCircle2, X } from "lucide-react-native";

interface RoleOption {
  id: UserRole;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  badge: string;
  jurisdiction: string;
}

export const RoleSwitcherModal: React.FC = () => {
  const { role, switchRole, isRoleModalVisible, setRoleModalVisible } = useAuth();
  const { t } = useLanguage();

  const roleOptions: RoleOption[] = [
    {
      id: "citizen",
      title: "Citizen Mode",
      subtitle: "Spot & report water issues anonymously, voice assisted reporting, public map & status timeline.",
      icon: User,
      color: "#0EA5E9",
      badge: "Public Access",
      jurisdiction: "All South India"
    },
    {
      id: "officer",
      title: "Municipal Officer Mode",
      subtitle: "Dispatch console for Area Engineers, field investigation notes, laboratory test uploads & status updates.",
      icon: Wrench,
      color: "#F59E0B",
      badge: "CMWSSB / BWSSB / KWA",
      jurisdiction: "Zone 10 - Central Chennai"
    },
    {
      id: "admin",
      title: "Super Admin Command",
      subtitle: "Multi-state analytics, incident cluster hotspot detection, public advisory broadcast & audit logs.",
      icon: ShieldAlert,
      color: "#10B981",
      badge: "South India Taskforce",
      jurisdiction: "TN, KL, KA, AP, TG, PY"
    }
  ];

  return (
    <Modal
      visible={isRoleModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setRoleModalVisible(false)}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => setRoleModalVisible(false)}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title} testID="role-switcher-title">
                {t("roles.switch_role") || "Switch Demo Persona"}
              </Text>
              <Text style={styles.subtitle}>
                Instant 1-tap role access for judge & stakeholder demonstration
              </Text>
            </View>
            <TouchableOpacity
              testID="close-role-modal-btn"
              style={styles.closeBtn}
              onPress={() => setRoleModalVisible(false)}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {roleOptions.map((opt) => {
              const isSelected = role === opt.id;
              const IconComponent = opt.icon;

              return (
                <TouchableOpacity
                  key={opt.id}
                  testID={`select-role-${opt.id}-btn`}
                  style={[
                    styles.roleOptionCard,
                    isSelected && { borderColor: opt.color, backgroundColor: `${opt.color}10` }
                  ]}
                  onPress={() => switchRole(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${opt.color}20` }]}>
                    <IconComponent size={24} color={opt.color} />
                  </View>

                  <View style={styles.roleTextContent}>
                    <View style={styles.titleRow}>
                      <Text style={styles.roleTitle}>{opt.title}</Text>
                      <View style={[styles.badgePill, { backgroundColor: `${opt.color}25` }]}>
                        <Text style={[styles.badgePillText, { color: opt.color }]}>
                          {opt.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.roleSubtitle}>{opt.subtitle}</Text>
                    <Text style={styles.jurisdictionText}>📍 {opt.jurisdiction}</Text>
                  </View>

                  {isSelected && (
                    <View style={styles.checkIcon}>
                      <CheckCircle2 size={22} color={opt.color} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A"
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#F1F5F9"
  },
  optionsList: {
    gap: 12
  },
  roleOptionCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    alignItems: "center",
    gap: 12
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center"
  },
  roleTextContent: {
    flex: 1
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A"
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: "700"
  },
  roleSubtitle: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16
  },
  jurisdictionText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4
  },
  checkIcon: {
    marginLeft: 4
  }
});
