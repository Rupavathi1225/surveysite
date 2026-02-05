import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, Search, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_at: string;
  other_user?: Profile;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export default function DirectMessages() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchConversations();
    }
  }, [profile?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);

      // Subscribe to new messages
      const channel = supabase
        .channel(`dm_${selectedConversation.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "direct_messages",
            filter: `conversation_id=eq.${selectedConversation.id}`,
          },
          (payload) => {
            const newMsg = payload.new as Message;
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
            if (newMsg.sender_id !== profile?.id) {
              markMessagesAsRead(selectedConversation.id);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = async () => {
    if (!profile?.id) return;
    setIsLoading(true);

    const { data: convs, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_one.eq.${profile.id},participant_two.eq.${profile.id}`)
      .order("last_message_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      setIsLoading(false);
      return;
    }

    // Fetch other user details for each conversation
    const enrichedConvs = await Promise.all(
      (convs || []).map(async (conv) => {
        const otherUserId = conv.participant_one === profile.id ? conv.participant_two : conv.participant_one;
        
        const { data: userData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, first_name, last_name")
          .eq("id", otherUserId)
          .single();

        // Get last message
        const { data: lastMsg } = await supabase
          .from("direct_messages")
          .select("content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get unread count
        const { count } = await supabase
          .from("direct_messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("is_read", false)
          .neq("sender_id", profile.id);

        return {
          ...conv,
          other_user: userData || undefined,
          last_message: lastMsg?.content,
          unread_count: count || 0,
        };
      })
    );

    setConversations(enrichedConvs);
    setIsLoading(false);
  };

  const fetchMessages = async (conversationId: string) => {
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const markMessagesAsRead = async (conversationId: string) => {
    if (!profile?.id) return;

    await supabase
      .from("direct_messages")
      .update({ is_read: true })
      .eq("conversation_id", conversationId)
      .neq("sender_id", profile.id)
      .eq("is_read", false);
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || !profile?.id) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, first_name, last_name")
      .neq("id", profile.id)
      .ilike("username", `%${query}%`)
      .limit(10);

    if (!error && data) {
      setSearchResults(data);
    }
    setIsSearching(false);
  };

  const startConversation = async (otherUser: Profile) => {
    if (!profile?.id) return;

    // Check if conversation already exists
    const existingConv = conversations.find(
      (c) =>
        (c.participant_one === profile.id && c.participant_two === otherUser.id) ||
        (c.participant_one === otherUser.id && c.participant_two === profile.id)
    );

    if (existingConv) {
      setSelectedConversation({ ...existingConv, other_user: otherUser });
      setSearchQuery("");
      setSearchResults([]);
      return;
    }

    // Create new conversation
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        participant_one: profile.id,
        participant_two: otherUser.id,
      })
      .select()
      .single();

    if (!error && data) {
      const newConv = { ...data, other_user: otherUser };
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !profile?.id) return;

    setIsSending(true);
    const { error } = await supabase.from("direct_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: profile.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", selectedConversation.id);
    }
    setIsSending(false);
  };

  const getInitials = (user?: Profile) => {
    if (!user) return "?";
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return user.username?.slice(0, 2).toUpperCase() || "?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-12rem)] bg-card rounded-lg border overflow-hidden">
      {/* Conversations List */}
      <div
        className={cn(
          "w-full md:w-80 border-r flex flex-col",
          selectedConversation && "hidden md:flex"
        )}
      >
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg flex items-center gap-2 mb-3">
            <MessageCircle className="h-5 w-5" />
            Messages
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users to message..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Search Results */}
          {searchQuery && (
            <div className="p-2 border-b">
              <p className="text-xs text-muted-foreground px-2 mb-1">Search Results</p>
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2">No users found</p>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                    onClick={() => startConversation(user)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{getInitials(user)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{user.username}</p>
                      {user.first_name && (
                        <p className="text-xs text-muted-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Conversations */}
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Search for users to start chatting</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "flex items-center gap-3 p-3 cursor-pointer hover:bg-muted border-b",
                  selectedConversation?.id === conv.id && "bg-muted"
                )}
                onClick={() => setSelectedConversation(conv)}
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={conv.other_user?.avatar_url || undefined} />
                  <AvatarFallback>{getInitials(conv.other_user)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{conv.other_user?.username || "Unknown"}</p>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(conv.last_message_at), "MMM d")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{conv.last_message || "No messages yet"}</p>
                </div>
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          "flex-1 flex flex-col",
          !selectedConversation && "hidden md:flex"
        )}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedConversation(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedConversation.other_user?.avatar_url || undefined} />
                <AvatarFallback>{getInitials(selectedConversation.other_user)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedConversation.other_user?.username}</p>
                {selectedConversation.other_user?.first_name && (
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.other_user.first_name} {selectedConversation.other_user.last_name}
                  </p>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender_id === profile?.id ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg px-4 py-2",
                        msg.sender_id === profile?.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          msg.sender_id === profile?.id
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                />
                <Button onClick={sendMessage} disabled={isSending || !newMessage.trim()}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm">or search for a user to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
