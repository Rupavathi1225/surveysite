import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

// Helper to parse user agent
const parseUserAgent = (ua: string) => {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "desktop";

  // Detect browser
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  // Detect OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Detect device type
  if (ua.includes("Mobile") || ua.includes("Android")) deviceType = "mobile";
  else if (ua.includes("Tablet") || ua.includes("iPad")) deviceType = "tablet";

  return { browser, os, deviceType };
};

// Generate device fingerprint
const generateFingerprint = () => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("fingerprint", 2, 2);
  }
  const canvasData = canvas.toDataURL();
  
  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
    canvasData.substring(0, 50)
  ].join("|");
  
  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 16);
};

// Fetch IP and geo data
const fetchIpGeoData = async () => {
  try {
    // Try ipapi.co first (free, no key required)
    const response = await fetch("https://ipapi.co/json/", { 
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.ip || null,
        country: data.country_name || null,
        region: data.region || null,
        city: data.city || null,
        isp: data.org || null,
      };
    }
  } catch (error) {
    console.warn("Primary IP API failed, trying fallback...");
  }

  try {
    // Fallback to ip-api.com
    const response = await fetch("http://ip-api.com/json/?fields=query,country,regionName,city,isp", {
      signal: AbortSignal.timeout(5000)
    });
    if (response.ok) {
      const data = await response.json();
      return {
        ip: data.query || null,
        country: data.country || null,
        region: data.regionName || null,
        city: data.city || null,
        isp: data.isp || null,
      };
    }
  } catch (error) {
    console.warn("IP geolocation failed:", error);
  }

  return { ip: null, country: null, region: null, city: null, isp: null };
};

interface Profile {
  id: string;
  user_id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  cash_balance: number;
  points_balance: number;
  locked_points: number;
  lifetime_payouts: number;
  referral_code: string | null;
  referral_count: number;
  referral_earnings: number;
  is_verified: boolean;
  status: string;
  country: string | null;
  city: string | null;
  address: string | null;
  mobile: string | null;
  payment_method: string | null;
  payment_info: Record<string, unknown> | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isSubAdmin: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubAdmin, setIsSubAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (!error && data) {
      setIsAdmin(data.some((r) => r.role === "admin"));
      setIsSubAdmin(data.some((r) => r.role === "subadmin"));
    } else {
      setIsAdmin(false);
      setIsSubAdmin(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            await fetchProfile(session.user.id);
            await checkAdminRole(session.user.id);
            setIsLoading(false);
          }, 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
        checkAdminRole(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { username },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Log the login attempt
    if (data.user) {
      // Collect all login metadata
      const userAgent = navigator.userAgent;
      const { browser, os, deviceType } = parseUserAgent(userAgent);
      const fingerprint = generateFingerprint();
      
      // Fetch IP and geo data asynchronously (don't block login)
      fetchIpGeoData().then(async (geoData) => {
        await supabase.from("login_logs").insert({
          user_id: data.user.id,
          email: data.user.email || email,
          status: "success",
          ip_address: geoData.ip,
          location_country: geoData.country,
          location_region: geoData.region,
          location_city: geoData.city,
          isp: geoData.isp,
          browser,
          os,
          device_type: deviceType,
          user_agent: userAgent,
          device_fingerprint: fingerprint,
          login_method: "PASSWORD",
        });
      }).catch(console.error);
    }

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
    setIsSubAdmin(false);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isSubAdmin,
        isLoading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
