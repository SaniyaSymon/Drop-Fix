import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

// Contexts
import { useLanguage } from "../src/context/LanguageContext";
import { useAuth } from "../src/context/AuthContext";
import { useIncidents, ReportItem } from "../src/context/IncidentContext";

// Components
import { Splash3DAnimation } from "../src/components/Splash3DAnimation";
import { HeaderNav } from "../src/components/HeaderNav";
import { RoleSwitcherModal } from "../src/components/RoleSwitcherModal";
import { VoiceAssistantModal } from "../src/components/VoiceAssistantModal";
import { GuideNavigatorModal } from "../src/components/GuideNavigatorModal";
import { InteractivePublicMap } from "../src/components/InteractivePublicMap";
import { CategoryChips } from "../src/components/CategoryChips";
import { StatusTimeline } from "../src/components/StatusTimeline";

// Icons
import {
  Home,
  PlusCircle,
  MapPin,
  Search,
  ShieldCheck,
  Mic,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Send,
  Wrench,
  ShieldAlert,
  Sparkles,
  X,
  RefreshCw
} from "lucide-react-native";

const SOUTH_INDIA_STATES = [
  "Tamil Nadu",
  "Kerala",
  "Karnataka",
  "Andhra Pradesh",
  "Telangana",
  "Puducherry"
];

const ISSUE_CATEGORIES = [
  "All Categories",
  "Sewage Mixing",
  "Unusual Water Colour",
  "Foul Smell",
  "Bad Taste",
  "Pipeline Leakage",
  "Suspected Industrial Discharge",
  "Visible Particles/Sludge",
  "Health Concerns",
  "Other"
];

const WATER_SOURCES = [
  "Municipal Pipeline",
  "Borewell / Ground",
  "Overhead Tank",
  "Lake / Waterbody",
  "Public Tap",
  "Tanker Water"
];

export default function AppIndex() {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const { role, user } = useAuth();
  const {
    reports,
    advisories,
    clusters,
    analytics,
    selectedCategory,
    setSelectedCategory,
    createReport,
    trackReport,
    updateReportStatus,
    reseedDatabase
  } = useIncidents();

  // App State
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"home" | "report" | "map" | "track" | "ops">("home");

  // Modals
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState<ReportItem | null>(null);
  const [submittedReport, setSubmittedReport] = useState<ReportItem | null>(null);

  // Report Form State
  const [reportCategory, setReportCategory] = useState<string>("Unusual Water Colour");
  const [reportDescription, setReportDescription] = useState<string>("");
  const [reportVoiceTranscript, setReportVoiceTranscript] = useState<string>("");
  const [reportState, setReportState] = useState<string>("Tamil Nadu");
  const [reportDistrict, setReportDistrict] = useState<string>("Chennai");
  const [reportLocality, setReportLocality] = useState<string>("");
  const [reportLandmark, setReportLandmark] = useState<string>("");
  const [reportPincode, setReportPincode] = useState<string>("");
  const [reportWaterSource, setReportWaterSource] = useState<string>("Municipal Pipeline");
  const [isMultipleHouseholds, setIsMultipleHouseholds] = useState<boolean>(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [reporterName, setReporterName] = useState<string>("");
  const [reporterPhone, setReporterPhone] = useState<string>("");
  const [selectedPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=600"
  ]);
  const [isSubmittingReport, setIsSubmittingReport] = useState<boolean>(false);

  // Tracking Form State
  const [trackReportIdInput, setTrackReportIdInput] = useState<string>("");
  const [trackCodeInput, setTrackCodeInput] = useState<string>("");
  const [trackedReport, setTrackedReport] = useState<ReportItem | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState<boolean>(false);
  const [trackError, setTrackError] = useState<string | null>(null);

  // Officer Action State
  const [officerStatusSelect, setOfficerStatusSelect] = useState<string>("Field Investigation");
  const [officerNotesInput, setOfficerNotesInput] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // Handle Voice Assistant Structured Data Fill
  const handleStructuredVoiceData = (data: any) => {
    if (data.category) setReportCategory(data.category);
    if (data.original_description) setReportDescription(data.original_description);
    if (data.state && SOUTH_INDIA_STATES.includes(data.state)) setReportState(data.state);
    if (data.district) setReportDistrict(data.district);
    if (data.ward_locality) setReportLocality(data.ward_locality);
    if (data.multiple_households !== undefined) setIsMultipleHouseholds(data.multiple_households);
    if (data.original_voice_transcript) setReportVoiceTranscript(data.original_voice_transcript);
    setActiveTab("report");
  };

  // Submit Report
  const handleSubmitReport = async () => {
    if (!reportDescription.trim()) {
      alert("Please describe the water problem observed.");
      return;
    }
    if (!reportLocality.trim()) {
      alert("Please enter the ward, street or locality name.");
      return;
    }

    setIsSubmittingReport(true);
    try {
      const payload = {
        is_anonymous: isAnonymous,
        reporter_name: isAnonymous ? "Anonymous Citizen" : reporterName || "Citizen",
        reporter_contact: reporterPhone || null,
        report_language: language,
        original_description: reportDescription,
        original_voice_transcript: reportVoiceTranscript || null,
        category: reportCategory,
        state: reportState,
        district: reportDistrict,
        city_town: reportDistrict,
        ward_locality: reportLocality,
        landmark: reportLandmark || null,
        pincode: reportPincode || null,
        multiple_households_affected: isMultipleHouseholds,
        affected_households_count_approx: isMultipleHouseholds ? "5-15 households" : "1",
        water_source_type: reportWaterSource,
        photo_urls: selectedPhotos
      };

      const result = await createReport(payload);
      setSubmittedReport(result);
      // Reset form fields
      setReportDescription("");
      setReportVoiceTranscript("");
      setReportLocality("");
      setReportLandmark("");
    } catch (e: any) {
      alert(e.message || "Failed to submit report. Please try again.");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle Tracking Search
  const handleTrackSearch = async (prefillId?: string, prefillCode?: string) => {
    const id = prefillId || trackReportIdInput;
    const code = prefillCode || trackCodeInput;

    if (!id.trim()) {
      setTrackError("Please enter a valid Report ID (e.g. DF-2026-TN-4821)");
      return;
    }

    setIsTrackingLoading(true);
    setTrackError(null);
    try {
      const report = await trackReport(id.trim(), code.trim() || "TRK-DEMO");
      setTrackedReport(report);
    } catch (err: any) {
      setTrackError(err.message || "Unable to find incident with this ID.");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  // Officer Update Status
  const handleOfficerStatusUpdate = async () => {
    if (!selectedReportDetail) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await updateReportStatus(selectedReportDetail.report_id, {
        status: officerStatusSelect,
        officer_notes: officerNotesInput || `Status updated to ${officerStatusSelect} by ${user.name}`,
        assigned_officer_name: user.name,
        assigned_department: user.department,
        actor_name: user.name,
        actor_role: "Municipal Officer"
      });
      setSelectedReportDetail(updated);
      setOfficerNotesInput("");
      alert(`Report ${updated.report_id} updated successfully!`);
    } catch (e: any) {
      alert(e.message || "Failed to update report status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (showSplash) {
    return <Splash3DAnimation onComplete={() => setShowSplash(false)} />;
  }

  return (
    <View style={[styles.appContainer, { paddingTop: insets.top }]} testID="dropfix-root-view">
      {/* Top Glass Header */}
      <HeaderNav onOpenGuide={() => setIsGuideModalOpen(true)} />

      {/* Main Screen Content by Tab */}
      <View style={styles.mainContent}>
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <ScrollView style={styles.tabScrollView} showsVerticalScrollIndicator={false}>
            {/* Cautionary Civic Banner */}
            <View style={styles.disclaimerBanner} testID="home-disclaimer-banner">
              <ShieldCheck size={16} color="#0369A1" />
              <Text style={styles.disclaimerText}>{t("disclaimer_banner")}</Text>
            </View>

            {/* Hero Card */}
            <LinearGradient
              colors={["#0C4A6E", "#0284C7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTextCol}>
                <Text style={styles.heroTitle}>{t("home.hero_title")}</Text>
                <Text style={styles.heroSubtitle}>{t("home.hero_subtitle")}</Text>

                <View style={styles.heroStateBadges}>
                  <Text style={styles.heroCoverageLabel}>Covering 6 South Indian Regions:</Text>
                  <Text style={styles.heroStateNames}>
                    Tamil Nadu • Kerala • Karnataka • AP • Telangana • Puducherry
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Quick Action Hub */}
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                testID="quick-action-voice-report"
                style={[styles.quickActionCard, { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" }]}
                onPress={() => setIsVoiceModalOpen(true)}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: "#0284C7" }]}>
                  <Mic size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionCardTitle}>{t("home.quick_report_voice")}</Text>
                <Text style={styles.actionCardSub}>Speak in 5 Languages</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="quick-action-photo-report"
                style={[styles.quickActionCard, { backgroundColor: "#FDF2F8", borderColor: "#FBCFE8" }]}
                onPress={() => setActiveTab("report")}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: "#DB2777" }]}>
                  <Camera size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionCardTitle}>{t("home.quick_report_camera")}</Text>
                <Text style={styles.actionCardSub}>Upload Photo / Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="quick-action-track-id"
                style={[styles.quickActionCard, { backgroundColor: "#F5F3FF", borderColor: "#DDD6FE" }]}
                onPress={() => setActiveTab("track")}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBadge, { backgroundColor: "#7C3AED" }]}>
                  <Search size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.actionCardTitle}>{t("home.quick_track")}</Text>
                <Text style={styles.actionCardSub}>Live Authority Timeline</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Live Telemetry Counter */}
            {analytics && (
              <View style={styles.telemetryBar}>
                <View style={styles.telemetryStat}>
                  <Text style={styles.statNum}>{analytics.total_reports}</Text>
                  <Text style={styles.statLabel}>{t("home.stats_total")}</Text>
                </View>
                <View style={styles.telemetryDivider} />
                <View style={styles.telemetryStat}>
                  <Text style={[styles.statNum, { color: "#10B981" }]}>
                    {analytics.resolved_reports}
                  </Text>
                  <Text style={styles.statLabel}>{t("home.stats_resolved")}</Text>
                </View>
                <View style={styles.telemetryDivider} />
                <View style={styles.telemetryStat}>
                  <Text style={[styles.statNum, { color: "#F59E0B" }]}>
                    {analytics.in_progress}
                  </Text>
                  <Text style={styles.statLabel}>{t("home.stats_in_progress")}</Text>
                </View>
                <View style={styles.telemetryDivider} />
                <View style={styles.telemetryStat}>
                  <Text style={[styles.statNum, { color: "#EF4444" }]}>
                    {analytics.active_advisories}
                  </Text>
                  <Text style={styles.statLabel}>Advisories</Text>
                </View>
              </View>
            )}

            {/* Active Advisories Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <AlertTriangle size={18} color="#EF4444" />
                  <Text style={styles.sectionTitle}>{t("home.active_advisories")}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveTab("ops")}>
                  <Text style={styles.seeAllText}>View All</Text>
                </TouchableOpacity>
              </View>

              {advisories.slice(0, 2).map((adv) => {
                const title = adv.title_translations?.[language] || adv.title;
                const desc = adv.description_translations?.[language] || adv.description;

                return (
                  <View key={adv.advisory_id} style={styles.advisoryCard} testID={`advisory-${adv.advisory_id}`}>
                    <View style={styles.advisoryHeader}>
                      <View style={styles.advisoryTypePill}>
                        <Text style={styles.advisoryTypePillText}>{adv.advisory_type}</Text>
                      </View>
                      <Text style={styles.advisoryStateBadge}>
                        📍 {adv.district}, {adv.state}
                      </Text>
                    </View>
                    <Text style={styles.advisoryTitleText}>{title}</Text>
                    <Text style={styles.advisoryDescText} numberOfLines={2}>
                      {desc}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Category Filter Chips (P0 Spec) */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t("home.recent_incidents")}</Text>
                <TouchableOpacity onPress={() => setActiveTab("map")}>
                  <Text style={styles.seeAllText}>Open Public Map</Text>
                </TouchableOpacity>
              </View>

              <CategoryChips
                categories={ISSUE_CATEGORIES}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                testIDPrefix="home-category-chip"
              />

              {/* Feed of Incidents */}
              <View style={styles.incidentsFeed}>
                {reports.slice(0, 4).map((item) => (
                  <TouchableOpacity
                    key={item.report_id}
                    testID={`incident-feed-card-${item.report_id}`}
                    style={styles.feedCard}
                    onPress={() => setSelectedReportDetail(item)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.feedCardHeader}>
                      <View style={styles.feedLocGroup}>
                        <MapPin size={14} color="#0284C7" />
                        <Text style={styles.feedLocation} numberOfLines={1}>
                          {item.ward_locality}, {item.district}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.feedStatusPill,
                          {
                            backgroundColor:
                              item.status === "Resolved"
                                ? "#D1FAE5"
                                : item.priority === "Critical"
                                ? "#FEE2E2"
                                : "#E0F2FE"
                          }
                        ]}
                      >
                        <Text
                          style={[
                            styles.feedStatusText,
                            {
                              color:
                                item.status === "Resolved"
                                  ? "#047857"
                                  : item.priority === "Critical"
                                  ? "#B91C1C"
                                  : "#0369A1"
                            }
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.feedCategoryTitle}>{item.category}</Text>
                    <Text style={styles.feedDescription} numberOfLines={2}>
                      {item.translated_description_en || item.original_description}
                    </Text>

                    <View style={styles.feedFooter}>
                      <Text style={styles.feedIdBadge}>{item.report_id}</Text>
                      <Text style={styles.feedStateLabel}>
                        {item.state} • {item.water_source_type}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        )}

        {/* TAB 2: REPORT */}
        {activeTab === "report" && (
          <ScrollView style={styles.tabScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.reportFormCard} testID="report-incident-form">
              <View style={styles.formHeader}>
                <Text style={styles.formTitle} testID="report-form-title">
                  {t("report.title")}
                </Text>
                <Text style={styles.formSubtitle}>{t("report.subtitle")}</Text>
              </View>

              {/* Voice Assistant Shortcut CTA */}
              <TouchableOpacity
                testID="report-voice-assistant-cta"
                style={styles.voiceAssistantCtaBanner}
                onPress={() => setIsVoiceModalOpen(true)}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#0EA5E9", "#0284C7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.voiceCtaGradient}
                >
                  <View style={styles.micCircle}>
                    <Mic size={20} color="#0284C7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.voiceCtaTitle}>Speak to Report</Text>
                    <Text style={styles.voiceCtaSub}>
                      Speak in Tamil, Telugu, Kannada, Malayalam, or English
                    </Text>
                  </View>
                  <Sparkles size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Step 1: Issue Classification */}
              <Text style={styles.stepHeading}>{t("report.step1")}</Text>

              <Text style={styles.inputLabel}>{t("report.category_label")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                {ISSUE_CATEGORIES.filter((c) => c !== "All Categories").map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    testID={`form-category-pill-${cat}`}
                    style={[
                      styles.selectorPill,
                      reportCategory === cat && styles.selectorPillActive
                    ]}
                    onPress={() => setReportCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.selectorPillText,
                        reportCategory === cat && styles.selectorPillTextActive
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>{t("report.description_label")}</Text>
              <TextInput
                testID="report-description-input"
                style={styles.textAreaInput}
                placeholder={t("report.description_placeholder")}
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              {/* Step 2: Location */}
              <Text style={[styles.stepHeading, { marginTop: 16 }]}>{t("report.step2")}</Text>

              <Text style={styles.inputLabel}>{t("report.state_label")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                {SOUTH_INDIA_STATES.map((st) => (
                  <TouchableOpacity
                    key={st}
                    testID={`form-state-pill-${st}`}
                    style={[
                      styles.selectorPill,
                      reportState === st && styles.selectorPillActive
                    ]}
                    onPress={() => {
                      setReportState(st);
                      // Set default major district
                      const defaults: Record<string, string> = {
                        "Tamil Nadu": "Chennai",
                        "Kerala": "Ernakulam",
                        "Karnataka": "Bengaluru Urban",
                        "Andhra Pradesh": "Visakhapatnam",
                        "Telangana": "Hyderabad",
                        "Puducherry": "Puducherry"
                      };
                      setReportDistrict(defaults[st] || "District");
                    }}
                  >
                    <Text
                      style={[
                        styles.selectorPillText,
                        reportState === st && styles.selectorPillTextActive
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.inputRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t("report.district_label")}</Text>
                  <TextInput
                    testID="report-district-input"
                    style={styles.textInput}
                    value={reportDistrict}
                    onChangeText={setReportDistrict}
                    placeholder="E.g., Chennai, Bengaluru"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t("report.pincode_label")}</Text>
                  <TextInput
                    testID="report-pincode-input"
                    style={styles.textInput}
                    value={reportPincode}
                    onChangeText={setReportPincode}
                    placeholder="600017"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>{t("report.locality_label")}</Text>
              <TextInput
                testID="report-locality-input"
                style={styles.textInput}
                placeholder={t("report.locality_placeholder")}
                placeholderTextColor="#94A3B8"
                value={reportLocality}
                onChangeText={setReportLocality}
              />

              <Text style={styles.inputLabel}>{t("report.landmark_label")}</Text>
              <TextInput
                testID="report-landmark-input"
                style={styles.textInput}
                placeholder={t("report.landmark_placeholder")}
                placeholderTextColor="#94A3B8"
                value={reportLandmark}
                onChangeText={setReportLandmark}
              />

              {/* Step 3: Source and Scope */}
              <Text style={[styles.stepHeading, { marginTop: 16 }]}>{t("report.step3")}</Text>

              <Text style={styles.inputLabel}>{t("report.water_source_label")}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                {WATER_SOURCES.map((ws) => (
                  <TouchableOpacity
                    key={ws}
                    testID={`form-source-pill-${ws}`}
                    style={[
                      styles.selectorPill,
                      reportWaterSource === ws && styles.selectorPillActive
                    ]}
                    onPress={() => setReportWaterSource(ws)}
                  >
                    <Text
                      style={[
                        styles.selectorPillText,
                        reportWaterSource === ws && styles.selectorPillTextActive
                      ]}
                    >
                      {ws}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Multiple Households Toggle */}
              <TouchableOpacity
                testID="toggle-multiple-households-btn"
                style={styles.checkboxRow}
                onPress={() => setIsMultipleHouseholds(!isMultipleHouseholds)}
              >
                <View style={[styles.checkbox, isMultipleHouseholds && styles.checkboxActive]}>
                  {isMultipleHouseholds && <CheckCircle2 size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.checkboxLabel}>{t("report.multiple_households_label")}</Text>
              </TouchableOpacity>

              {/* Anonymous Reporting Toggle */}
              <View style={styles.anonymousBox}>
                <TouchableOpacity
                  testID="toggle-anonymous-reporting-btn"
                  style={styles.checkboxRow}
                  onPress={() => setIsAnonymous(!isAnonymous)}
                >
                  <View style={[styles.checkbox, isAnonymous && styles.checkboxActive]}>
                    {isAnonymous && <CheckCircle2 size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.checkboxLabelBold}>{t("report.anonymous_toggle")}</Text>
                </TouchableOpacity>
                <Text style={styles.anonymousHint}>{t("report.anonymous_hint")}</Text>
              </View>

              {!isAnonymous && (
                <View style={{ gap: 8, marginTop: 8 }}>
                  <Text style={styles.inputLabel}>{t("report.reporter_name_label")}</Text>
                  <TextInput
                    testID="report-reporter-name-input"
                    style={styles.textInput}
                    placeholder="Your Name"
                    value={reporterName}
                    onChangeText={setReporterName}
                  />
                  <Text style={styles.inputLabel}>{t("report.reporter_contact_label")}</Text>
                  <TextInput
                    testID="report-reporter-phone-input"
                    style={styles.textInput}
                    placeholder="+91 98450 XXXXX"
                    keyboardType="phone-pad"
                    value={reporterPhone}
                    onChangeText={setReporterPhone}
                  />
                </View>
              )}

              {/* Submit CTA */}
              <TouchableOpacity
                testID="submit-report-form-btn"
                style={styles.submitButton}
                onPress={handleSubmitReport}
                disabled={isSubmittingReport}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#0EA5E9", "#0284C7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {isSubmittingReport ? (
                    <View style={styles.submittingRow}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>{t("report.submitting")}</Text>
                    </View>
                  ) : (
                    <>
                      <Send size={18} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>{t("report.submit_btn")}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* TAB 3: PUBLIC MAP */}
        {activeTab === "map" && (
          <InteractivePublicMap onSelectReport={(rep) => setSelectedReportDetail(rep)} />
        )}

        {/* TAB 4: TRACK REPORT */}
        {activeTab === "track" && (
          <ScrollView style={styles.tabScrollView} showsVerticalScrollIndicator={false}>
            <View style={styles.trackCard} testID="track-report-screen">
              <Text style={styles.trackTitle}>{t("track.title")}</Text>
              <Text style={styles.trackSubtitle}>{t("track.subtitle")}</Text>

              <View style={styles.trackInputsContainer}>
                <Text style={styles.inputLabel}>{t("track.report_id_input")}</Text>
                <TextInput
                  testID="track-report-id-input"
                  style={styles.textInput}
                  placeholder="e.g. DF-2026-TN-4821"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={trackReportIdInput}
                  onChangeText={setTrackReportIdInput}
                />

                <Text style={styles.inputLabel}>{t("track.tracking_code_input")}</Text>
                <TextInput
                  testID="track-tracking-code-input"
                  style={styles.textInput}
                  placeholder="e.g. TRK-89324"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  value={trackCodeInput}
                  onChangeText={setTrackCodeInput}
                />

                {trackError && (
                  <View style={styles.errorBanner}>
                    <AlertTriangle size={16} color="#B91C1C" />
                    <Text style={styles.errorBannerText}>{trackError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  testID="track-lookup-btn"
                  style={styles.trackButton}
                  onPress={() => handleTrackSearch()}
                  disabled={isTrackingLoading}
                >
                  {isTrackingLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Search size={18} color="#FFFFFF" />
                      <Text style={styles.trackButtonText}>{t("track.track_btn")}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sample Quick Demo Clickers */}
              <View style={styles.sampleTracksSection}>
                <Text style={styles.sampleTrackTitle}>💡 Tap to test-track sample South Indian reports:</Text>
                <View style={styles.sampleTrackChips}>
                  <TouchableOpacity
                    testID="sample-track-tn-btn"
                    style={styles.sampleTrackChip}
                    onPress={() => {
                      setTrackReportIdInput("DF-2026-TN-4821");
                      setTrackCodeInput("TRK-89324");
                      handleTrackSearch("DF-2026-TN-4821", "TRK-89324");
                    }}
                  >
                    <Text style={styles.sampleTrackChipText}>Chennai (Sewage Mixing)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="sample-track-ka-btn"
                    style={styles.sampleTrackChip}
                    onPress={() => {
                      setTrackReportIdInput("DF-2026-KA-1092");
                      setTrackCodeInput("TRK-44120");
                      handleTrackSearch("DF-2026-KA-1092", "TRK-44120");
                    }}
                  >
                    <Text style={styles.sampleTrackChipText}>Bengaluru (Pipeline Burst)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="sample-track-kl-btn"
                    style={styles.sampleTrackChip}
                    onPress={() => {
                      setTrackReportIdInput("DF-2026-KL-7731");
                      setTrackCodeInput("TRK-31980");
                      handleTrackSearch("DF-2026-KL-7731", "TRK-31980");
                    }}
                  >
                    <Text style={styles.sampleTrackChipText}>Kochi (Chemical Sheen)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    testID="sample-track-tg-btn"
                    style={styles.sampleTrackChip}
                    onPress={() => {
                      setTrackReportIdInput("DF-2026-TG-3342");
                      setTrackCodeInput("TRK-11295");
                      handleTrackSearch("DF-2026-TG-3342", "TRK-11295");
                    }}
                  >
                    <Text style={styles.sampleTrackChipText}>Hyderabad (Resolved)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Active Tracked Incident Details */}
              {trackedReport && (
                <View style={styles.trackedResultBox} testID="tracked-incident-details">
                  <View style={styles.trackedHeader}>
                    <View>
                      <Text style={styles.trackedReportId}>{trackedReport.report_id}</Text>
                      <Text style={styles.trackedCategory}>⚠️ {trackedReport.category}</Text>
                    </View>
                    <View style={styles.trackedStatusBadge}>
                      <Text style={styles.trackedStatusText}>{trackedReport.status}</Text>
                    </View>
                  </View>

                  <View style={styles.trackedMetaGrid}>
                    <Text style={styles.trackedMetaItem}>
                      📍 {trackedReport.ward_locality}, {trackedReport.district}, {trackedReport.state}
                    </Text>
                    <Text style={styles.trackedMetaItem}>
                      💧 Source: {trackedReport.water_source_type}
                    </Text>
                    {trackedReport.assigned_department && (
                      <Text style={styles.trackedMetaItem}>
                        🏛️ Dept: {trackedReport.assigned_department}
                      </Text>
                    )}
                  </View>

                  {/* AI Safety Assessment */}
                  {trackedReport.ai_cautious_advisory && (
                    <View style={styles.aiAdvisoryBox}>
                      <Text style={styles.aiAdvisoryTitle}>🛡️ AI Cautionary Advisory:</Text>
                      <Text style={styles.aiAdvisoryText}>
                        {trackedReport.ai_cautious_advisory}
                      </Text>
                    </View>
                  )}

                  {/* Timeline Stepper */}
                  <Text style={styles.timelineHeading}>{t("track.status_timeline")}</Text>
                  <StatusTimeline
                    timeline={trackedReport.timeline}
                    currentStatus={trackedReport.status}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        )}

        {/* TAB 5: OPERATIONS / SAFETY / ADMIN HUB (Role-based) */}
        {activeTab === "ops" && (
          <ScrollView style={styles.tabScrollView} showsVerticalScrollIndicator={false}>
            {/* CITIZEN MODE: Water Safety Hub */}
            {role === "citizen" && (
              <View style={styles.safetyContainer} testID="citizen-safety-hub">
                <Text style={styles.safetyTitle}>{t("safety.title")}</Text>
                <Text style={styles.safetySubtitle}>{t("safety.subtitle")}</Text>

                {/* Boil Water Guide */}
                <View style={styles.safetyCard}>
                  <View style={styles.safetyCardHeader}>
                    <View style={[styles.safetyIconBadge, { backgroundColor: "#FEF3C7" }]}>
                      <AlertTriangle size={20} color="#D97706" />
                    </View>
                    <Text style={styles.safetyCardTitle}>{t("safety.boil_guide_title")}</Text>
                  </View>
                  <Text style={styles.safetyCardDesc}>{t("safety.boil_guide_desc")}</Text>
                </View>

                {/* Filtration Guide */}
                <View style={styles.safetyCard}>
                  <View style={styles.safetyCardHeader}>
                    <View style={[styles.safetyIconBadge, { backgroundColor: "#E0F2FE" }]}>
                      <ShieldCheck size={20} color="#0284C7" />
                    </View>
                    <Text style={styles.safetyCardTitle}>{t("safety.filtration_title")}</Text>
                  </View>
                  <Text style={styles.safetyCardDesc}>{t("safety.filtration_desc")}</Text>
                </View>

                {/* Municipal Emergency Contacts */}
                <Text style={styles.helplineHeading}>{t("safety.emergency_contacts")}</Text>
                <View style={styles.helplinesList}>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Tamil Nadu (CMWSSB / TWAD)</Text>
                    <Text style={styles.helplineNumber}>📞 044-45674567 / 1916</Text>
                  </View>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Karnataka (BWSSB Bangalore)</Text>
                    <Text style={styles.helplineNumber}>📞 1916 / 080-22238888</Text>
                  </View>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Kerala (Kerala Water Authority)</Text>
                    <Text style={styles.helplineNumber}>📞 1916 / 0471-2328654</Text>
                  </View>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Telangana (HMWSSB Hyderabad)</Text>
                    <Text style={styles.helplineNumber}>📞 155313 / 040-23317777</Text>
                  </View>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Andhra Pradesh (GVMC Vizag)</Text>
                    <Text style={styles.helplineNumber}>📞 1800-425-00009</Text>
                  </View>
                  <View style={styles.helplineItem}>
                    <Text style={styles.helplineState}>Puducherry (PWD Water)</Text>
                    <Text style={styles.helplineNumber}>📞 0413-2225555</Text>
                  </View>
                </View>
              </View>
            )}

            {/* MUNICIPAL OFFICER MODE */}
            {role === "officer" && (
              <View style={styles.officerContainer} testID="municipal-officer-desk">
                <View style={styles.officerHeaderCard}>
                  <View style={styles.officerAvatarRow}>
                    <View style={styles.officerIconWrap}>
                      <Wrench size={24} color="#D97706" />
                    </View>
                    <View>
                      <Text style={styles.officerName}>{user.name}</Text>
                      <Text style={styles.officerDept}>{user.department}</Text>
                      <Text style={styles.officerJurisdiction}>📍 {user.jurisdiction}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>{t("authority.title")}</Text>
                <Text style={styles.sectionSub}>{t("authority.subtitle")}</Text>

                {/* Queue List */}
                <View style={styles.queueList}>
                  {reports.map((rep) => (
                    <TouchableOpacity
                      key={rep.report_id}
                      testID={`officer-queue-card-${rep.report_id}`}
                      style={styles.officerCard}
                      onPress={() => setSelectedReportDetail(rep)}
                    >
                      <View style={styles.officerCardTop}>
                        <Text style={styles.officerReportId}>{rep.report_id}</Text>
                        <View style={styles.officerStatusBadge}>
                          <Text style={styles.officerStatusText}>{rep.status}</Text>
                        </View>
                      </View>
                      <Text style={styles.officerCategory}>⚠️ {rep.category}</Text>
                      <Text style={styles.officerDesc} numberOfLines={2}>
                        {rep.translated_description_en || rep.original_description}
                      </Text>
                      <View style={styles.officerFooter}>
                        <Text style={styles.officerLoc}>
                          📍 {rep.ward_locality}, {rep.district}
                        </Text>
                        <Text style={styles.officerActionHint}>Tap to Update & Add Notes ➔</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* SUPER ADMIN MODE */}
            {role === "admin" && (
              <View style={styles.adminContainer} testID="super-admin-command">
                <Text style={styles.adminTitle}>{t("admin.title")}</Text>
                <Text style={styles.adminSubtitle}>{t("admin.subtitle")}</Text>

                {/* Reseed Button for Judges */}
                <TouchableOpacity
                  testID="admin-reseed-db-btn"
                  style={styles.reseedButton}
                  onPress={async () => {
                    await reseedDatabase();
                    alert("Database reset and re-seeded with South Indian demo data!");
                  }}
                >
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.reseedButtonText}>{t("admin.reset_seed")}</Text>
                </TouchableOpacity>

                {/* Incident Hotspot Clusters */}
                <Text style={styles.clustersHeading}>{t("admin.clusters_title")}</Text>
                {clusters.map((clu) => (
                  <View key={clu.cluster_id} style={styles.clusterCard} testID={`cluster-card-${clu.cluster_id}`}>
                    <View style={styles.clusterHeader}>
                      <Text style={styles.clusterName}>{clu.cluster_name}</Text>
                      <View style={styles.clusterCountBadge}>
                        <Text style={styles.clusterCountText}>{clu.incident_count} Incidents</Text>
                      </View>
                    </View>
                    <Text style={styles.clusterLoc}>
                      📍 {clu.locality}, {clu.district}, {clu.state}
                    </Text>
                    <Text style={styles.clusterRecTitle}>Recommended Action:</Text>
                    <Text style={styles.clusterRecText}>{clu.recommended_municipal_action}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Modern Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]} testID="bottom-navigation-bar">
        <TouchableOpacity
          testID="tab-btn-home"
          style={styles.tabButton}
          onPress={() => setActiveTab("home")}
        >
          <Home size={22} color={activeTab === "home" ? "#0284C7" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>
            {t("nav.home")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-btn-report"
          style={styles.tabButton}
          onPress={() => setActiveTab("report")}
        >
          <PlusCircle size={22} color={activeTab === "report" ? "#0284C7" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "report" && styles.tabLabelActive]}>
            {t("nav.report")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-btn-map"
          style={styles.tabButton}
          onPress={() => setActiveTab("map")}
        >
          <MapPin size={22} color={activeTab === "map" ? "#0284C7" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "map" && styles.tabLabelActive]}>
            {t("nav.map")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-btn-track"
          style={styles.tabButton}
          onPress={() => setActiveTab("track")}
        >
          <Search size={22} color={activeTab === "track" ? "#0284C7" : "#64748B"} />
          <Text style={[styles.tabLabel, activeTab === "track" && styles.tabLabelActive]}>
            {t("nav.track")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="tab-btn-operations"
          style={styles.tabButton}
          onPress={() => setActiveTab("ops")}
        >
          {role === "citizen" ? (
            <ShieldCheck size={22} color={activeTab === "ops" ? "#0284C7" : "#64748B"} />
          ) : role === "officer" ? (
            <Wrench size={22} color={activeTab === "ops" ? "#D97706" : "#64748B"} />
          ) : (
            <ShieldAlert size={22} color={activeTab === "ops" ? "#047857" : "#64748B"} />
          )}
          <Text style={[styles.tabLabel, activeTab === "ops" && styles.tabLabelActive]}>
            {role === "citizen" ? t("nav.safety") : role === "officer" ? t("nav.authority") : t("nav.admin")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Floating Role Switcher Modal */}
      <RoleSwitcherModal />

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal
        visible={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onStructuredResult={handleStructuredVoiceData}
      />

      {/* Low Literacy Guide Navigator Modal */}
      <GuideNavigatorModal
        visible={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        onNavigateAction={(screen) => {
          if (screen === "report") setActiveTab("report");
          else if (screen === "track") setActiveTab("track");
          else if (screen === "map") setActiveTab("map");
          else if (screen === "voice") setIsVoiceModalOpen(true);
          else if (screen === "safety") setActiveTab("ops");
        }}
      />

      {/* Submission Success Modal with Report ID & Tracking Code */}
      {submittedReport && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.successCard} testID="submission-success-modal">
              <View style={styles.successIconBadge}>
                <CheckCircle2 size={36} color="#10B981" />
              </View>
              <Text style={styles.successTitle}>{t("report.success_title")}</Text>
              <Text style={styles.successSubtitle}>{t("report.success_subtitle")}</Text>

              <View style={styles.codeContainer}>
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>{t("report.report_id_label")}:</Text>
                  <Text style={styles.codeValue}>{submittedReport.report_id}</Text>
                </View>
                <View style={styles.codeRow}>
                  <Text style={styles.codeLabel}>{t("report.tracking_code_label")}:</Text>
                  <Text style={styles.codeValueHighlight}>{submittedReport.tracking_code}</Text>
                </View>
              </View>
              <Text style={styles.saveCodeHint}>{t("report.save_code_hint")}</Text>

              {submittedReport.ai_cautious_advisory && (
                <View style={styles.aiAdvisoryBox}>
                  <Text style={styles.aiAdvisoryTitle}>🛡️ AI Cautionary Guidance:</Text>
                  <Text style={styles.aiAdvisoryText}>{submittedReport.ai_cautious_advisory}</Text>
                </View>
              )}

              <TouchableOpacity
                testID="success-track-now-btn"
                style={styles.successTrackBtn}
                onPress={() => {
                  const rep = submittedReport;
                  setSubmittedReport(null);
                  setTrackReportIdInput(rep.report_id);
                  setTrackCodeInput(rep.tracking_code);
                  setTrackedReport(rep);
                  setActiveTab("track");
                }}
              >
                <Text style={styles.successTrackBtnText}>{t("report.view_timeline_btn")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="success-close-btn"
                style={styles.successCloseBtn}
                onPress={() => {
                  setSubmittedReport(null);
                  setActiveTab("home");
                }}
              >
                <Text style={styles.successCloseBtnText}>Return to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Report Detail Modal (When tapped from Map/Feed) */}
      {selectedReportDetail && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={styles.detailCard} testID="report-detail-modal">
              <View style={styles.detailHeader}>
                <View>
                  <Text style={styles.detailReportId}>{selectedReportDetail.report_id}</Text>
                  <Text style={styles.detailCategory}>⚠️ {selectedReportDetail.category}</Text>
                </View>
                <TouchableOpacity
                  testID="close-report-detail-modal-btn"
                  style={styles.closeDetailBtn}
                  onPress={() => setSelectedReportDetail(null)}
                >
                  <X size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.detailLoc}>
                  📍 {selectedReportDetail.ward_locality}, {selectedReportDetail.district}, {selectedReportDetail.state}
                </Text>

                <View style={styles.detailDescBox}>
                  <Text style={styles.detailDescLabel}>Reported Description:</Text>
                  <Text style={styles.detailDescText}>
                    "{selectedReportDetail.original_description}"
                  </Text>
                  {selectedReportDetail.translated_description_en && (
                    <Text style={styles.detailDescEn}>
                      English: "{selectedReportDetail.translated_description_en}"
                    </Text>
                  )}
                </View>

                {/* Officer Action Form if role is Officer or Admin */}
                {(role === "officer" || role === "admin") && (
                  <View style={styles.officerActionBox}>
                    <Text style={styles.officerActionTitle}>👮 Officer Actions</Text>
                    <Text style={styles.inputLabel}>Update Status:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                      {["Under Review", "Officer Assigned", "Field Investigation", "Action in Progress", "Resolved"].map((st) => (
                        <TouchableOpacity
                          key={st}
                          testID={`officer-status-option-${st}`}
                          style={[
                            styles.selectorPill,
                            officerStatusSelect === st && styles.selectorPillActive
                          ]}
                          onPress={() => setOfficerStatusSelect(st)}
                        >
                          <Text
                            style={[
                              styles.selectorPillText,
                              officerStatusSelect === st && styles.selectorPillTextActive
                            ]}
                          >
                            {st}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.inputLabel}>Field Notes / Investigation Findings:</Text>
                    <TextInput
                      testID="officer-notes-input"
                      style={styles.textInput}
                      placeholder="e.g., Replaced feeder joint valve. Water clear."
                      value={officerNotesInput}
                      onChangeText={setOfficerNotesInput}
                    />

                    <TouchableOpacity
                      testID="officer-submit-update-btn"
                      style={styles.officerUpdateBtn}
                      onPress={handleOfficerStatusUpdate}
                      disabled={isUpdatingStatus}
                    >
                      {isUpdatingStatus ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.officerUpdateBtnText}>Save Status & Notes</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* Timeline */}
                <Text style={styles.timelineHeading}>Incident Progress Timeline</Text>
                <StatusTimeline
                  timeline={selectedReportDetail.timeline}
                  currentStatus={selectedReportDetail.status}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC"
  },
  mainContent: {
    flex: 1
  },
  tabScrollView: {
    flex: 1,
    padding: 16
  },
  disclaimerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#BAE6FD"
  },
  disclaimerText: {
    fontSize: 11,
    color: "#0369A1",
    flex: 1,
    lineHeight: 15,
    fontWeight: "500"
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4
  },
  heroTextCol: {
    width: "100%"
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 22,
    marginBottom: 6
  },
  heroSubtitle: {
    fontSize: 12,
    color: "#E0F2FE",
    lineHeight: 16,
    marginBottom: 12
  },
  heroStateBadges: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 8,
    borderRadius: 10
  },
  heroCoverageLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#7DD3FC",
    marginBottom: 2
  },
  heroStateNames: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600"
  },
  quickActionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    alignItems: "center"
  },
  actionIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6
  },
  actionCardTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center"
  },
  actionCardSub: {
    fontSize: 9,
    color: "#64748B",
    textAlign: "center",
    marginTop: 2
  },
  telemetryBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    justifyContent: "space-around",
    alignItems: "center"
  },
  telemetryStat: {
    alignItems: "center"
  },
  statNum: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  statLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "600"
  },
  telemetryDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#E2E8F0"
  },
  sectionContainer: {
    marginBottom: 20
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A"
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 10
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0284C7"
  },
  advisoryCard: {
    backgroundColor: "#FEF2F2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#FECACA"
  },
  advisoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6
  },
  advisoryTypePill: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  advisoryTypePillText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  advisoryStateBadge: {
    fontSize: 11,
    color: "#991B1B",
    fontWeight: "600"
  },
  advisoryTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#7F1D1D",
    marginBottom: 4
  },
  advisoryDescText: {
    fontSize: 12,
    color: "#991B1B",
    lineHeight: 16
  },
  incidentsFeed: {
    gap: 10,
    marginTop: 10
  },
  feedCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  feedCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  feedLocGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1
  },
  feedLocation: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1
  },
  feedStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  feedStatusText: {
    fontSize: 10,
    fontWeight: "700"
  },
  feedCategoryTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 4
  },
  feedDescription: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8
  },
  feedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 6
  },
  feedIdBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#64748B"
  },
  feedStateLabel: {
    fontSize: 10,
    color: "#94A3B8"
  },

  /* Report Form Styles */
  reportFormCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 40
  },
  formHeader: {
    marginBottom: 14
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  formSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  voiceAssistantCtaBanner: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 18
  },
  voiceCtaGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12
  },
  micCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center"
  },
  voiceCtaTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  voiceCtaSub: {
    fontSize: 10,
    color: "#E0F2FE"
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0369A1",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 6,
    marginTop: 8
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0F172A"
  },
  textAreaInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: "#0F172A",
    minHeight: 80,
    textAlignVertical: "top"
  },
  horizontalSelector: {
    flexDirection: "row",
    marginBottom: 8
  },
  selectorPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 6
  },
  selectorPillActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7"
  },
  selectorPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569"
  },
  selectorPillTextActive: {
    color: "#FFFFFF",
    fontWeight: "700"
  },
  inputRow: {
    flexDirection: "row",
    gap: 8
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 8
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center"
  },
  checkboxActive: {
    backgroundColor: "#0284C7",
    borderColor: "#0284C7"
  },
  checkboxLabel: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "600"
  },
  checkboxLabelBold: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A"
  },
  anonymousBox: {
    backgroundColor: "#F0FDF4",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    marginVertical: 10
  },
  anonymousHint: {
    fontSize: 11,
    color: "#166534",
    marginTop: 4,
    lineHeight: 15
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 18
  },
  submitGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14
  },
  submittingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF"
  },

  /* Track Tab Styles */
  trackCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 40
  },
  trackTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  trackSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2
  },
  trackInputsContainer: {
    marginTop: 14
  },
  trackButton: {
    backgroundColor: "#0284C7",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 14
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 10,
    marginTop: 10
  },
  errorBannerText: {
    fontSize: 12,
    color: "#B91C1C",
    flex: 1
  },
  sampleTracksSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9"
  },
  sampleTrackTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8
  },
  sampleTrackChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  sampleTrackChip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  sampleTrackChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0369A1"
  },
  trackedResultBox: {
    marginTop: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#CBD5E1"
  },
  trackedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10
  },
  trackedReportId: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A"
  },
  trackedCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    marginTop: 2
  },
  trackedStatusBadge: {
    backgroundColor: "#E0F2FE",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10
  },
  trackedStatusText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0369A1"
  },
  trackedMetaGrid: {
    gap: 4,
    marginBottom: 12
  },
  trackedMetaItem: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500"
  },
  aiAdvisoryBox: {
    backgroundColor: "#FEF3C7",
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#D97706"
  },
  aiAdvisoryTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400E"
  },
  aiAdvisoryText: {
    fontSize: 12,
    color: "#78350F",
    marginTop: 2,
    lineHeight: 16
  },
  timelineHeading: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginVertical: 10
  },

  /* Safety & Operations Styles */
  safetyContainer: {
    marginBottom: 40
  },
  safetyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  safetySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14
  },
  safetyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  safetyCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6
  },
  safetyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center"
  },
  safetyCardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A"
  },
  safetyCardDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17
  },
  helplineHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 10
  },
  helplinesList: {
    gap: 8
  },
  helplineItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  helplineState: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B"
  },
  helplineNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0284C7"
  },

  /* Officer Queue Styles */
  officerContainer: {
    marginBottom: 40
  },
  officerHeaderCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 16
  },
  officerAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  officerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center"
  },
  officerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#92400E"
  },
  officerDept: {
    fontSize: 12,
    color: "#B45309",
    fontWeight: "600"
  },
  officerJurisdiction: {
    fontSize: 11,
    color: "#78350F"
  },
  queueList: {
    gap: 10
  },
  officerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0"
  },
  officerCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  officerReportId: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  officerStatusBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  officerStatusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E"
  },
  officerCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    marginBottom: 4
  },
  officerDesc: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 16,
    marginBottom: 8
  },
  officerFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 8
  },
  officerLoc: {
    fontSize: 11,
    color: "#64748B"
  },
  officerActionHint: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D97706"
  },

  /* Admin Command Styles */
  adminContainer: {
    marginBottom: 40
  },
  adminTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A"
  },
  adminSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 14
  },
  reseedButton: {
    backgroundColor: "#0F172A",
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 18
  },
  reseedButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF"
  },
  clustersHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 10
  },
  clusterCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10
  },
  clusterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4
  },
  clusterName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    flex: 1,
    marginRight: 8
  },
  clusterCountBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8
  },
  clusterCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#B91C1C"
  },
  clusterLoc: {
    fontSize: 11,
    color: "#64748B",
    marginBottom: 6
  },
  clusterRecTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
    marginTop: 4
  },
  clusterRecText: {
    fontSize: 12,
    color: "#334155",
    lineHeight: 16
  },

  /* Bottom Navigation Bar */
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8
  },
  tabButton: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B"
  },
  tabLabelActive: {
    color: "#0284C7",
    fontWeight: "800"
  },

  /* Modals */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  successCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center"
  },
  successIconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center"
  },
  successSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16
  },
  codeContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
    marginBottom: 6
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  codeLabel: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600"
  },
  codeValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A"
  },
  codeValueHighlight: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0284C7"
  },
  saveCodeHint: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 14
  },
  successTrackBtn: {
    width: "100%",
    backgroundColor: "#0284C7",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8
  },
  successTrackBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF"
  },
  successCloseBtn: {
    paddingVertical: 8
  },
  successCloseBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B"
  },

  /* Detail Modal */
  detailCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    maxHeight: "85%"
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9"
  },
  detailReportId: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A"
  },
  detailCategory: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0284C7",
    marginTop: 2
  },
  closeDetailBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: "#F1F5F9"
  },
  detailLoc: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    marginBottom: 10
  },
  detailDescBox: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12
  },
  detailDescLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    marginBottom: 4
  },
  detailDescText: {
    fontSize: 13,
    color: "#0F172A",
    lineHeight: 18
  },
  detailDescEn: {
    fontSize: 12,
    color: "#475569",
    fontStyle: "italic",
    marginTop: 6
  },
  officerActionBox: {
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    marginBottom: 14
  },
  officerActionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
    marginBottom: 6
  },
  officerUpdateBtn: {
    backgroundColor: "#D97706",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 10
  },
  officerUpdateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700"
  }
});
