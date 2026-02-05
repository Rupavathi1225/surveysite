import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ChatSettings {
  freeMessages: number;
  creditCost: number;
  maxCommentsPerDay: number;
}

export function useChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>({
    freeMessages: 5,
    creditCost: 1,
    maxCommentsPerDay: 10,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["free_chat_messages", "chat_credit_cost", "max_comments_per_day"]);

    if (!error && data) {
      const settingsMap: Record<string, string> = {};
      data.forEach((s) => {
        settingsMap[s.key] = s.value || "";
      });

      setSettings({
        freeMessages: parseInt(settingsMap.free_chat_messages) || 5,
        creditCost: parseInt(settingsMap.chat_credit_cost) || 1,
        maxCommentsPerDay: parseInt(settingsMap.max_comments_per_day) || 10,
      });
    }
    setIsLoading(false);
  };

  return { settings, isLoading, refetch: fetchSettings };
}
