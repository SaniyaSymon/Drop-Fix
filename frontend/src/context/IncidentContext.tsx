import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { storage } from "@/src/utils/storage";

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const LIVE_POLL_INTERVAL_MS = 20000;
const OFFLINE_DRAFTS_KEY = "dropfix_offline_drafts";

export interface TimelineEntry {
  step_id: string;
  status: string;
  title: string;
  description: string;
  actor_name: string;
  actor_role: string;
  timestamp: string;
  evidence_photo_url?: string;
  action_taken?: string;
}

export interface ReportItem {
  report_id: string;
  tracking_code: string;
  is_anonymous: boolean;
  reporter_name?: string;
  reporter_contact?: string;
  report_language: string;
  original_description: string;
  original_voice_transcript?: string;
  translated_description_en?: string;
  translation_status?: string;
  category: string;
  priority: string;
  status: string;
  verification_label: string;
  state: string;
  district: string;
  city_town: string;
  ward_locality: string;
  landmark?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  approx_area_name: string;
  is_public_visible: boolean;
  multiple_households_affected: boolean;
  affected_households_count_approx?: string;
  water_source_type?: string;
  time_noticed?: string;
  photo_urls: string[];
  video_urls: string[];
  ai_preliminary_assessment?: string;
  ai_cautious_advisory?: string;
  ai_suggested_priority?: string;
  assigned_department?: string;
  assigned_officer_id?: string;
  assigned_officer_name?: string;
  officer_notes?: string;
  resolution_summary?: string;
  resolution_photo_url?: string;
  created_at: string;
  updated_at: string;
  timeline: TimelineEntry[];
  is_demo_seed?: boolean;
}

export interface AdvisoryItem {
  advisory_id: string;
  title: string;
  title_translations?: Record<string, string>;
  description: string;
  description_translations?: Record<string, string>;
  advisory_type: string;
  severity: string;
  state: string;
  district: string;
  affected_areas: string[];
  action_instructions: string[];
  issued_by: string;
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

export interface IncidentClusterItem {
  cluster_id: string;
  cluster_name: string;
  state: string;
  district: string;
  locality: string;
  incident_count: number;
  common_category: string;
  severity_level: string;
  first_reported_at: string;
  last_reported_at: string;
  center_lat: number;
  center_lng: number;
  status: string;
  recommended_municipal_action: string;
}

export interface AnalyticsData {
  total_reports: number;
  resolved_reports: number;
  in_progress: number;
  critical_reports: number;
  active_advisories: number;
  resolution_rate_percent: number;
  state_breakdown: Record<string, number>;
  category_breakdown: { category: string; count: number }[];
  average_triage_time_hours: number;
}

interface IncidentContextType {
  reports: ReportItem[];
  advisories: AdvisoryItem[];
  clusters: IncidentClusterItem[];
  analytics: AnalyticsData | null;
  selectedState: string;
  setSelectedState: (state: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedPriority: string;
  setSelectedPriority: (p: string) => void;
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  pendingDraftsCount: number;
  lastLiveUpdate: number | null;
  refreshData: () => Promise<void>;
  createReport: (payload: any) => Promise<ReportItem>;
  trackReport: (report_id: string, tracking_code: string) => Promise<ReportItem>;
  updateReportStatus: (report_id: string, updateData: any) => Promise<ReportItem>;
  togglePublicVisibility: (report_id: string, is_public: boolean, actor_name: string) => Promise<boolean>;
  structureVoice: (transcript: string, language_code: string, state?: string) => Promise<any>;
  reseedDatabase: () => Promise<void>;
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [advisories, setAdvisories] = useState<AdvisoryItem[]>([]);
  const [clusters, setClusters] = useState<IncidentClusterItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  const [selectedState, setSelectedState] = useState<string>("All States");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [selectedPriority, setSelectedPriority] = useState<string>("All Priorities");
  const [selectedStatus, setSelectedStatus] = useState<string>("All Statuses");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingDraftsCount, setPendingDraftsCount] = useState<number>(0);
  const [lastLiveUpdate, setLastLiveUpdate] = useState<number | null>(null);
  const isFlushingRef = useRef<boolean>(false);

  const fetchReports = useCallback(async () => {
    try {
      let url = `${EXPO_PUBLIC_BACKEND_URL}/api/reports?limit=100`;
      if (selectedState && selectedState !== "All States") {
        url += `&state=${encodeURIComponent(selectedState)}`;
      }
      if (selectedCategory && selectedCategory !== "All Categories") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedPriority && selectedPriority !== "All Priorities") {
        url += `&priority=${encodeURIComponent(selectedPriority)}`;
      }
      if (selectedStatus && selectedStatus !== "All Statuses") {
        url += `&status=${encodeURIComponent(selectedStatus)}`;
      }
      if (searchQuery.trim()) {
        url += `&search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data);
    } catch (err: any) {
      console.warn("fetchReports error:", err);
      setError(err.message);
    }
  }, [selectedState, selectedCategory, selectedPriority, selectedStatus, searchQuery]);

  const fetchAdvisories = useCallback(async () => {
    try {
      let url = `${EXPO_PUBLIC_BACKEND_URL}/api/advisories`;
      if (selectedState && selectedState !== "All States") {
        url += `?state=${encodeURIComponent(selectedState)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAdvisories(data);
      }
    } catch (err) {
      console.warn("fetchAdvisories error:", err);
    }
  }, [selectedState]);

  const fetchClusters = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/clusters`);
      if (res.ok) {
        const data = await res.json();
        setClusters(data);
      }
    } catch (err) {
      console.warn("fetchClusters error:", err);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.warn("fetchAnalytics error:", err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    await Promise.all([fetchReports(), fetchAdvisories(), fetchClusters(), fetchAnalytics()]);
    setIsLoading(false);
    setLastLiveUpdate(Date.now());
  }, [fetchReports, fetchAdvisories, fetchClusters, fetchAnalytics]);

  // Silent background refresh (no loading spinner) — used by live polling.
  const silentRefresh = useCallback(async () => {
    await Promise.all([fetchReports(), fetchAdvisories(), fetchClusters(), fetchAnalytics()]);
    setLastLiveUpdate(Date.now());
  }, [fetchReports, fetchAdvisories, fetchClusters, fetchAnalytics]);

  useEffect(() => {
    refreshData();
  }, [refreshData, selectedState, selectedCategory, selectedPriority, selectedStatus, searchQuery]);

  // ---- LIVE MAP/DASHBOARD REFRESH: poll while app is foregrounded ----
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = setInterval(() => {
        silentRefresh();
      }, LIVE_POLL_INTERVAL_MS);
    };
    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    startPolling();

    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active") {
        silentRefresh();
        startPolling();
      } else {
        stopPolling();
      }
    });

    return () => {
      stopPolling();
      sub.remove();
    };
  }, [silentRefresh]);

  // ---- OFFLINE DRAFTS: monitor connectivity & auto-submit queued reports ----
  const getDrafts = useCallback(async (): Promise<any[]> => {
    const drafts = await storage.getItem<any[]>(OFFLINE_DRAFTS_KEY, []);
    return Array.isArray(drafts) ? drafts : [];
  }, []);

  const persistDrafts = useCallback(async (drafts: any[]) => {
    await storage.setItem(OFFLINE_DRAFTS_KEY, drafts);
    setPendingDraftsCount(drafts.length);
  }, []);

  const postReport = async (payload: any): Promise<ReportItem> => {
    const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "Failed to submit report");
    }
    const data = await res.json();
    return data.report;
  };

  const flushDrafts = useCallback(async () => {
    if (isFlushingRef.current) return;
    isFlushingRef.current = true;
    try {
      let drafts = await getDrafts();
      if (drafts.length === 0) return;
      const remaining: any[] = [];
      for (const draft of drafts) {
        try {
          await postReport(draft.payload);
        } catch {
          remaining.push(draft); // keep for next retry
        }
      }
      await persistDrafts(remaining);
      if (remaining.length < drafts.length) {
        await refreshData();
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [getDrafts, persistDrafts, refreshData]);

  useEffect(() => {
    (async () => {
      const drafts = await getDrafts();
      setPendingDraftsCount(drafts.length);
    })();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false;
      setIsOnline(online);
      if (online) {
        flushDrafts();
      }
    });
    return () => unsubscribe();
  }, [getDrafts, flushDrafts]);

  const createReport = async (payload: any): Promise<ReportItem> => {
    try {
      const report = await postReport(payload);
      await refreshData();
      // Opportunistically flush any older queued drafts too.
      flushDrafts();
      return report;
    } catch (err: any) {
      // Distinguish a genuine network failure from a server-side rejection.
      const netState = await NetInfo.fetch().catch(() => null);
      const offline = netState ? netState.isConnected === false : false;
      const looksLikeNetworkError =
        offline ||
        err?.name === "TypeError" ||
        /network request failed|failed to fetch|load failed/i.test(err?.message || "");

      if (looksLikeNetworkError) {
        const drafts = await getDrafts();
        drafts.push({ id: `draft-${Date.now()}`, payload, savedAt: new Date().toISOString() });
        await persistDrafts(drafts);
        setIsOnline(false);
        const offlineErr: any = new Error("OFFLINE_QUEUED");
        offlineErr.code = "OFFLINE_QUEUED";
        throw offlineErr;
      }
      throw err;
    }
  };

  const trackReport = async (report_id: string, tracking_code: string): Promise<ReportItem> => {
    const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reports/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_id, tracking_code })
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "No matching incident found with given ID and Tracking Code");
    }
    const data = await res.json();
    return data.report;
  };

  const updateReportStatus = async (report_id: string, updateData: any): Promise<ReportItem> => {
    const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reports/${report_id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || "Failed to update status");
    }
    const data = await res.json();
    await refreshData();
    return data.report;
  };

  const togglePublicVisibility = async (
    report_id: string,
    is_public: boolean,
    actor_name: string
  ): Promise<boolean> => {
    const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/reports/${report_id}/moderate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public_visible: is_public, actor_name })
    });
    if (res.ok) {
      await refreshData();
      return true;
    }
    return false;
  };

  const structureVoice = async (transcript: string, language_code: string, state?: string) => {
    const res = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/voice/structure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transcript,
        language_code,
        selected_state: state || "Tamil Nadu"
      })
    });
    if (!res.ok) throw new Error("Voice structuring failed");
    const data = await res.json();
    return data.data;
  };

  const reseedDatabase = async () => {
    await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/seed`, { method: "POST" });
    await refreshData();
  };

  return (
    <IncidentContext.Provider
      value={{
        reports,
        advisories,
        clusters,
        analytics,
        selectedState,
        setSelectedState,
        selectedCategory,
        setSelectedCategory,
        selectedPriority,
        setSelectedPriority,
        selectedStatus,
        setSelectedStatus,
        searchQuery,
        setSearchQuery,
        isLoading,
        error,
        isOnline,
        pendingDraftsCount,
        lastLiveUpdate,
        refreshData,
        createReport,
        trackReport,
        updateReportStatus,
        togglePublicVisibility,
        structureVoice,
        reseedDatabase
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export const useIncidents = () => {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error("useIncidents must be used within an IncidentProvider");
  }
  return context;
};
