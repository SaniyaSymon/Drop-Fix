import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { useIncidents, ReportItem } from "../context/IncidentContext";
import { useLanguage } from "../context/LanguageContext";
import { CategoryChips } from "./CategoryChips";
import {
  MapPin,
  List,
  Layers,
  ExternalLink
} from "lucide-react-native";

interface InteractivePublicMapProps {
  onSelectReport: (report: ReportItem) => void;
}

const SOUTH_INDIA_STATES = [
  "All States",
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Puducherry"
];

export const InteractivePublicMap: React.FC<InteractivePublicMapProps> = ({
  onSelectReport
}) => {
  const { reports, selectedState, setSelectedState } = useIncidents();
  const { t } = useLanguage();

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedMarker, setSelectedMarker] = useState<ReportItem | null>(null);

  // Filter public reports
  const publicReports = reports.filter((r) => r.is_public_visible);

  const getMarkerColor = (status: string, priority: string) => {
    if (status === "Resolved") return "#10B981"; // Green
    if (priority === "Critical") return "#EF4444"; // Red
    if (status === "Field Investigation" || status === "Action in Progress" || status === "Officer Assigned") {
      return "#F59E0B"; // Amber
    }
    return "#0EA5E9"; // Blue
  };

  return (
    <View style={styles.container} testID="south-india-public-map">
      {/* State Filter Chips */}
      <View style={styles.filterSection}>
        <CategoryChips
          categories={SOUTH_INDIA_STATES}
          selectedCategory={selectedState}
          onSelectCategory={setSelectedState}
          testIDPrefix="map-state-chip"
        />
      </View>

      {/* Map Header & Hybrid Mode Toggle */}
      <View style={styles.headerBar}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.mapTitle} testID="public-map-heading">
            {t("map.title")}
          </Text>
          <Text style={styles.approxPrivacyNotice}>
            🔒 {t("map.subtitle")}
          </Text>
        </View>

        {/* Hybrid Toggle */}
        <View style={styles.viewToggleGroup}>
          <TouchableOpacity
            testID="map-view-toggle-btn"
            style={[styles.toggleBtn, viewMode === "map" && styles.toggleBtnActive]}
            onPress={() => setViewMode("map")}
          >
            <Layers size={14} color={viewMode === "map" ? "#FFFFFF" : "#64748B"} />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "map" && styles.toggleBtnTextActive
              ]}
            >
              Map
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="list-view-toggle-btn"
            style={[styles.toggleBtn, viewMode === "list" && styles.toggleBtnActive]}
            onPress={() => setViewMode("list")}
          >
            <List size={14} color={viewMode === "list" ? "#FFFFFF" : "#64748B"} />
            <Text
              style={[
                styles.toggleBtnText,
                viewMode === "list" && styles.toggleBtnTextActive
              ]}
            >
              List ({publicReports.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#0EA5E9" }]} />
          <Text style={styles.legendLabel}>{t("map.legend_blue")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={styles.legendLabel}>{t("map.legend_amber")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.legendLabel}>{t("map.legend_red")}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <Text style={styles.legendLabel}>{t("map.legend_green")}</Text>
        </View>
      </View>

      {/* Main Map / Hybrid Content */}
      {viewMode === "map" ? (
        <View style={styles.mapCanvas} testID="interactive-leaflet-map-canvas">
          {/* Simulated High-Fidelity South India Grid Map */}
          <View style={styles.mapGridBackground}>
            <Text style={styles.mapWatermark}>SOUTH INDIA REGIONAL WATER GRID</Text>
            <Text style={styles.mapCoordinatesCenter}>
              Lat: 11.0°N - 18.0°N | Lng: 75.0°E - 83.5°E
            </Text>

            {/* Interactive Cluster Pin Items */}
            <ScrollView
              contentContainerStyle={styles.clusterPinsGrid}
              showsVerticalScrollIndicator={false}
            >
              {publicReports.map((report) => {
                const markerColor = getMarkerColor(report.status, report.priority);
                const isSelected = selectedMarker?.report_id === report.report_id;

                return (
                  <TouchableOpacity
                    key={report.report_id}
                    testID={`map-pin-${report.report_id}`}
                    style={[
                      styles.mapPinCard,
                      { borderLeftColor: markerColor },
                      isSelected && styles.mapPinCardSelected
                    ]}
                    onPress={() => {
                      setSelectedMarker(report);
                      onSelectReport(report);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pinHeader}>
                      <View style={styles.pinLocationRow}>
                        <MapPin size={16} color={markerColor} />
                        <Text style={styles.pinAreaName} numberOfLines={1}>
                          {report.ward_locality || report.district}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.pinStatusBadge,
                          { backgroundColor: `${markerColor}20` }
                        ]}
                      >
                        <Text style={[styles.pinStatusText, { color: markerColor }]}>
                          {report.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.pinCategoryText}>
                      ⚠️ {report.category}
                    </Text>

                    <Text style={styles.pinDescSnippet} numberOfLines={2}>
                      {report.translated_description_en || report.original_description}
                    </Text>

                    <View style={styles.pinFooter}>
                      <Text style={styles.pinStateText}>
                        📍 {report.district}, {report.state}
                      </Text>
                      <Text style={styles.pinIdText}>{report.report_id}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* List Mode */
        <ScrollView style={styles.listView} showsVerticalScrollIndicator={false}>
          {publicReports.map((report) => {
            const markerColor = getMarkerColor(report.status, report.priority);

            return (
              <TouchableOpacity
                key={report.report_id}
                testID={`list-item-${report.report_id}`}
                style={styles.listItemCard}
                onPress={() => onSelectReport(report)}
                activeOpacity={0.8}
              >
                <View style={styles.listHeaderRow}>
                  <View style={styles.listBadgeGroup}>
                    <View
                      style={[
                        styles.priorityPill,
                        { backgroundColor: `${markerColor}20` }
                      ]}
                    >
                      <Text style={[styles.priorityPillText, { color: markerColor }]}>
                        {report.priority}
                      </Text>
                    </View>
                    <Text style={styles.listReportId}>{report.report_id}</Text>
                  </View>
                  <Text style={styles.listStatusText}>{report.status}</Text>
                </View>

                <Text style={styles.listCategory}>{report.category}</Text>
                <Text style={styles.listDescription} numberOfLines={2}>
                  {report.translated_description_en || report.original_description}
                </Text>

                <View style={styles.listFooter}>
                  <Text style={styles.listLocation}>
                    📍 {report.ward_locality}, {report.district}, {report.state}
                  </Text>
                  <TouchableOpacity
                    style={styles.viewDetailsBtn}
                    onPress={() => onSelectReport(report)}
                  >
                    <Text style={styles.viewDetailsText}>Details</Text>
                    <ExternalLink size={12} color="#0284C7" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  filterSection: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF"
  },
  headerTextGroup: {
    flex: 1,
    marginRight: 10
  },
  mapTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  approxPrivacyNotice: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2
  },
  viewToggleGroup: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9
  },
  toggleBtnActive: {
    backgroundColor: "#0284C7"
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B"
  },
  toggleBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#F1F5F9",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0"
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#475569"
  },
  mapCanvas: {
    flex: 1,
    backgroundColor: "#E0F2FE"
  },
  mapGridBackground: {
    flex: 1,
    padding: 12
  },
  mapWatermark: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(2, 132, 199, 0.25)",
    letterSpacing: 2,
    textAlign: "center"
  },
  mapCoordinatesCenter: {
    fontSize: 9,
    color: "rgba(2, 132, 199, 0.4)",
    textAlign: "center",
    marginBottom: 10
  },
  clusterPinsGrid: {
    gap: 10,
    paddingBottom: 24
  },
  mapPinCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  mapPinCardSelected: {
    borderColor: "#0284C7",
    backgroundColor: "#F0F9FF"
  },
  pinHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  pinLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1
  },
  pinAreaName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1
  },
  pinStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  pinStatusText: {
    fontSize: 10,
    fontWeight: "700"
  },
  pinCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0284C7",
    marginBottom: 4
  },
  pinDescSnippet: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 6
  },
  pinFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 6
  },
  pinStateText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500"
  },
  pinIdText: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700"
  },
  listView: {
    flex: 1,
    padding: 16
  },
  listItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  listHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  listBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  priorityPillText: {
    fontSize: 10,
    fontWeight: "800"
  },
  listReportId: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B"
  },
  listStatusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A"
  },
  listCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 4
  },
  listDescription: {
    fontSize: 13,
    color: "#334155",
    lineHeight: 18,
    marginBottom: 8
  },
  listFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8
  },
  listLocation: {
    fontSize: 11,
    color: "#64748B"
  },
  viewDetailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7"
  }
});
