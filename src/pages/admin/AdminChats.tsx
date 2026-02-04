import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MessageSquare, Send, Loader2, User, Shield, ArrowLeft, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatUser {
  user_id: string;
  username: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

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

interface Comment {
  id: string;
  notification_id: string;
  user_id: string;
  comment: string;
  is_admin: boolean;
  created_at: string;
  username?: string;
  notification_title?: string;
}

export default function AdminChats() {
  const { profile } = useAuth();
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newReply, setNewReply] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchChatUsers();
    fetchAllComments();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserMessages(selectedUser.user_id);

      const channel = supabase
        .channel(`admin_chat_${selectedUser.user_id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "admin_chats",
            filter: `user_id=eq.${selectedUser.user_id}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedUser?.user_id]);

  const fetchChatUsers = async () => {
    setIsLoading(true);

    // Get unique users with chats
    const { data: chats, error } = await supabase
      .from("admin_chats")
      .select("user_id, message, created_at, is_read, is_admin_reply")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching chats:", error);
      setIsLoading(false);
      return;
    }

    // Group by user
    const userMap: Record<string, { messages: typeof chats; lastMessage: string; lastAt: string; unread: number }> = {};
    chats?.forEach((chat) => {
      if (!userMap[chat.user_id]) {
        userMap[chat.user_id] = {
          messages: [],
          lastMessage: chat.message,
          lastAt: chat.created_at,
          unread: 0,
        };
      }
      userMap[chat.user_id].messages.push(chat);
      if (!chat.is_read && !chat.is_admin_reply) {
        userMap[chat.user_id].unread++;
      }
    });

    // Fetch usernames
    const userIds = Object.keys(userMap);
    if (userIds.length === 0) {
      setChatUsers([]);
      setIsLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", userIds);

    const usernameMap: Record<string, string> = {};
    profiles?.forEach((p) => {
      usernameMap[p.id] = p.username;
    });

    const users: ChatUser[] = userIds.map((userId) => ({
      user_id: userId,
      username: usernameMap[userId] || "Unknown",
      last_message: userMap[userId].lastMessage,
      last_message_at: userMap[userId].lastAt,
      unread_count: userMap[userId].unread,
    }));

    // Sort by last message date
    users.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setChatUsers(users);
    setIsLoading(false);
  };

  const fetchUserMessages = async (userId: string) => {
    const { data, error } = await supabase
      .from("admin_chats")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
      // Mark as read
      await supabase
        .from("admin_chats")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_admin_reply", false);
    }
  };

  const fetchAllComments = async () => {
    const { data: commentsData, error } = await supabase
      .from("notification_comments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !commentsData) return;

    // Fetch usernames and notification titles
    const userIds = [...new Set(commentsData.map((c) => c.user_id))];
    const notifIds = [...new Set(commentsData.map((c) => c.notification_id))];

    const [{ data: profiles }, { data: notifications }] = await Promise.all([
      supabase.from("profiles").select("id, username").in("id", userIds),
      supabase.from("notifications").select("id, title").in("id", notifIds),
    ]);

    const usernameMap: Record<string, string> = {};
    profiles?.forEach((p) => {
      usernameMap[p.id] = p.username;
    });

    const notifMap: Record<string, string> = {};
    notifications?.forEach((n) => {
      notifMap[n.id] = n.title;
    });

    const enriched = commentsData.map((c) => ({
      ...c,
      username: usernameMap[c.user_id] || "Unknown",
      notification_title: notifMap[c.notification_id] || "Unknown Notification",
    }));

    setComments(enriched);
  };

  const sendReply = async () => {
    if (!newReply.trim() || !selectedUser || !profile?.id) return;

    setIsSending(true);
    const { error } = await supabase.from("admin_chats").insert({
      user_id: selectedUser.user_id,
      message: newReply.trim(),
      is_admin_reply: true,
      admin_id: profile.id,
    });

    if (!error) {
      setNewReply("");
      toast.success("Reply sent");
      // Create notification for user
      await supabase.from("notifications").insert({
        user_id: selectedUser.user_id,
        title: "New Admin Reply",
        message: "You have a new reply from admin in your chat",
        type: "info",
      });
    } else {
      toast.error("Failed to send reply");
    }
    setIsSending(false);
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase
      .from("notification_comments")
      .delete()
      .eq("id", commentId);

    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } else {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Chats & Comments</h1>
        <p className="text-muted-foreground">
          View and reply to user messages and moderate comments
        </p>
      </div>

      <Tabs defaultValue="chats">
        <TabsList>
          <TabsTrigger value="chats" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            User Chats
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chats" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Users List */}
            <Card className={cn("lg:col-span-1", selectedUser && "hidden lg:block")}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : chatUsers.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      No chats yet
                    </div>
                  ) : (
                    chatUsers.map((user) => (
                      <div
                        key={user.user_id}
                        className={cn(
                          "flex items-center gap-3 p-4 cursor-pointer hover:bg-muted border-b",
                          selectedUser?.user_id === user.user_id && "bg-muted"
                        )}
                        onClick={() => setSelectedUser(user)}
                      >
                        <Avatar>
                          <AvatarFallback>
                            {user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{user.username}</p>
                            {user.unread_count > 0 && (
                              <Badge variant="destructive" className="ml-2">
                                {user.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.last_message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(user.last_message_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className={cn("lg:col-span-2", !selectedUser && "hidden lg:flex lg:items-center lg:justify-center")}>
              {selectedUser ? (
                <>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSelectedUser(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar>
                        <AvatarFallback>
                          {selectedUser.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg">{selectedUser.username}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col h-[500px] p-0">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.is_admin_reply ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] rounded-lg px-4 py-2",
                                msg.is_admin_reply
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              {msg.is_admin_reply && (
                                <div className="flex items-center gap-1 text-xs font-medium mb-1 text-primary-foreground/80">
                                  <Shield className="h-3 w-3" />
                                  Admin
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  msg.is_admin_reply
                                    ? "text-primary-foreground/70"
                                    : "text-muted-foreground"
                                )}
                              >
                                {format(new Date(msg.created_at), "MMM d, h:mm a")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t flex gap-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        className="resize-none min-h-[60px]"
                      />
                      <Button
                        onClick={sendReply}
                        disabled={isSending || !newReply.trim()}
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
                </>
              ) : (
                <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                  <MessageSquare className="h-16 w-16 mb-4 opacity-50" />
                  <p>Select a conversation</p>
                </CardContent>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Notification</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No comments yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {comment.username}
                            {comment.is_admin && (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {comment.notification_title}
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          <p className="truncate">{comment.comment}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteComment(comment.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
