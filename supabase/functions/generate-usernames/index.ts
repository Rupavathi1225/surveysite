import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerationConfig {
  method: "manual" | "bulk_csv" | "ai_based";
  baseUsername?: string;
  baseUsernames?: string[];
  count: number;
  country: string;
  timeGapMinutes: number;
  // AI config
  usernameStyle?: string;
  letterCount?: number;
  numberCount?: number;
  shuffleAfter?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL is not configured");
    if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const config: GenerationConfig = await req.json();
    
    let usernames: string[] = [];
    
    if (config.method === "manual") {
      // Simple manual: baseUsername + random suffix
      usernames = generateManualUsernames(config.baseUsername || "user", config.count);
    } else if (config.method === "bulk_csv") {
      // Bulk: distribute count among base usernames
      usernames = generateBulkUsernames(config.baseUsernames || [], config.count);
    } else if (config.method === "ai_based") {
      // AI-based generation
      usernames = await generateAIUsernames(LOVABLE_API_KEY, config);
    }

    // Create users in Supabase Auth and profiles
    const createdUsers = [];
    const startTime = new Date();
    
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const email = `${username.toLowerCase()}@generated.local`;
      const password = generateSecurePassword();
      
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username, generated: true, country: config.country }
      });

      if (authError) {
        console.error(`Failed to create user ${username}:`, authError);
        continue;
      }

      // Get the profile that was auto-created by trigger
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", authData.user.id)
        .single();

      // Calculate scheduled display time
      const scheduledAt = new Date(startTime.getTime() + (i * config.timeGapMinutes * 60 * 1000));
      
      // Create scheduled activity for this signup
      await supabase.from("scheduled_activities").insert({
        activity_type: "signup",
        message: `🎉 New user ${username} just signed up`,
        icon_type: "user-plus",
        icon_color: "text-green-500",
        scheduled_at: scheduledAt.toISOString(),
        is_displayed: false,
        related_user_id: profile?.id,
        metadata: { country: config.country, username, generated: true }
      });

      createdUsers.push({
        username,
        email,
        password, // Include password so admin can share credentials
        userId: authData.user.id,
        profileId: profile?.id,
        scheduledAt: scheduledAt.toISOString(),
        method: config.method,
        country: config.country
      });
    }

    // Save batch info
    await supabase.from("generated_user_batches").insert({
      batch_name: `Batch ${new Date().toISOString()}`,
      generation_method: config.method,
      total_users: createdUsers.length,
      time_gap_minutes: config.timeGapMinutes,
      country: config.country,
      base_usernames: config.method === "bulk_csv" ? config.baseUsernames : [config.baseUsername || "user"],
      ai_config: config.method === "ai_based" ? {
        style: config.usernameStyle,
        letterCount: config.letterCount,
        numberCount: config.numberCount,
        shuffleAfter: config.shuffleAfter
      } : null,
      status: "completed"
    });

    return new Response(JSON.stringify({ 
      success: true, 
      created: createdUsers.length,
      users: createdUsers 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Generation error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateManualUsernames(base: string, count: number): string[] {
  const usernames: string[] = [];
  for (let i = 0; i < count; i++) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    usernames.push(`${base}_${suffix}`);
  }
  return usernames;
}

function generateBulkUsernames(baseNames: string[], totalCount: number): string[] {
  const usernames: string[] = [];
  const perName = Math.ceil(totalCount / baseNames.length);
  
  for (const base of baseNames) {
    const count = Math.min(perName, totalCount - usernames.length);
    for (let i = 0; i < count; i++) {
      const suffix = Math.floor(100 + Math.random() * 900);
      usernames.push(`${base}_${suffix}`);
    }
    if (usernames.length >= totalCount) break;
  }
  return usernames.slice(0, totalCount);
}

async function generateAIUsernames(apiKey: string, config: GenerationConfig): Promise<string[]> {
  const prompt = `Generate exactly ${config.count} unique usernames for a ${config.country} user base.

Rules:
- Style: ${config.usernameStyle || "modern"}
- Each username should have approximately ${config.letterCount || 4} letters and ${config.numberCount || 5} numbers
- Mix letters and numbers in an interesting pattern
- Shuffle pattern: change arrangement every ${config.shuffleAfter || 2} characters
- Make them look natural, not obviously generated
- No offensive or inappropriate content

Return ONLY a JSON array of strings, nothing else. Example: ["ra29ju814", "sa84mi302"]`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: "You are a username generator. Only output valid JSON arrays." },
        { role: "user", content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI generation failed: ${response.status} - ${text}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";
  
  // Extract JSON array from response
  const jsonMatch = content.match(/\[[\s\S]*?\]/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback to manual generation
      return generateManualUsernames("ai_user", config.count);
    }
  }
  
  return generateManualUsernames("ai_user", config.count);
}

function generateSecurePassword(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
