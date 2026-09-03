import React, { createContext, useContext, useState, useEffect } from "react";
import { storage } from "@/src/utils/storage";

export type UserRole = "citizen" | "officer" | "admin";

export interface UserProfile {
  role: UserRole;
  name: string;
  email: string;
  department: string;
  jurisdiction: string;
  avatar: string;
  badge: string;
}

export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  citizen: {
    role: "citizen",
    name: "Citizen (Anonymous / Ananya)",
    email: "citizen@dropfix.in",
    department: "Public Citizen User",
    jurisdiction: "South India (TN, KL, KA, AP, TG, PY)",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    badge: "Verified Citizen"
  },
  officer: {
    role: "officer",
    name: "Er. S. Ramanathan",
    email: "officer.tamilnadu@dropfix.in",
    department: "Chennai Metro Water (CMWSSB)",
    jurisdiction: "Zone 10 - Central Chennai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    badge: "Area Engineer (AE)"
  },
  admin: {
    role: "admin",
    name: "Dr. A. V. Narayanan",
    email: "admin.south@dropfix.in",
    department: "South India Joint Water Safety Taskforce",
    jurisdiction: "Tamil Nadu, Kerala, Karnataka, AP, Telangana, Puducherry",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    badge: "Super Admin"
  }
};

interface AuthContextType {
  role: UserRole;
  user: UserProfile;
  switchRole: (role: UserRole) => Promise<void>;
  isRoleModalVisible: boolean;
  setRoleModalVisible: (visible: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>("citizen");
  const [isRoleModalVisible, setRoleModalVisible] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<string>("dropfix_active_role", "citizen");
      if (saved && ["citizen", "officer", "admin"].includes(saved)) {
        setRoleState(saved as UserRole);
      }
    })();
  }, []);

  const switchRole = async (newRole: UserRole) => {
    setRoleState(newRole);
    await storage.setItem("dropfix_active_role", newRole);
    setRoleModalVisible(false);
  };

  const user = DEMO_PROFILES[role];

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        switchRole,
        isRoleModalVisible,
        setRoleModalVisible
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
