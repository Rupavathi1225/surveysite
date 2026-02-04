import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSettings } from "@/hooks/useChatSettings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, Send, Loader2, AlertTriangle, Coins, Shield } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  admin_id: string | null;
  is_read: boolean;
  credits_used: number;
  created_at: string;
}

export default function AdminChat() {
  const { profile, refreshProfile } = useAuth();
  const { settings, isLoading: settingsLoading } = useChatSettings();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchMessages();
      
      // Subscribe to new messages
      const channel = supabase
        .channel("admin_chat_updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "admin_chats",
            filter: `user_id=eq.${profile.id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
            scrollToBottom();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [profile?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("admin_chats")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Count user messages (not admin replies)
      setMessageCount(data.filter((m) => !m.is_admin_reply).length);
    }
    setIsLoading(false);
  };

  const getRemainingFreeMessages = () => {
    return Math.max(0, settings.freeMessages - messageCount);
  };

  const willCostCredits = () => {
    return messageCount >= settings.freeMessages;
  };

  const canSendMessage = () => {
    if (!willCostCredits()) return true;
    return (profile?.points_balance ?? 0) >= settings.creditCost;
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile?.id || isSending) return;

    if (!canSendMessage()) {
      toast.error("Insufficient credits to send message");
      return;
    }

    setIsSending(true);
    const creditsToUse = willCostCredits() ? settings.creditCost : 0;

    try {
      // Deduct credits if needed
      if (creditsToUse > 0) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ 
            points_balance: (profile.points_balance ?? 0) - creditsToUse 
          })
          .eq("id", profile.id);

        if (updateError) throw updateError;

        // Log credit deduction
        await supabase.from("earning_history").insert({
          user_id: profile.id,
          amount: -creditsToUse,
          type: "chat_message",
          description: "Credit used for admin chat message",
          status: "approved",
        });

        // Create notification for credit usage
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "Credit Deducted",
          message: `${creditsToUse} credit(s) used for sending a message to admin`,
          type: "info",
        });
      }

      // Send message
      const { error: chatError } = await supabase.from("admin_chats").insert({
        user_id: profile.id,
        message: newMessage.trim(),
        is_admin_reply: false,
        credits_used: creditsToUse,
      });

      if (chatError) throw chatError;

      setNewMessage("");
      setMessageCount((prev) => prev + 1);
      
      if (creditsToUse > 0) {
        await refreshProfile();
        toast.success(`Message sent (${creditsToUse} credit used)`);
      } else {
        toast.success("Message sent");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (settingsLoading || isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Chat with Admin
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {profile?.points_balance ?? 0} credits
            </Badge>
            {getRemainingFreeMessages() > 0 && (
              <Badge variant="outline" className="text-green-600">
                {getRemainingFreeMessages()} free messages left
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pr-4 mb-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
              <Shield className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-center">No messages yet</p>
              <p className="text-sm text-center">Start a conversation with admin</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.is_admin_reply ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-lg px-4 py-2",
                      msg.is_admin_reply
                        ? "bg-muted"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    {msg.is_admin_reply && (
                      <div className="flex items-center gap-1 text-xs font-medium mb-1">
                        <Shield className="h-3 w-3" />
                        Admin
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <div className={cn(
                      "flex items-center gap-2 text-xs mt-1",
                      msg.is_admin_reply ? "text-muted-foreground" : "text-primary-foreground/70"
                    )}>
                      <span>{format(new Date(msg.created_at), "MMM d, h:mm a")}</span>
                      {msg.credits_used > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Coins className="h-3 w-3" />
                          {msg.credits_used}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Credit Warning */}
        {willCostCredits() && (
          <Alert className="mb-3" variant={canSendMessage() ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {canSendMessage() ? (
                <span>This message will cost <strong>{settings.creditCost} credit(s)</strong></span>
              ) : (
                <span><strong>Insufficient credits!</strong> You need {settings.creditCost} credits to send a message</span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Message Input */}
        <div className="flex gap-2">
          <Textarea
            placeholder="Type your message to admin..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            className="resize-none min-h-[80px]"
            maxLength={1000}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isSending || !newMessage.trim() || !canSendMessage()}
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
