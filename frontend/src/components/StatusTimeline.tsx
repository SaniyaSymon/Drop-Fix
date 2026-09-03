import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { TimelineEntry } from "../context/IncidentContext";
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Search,
  Wrench
} from "lucide-react-native";

interface StatusTimelineProps {
  timeline: TimelineEntry[];
  currentStatus: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  timeline
}) => {
  const getStepIcon = (status: string) => {
    switch (status) {
      case "Submitted":
        return <Clock size={16} color="#0EA5E9" />;
      case "Under Review":
        return <Search size={16} color="#F59E0B" />;
      case "Officer Assigned":
        return <UserCheck size={16} color="#6366F1" />;
      case "Field Investigation":
        return <Search size={16} color="#EC4899" />;
      case "Action in Progress":
        return <Wrench size={16} color="#F97316" />;
      case "Resolved":
        return <CheckCircle2 size={16} color="#10B981" />;
      default:
        return <Clock size={16} color="#64748B" />;
    }
  };

  const getActorBadgeColor = (role: string) => {
    switch (role) {
      case "Citizen":
        return { bg: "#E0F2FE", text: "#0369A1" };
      case "AI System":
        return { bg: "#EDE9FE", text: "#6D28D9" };
      case "Municipal Officer":
        return { bg: "#FEF3C7", text: "#B45309" };
      case "Super Admin":
        return { bg: "#D1FAE5", text: "#047857" };
      default:
        return { bg: "#F1F5F9", text: "#475569" };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  if (!timeline || timeline.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No timeline events recorded yet.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="status-timeline-container">
      {timeline.map((item, index) => {
        const isLast = index === timeline.length - 1;
        const actorColors = getActorBadgeColor(item.actor_role);

        return (
          <View key={item.step_id || index} style={styles.stepRow}>
            {/* Timeline Line & Node */}
            <View style={styles.nodeColumn}>
              <View
                style={[
                  styles.iconNode,
                  isLast && styles.iconNodeActive
                ]}
              >
                {getStepIcon(item.status)}
              </View>
              {!isLast && <View style={styles.verticalLine} />}
            </View>

            {/* Timeline Content */}
            <View style={styles.contentColumn}>
              <View style={styles.headerRow}>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepTime}>{formatTime(item.timestamp)}</Text>
              </View>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: actorColors.bg }
                  ]}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      { color: actorColors.text }
                    ]}
                  >
                    {item.actor_name || item.actor_role}
                  </Text>
                </View>
                <Text style={styles.statusLabel}>• {item.status}</Text>
              </View>

              <Text style={styles.stepDescription}>{item.description}</Text>

              {item.evidence_photo_url && (
                <View style={styles.photoContainer}>
                  <Image
                    source={{ uri: item.evidence_photo_url }}
                    style={styles.evidenceImage}
                    contentFit="cover"
                  />
                  <Text style={styles.photoCaption}>Field Verification Photo</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8
  },
  emptyContainer: {
    padding: 16,
    alignItems: "center"
  },
  emptyText: {
    fontSize: 13,
    color: "#94A3B8"
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 4
  },
  nodeColumn: {
    alignItems: "center",
    width: 32,
    marginRight: 10
  },
  iconNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center"
  },
  iconNodeActive: {
    borderColor: "#0284C7",
    backgroundColor: "#E0F2FE"
  },
  verticalLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 4
  },
  contentColumn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
    marginRight: 8
  },
  stepTime: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "500"
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700"
  },
  statusLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600"
  },
  stepDescription: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18
  },
  photoContainer: {
    marginTop: 8,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  evidenceImage: {
    width: "100%",
    height: 120
  },
  photoCaption: {
    fontSize: 10,
    color: "#64748B",
    padding: 4,
    backgroundColor: "#F8FAFC",
    textAlign: "center"
  }
});
