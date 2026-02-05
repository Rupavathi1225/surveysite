import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSettings } from "@/hooks/useChatSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, MessageSquare, Send, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_global: boolean;
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
}

export default function NotificationFeed() {
  const { profile } = useAuth();
  const { settings } = useChatSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [todayCommentCount, setTodayCommentCount] = useState(0);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
      fetchTodayCommentCount();
    }
  }, [profile?.id]);

  const fetchNotifications = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data);
    }
    setIsLoading(false);
  };

  const fetchTodayCommentCount = async () => {
    if (!profile?.id) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("notification_comments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("created_at", today.toISOString());

    setTodayCommentCount(count || 0);
  };

  const fetchComments = async (notificationId: string) => {
    const { data, error } = await supabase
      .from("notification_comments")
      .select("*")
      .eq("notification_id", notificationId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Fetch usernames for comments
      const userIds = [...new Set(data.map((c) => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username")
        .in("id", userIds);

      const usernameMap: Record<string, string> = {};
      profiles?.forEach((p) => {
        usernameMap[p.id] = p.username;
      });

      const enrichedComments = data.map((c) => ({
        ...c,
        username: usernameMap[c.user_id] || "Unknown",
      }));

      setComments((prev) => ({ ...prev, [notificationId]: enrichedComments }));
    }
  };

  const toggleExpand = async (notificationId: string) => {
    if (expandedNotif === notificationId) {
      setExpandedNotif(null);
    } else {
      setExpandedNotif(notificationId);
      if (!comments[notificationId]) {
        await fetchComments(notificationId);
      }
    }
  };

  const canComment = () => {
    return todayCommentCount < settings.maxCommentsPerDay;
  };

  const submitComment = async (notificationId: string) => {
    const commentText = newComment[notificationId]?.trim();
    if (!commentText || !profile?.id) return;

    if (!canComment()) {
      toast.error(`Daily comment limit reached (${settings.maxCommentsPerDay} per day)`);
      return;
    }

    setIsSubmitting(notificationId);

    const { error } = await supabase.from("notification_comments").insert({
      notification_id: notificationId,
      user_id: profile.id,
      comment: commentText,
      is_admin: false,
    });

    if (!error) {
      setNewComment((prev) => ({ ...prev, [notificationId]: "" }));
      setTodayCommentCount((prev) => prev + 1);
      await fetchComments(notificationId);
      toast.success("Comment added");
    } else {
      toast.error("Failed to add comment");
    }

    setIsSubmitting(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "warning":
        return "text-yellow-500";
      case "error":
        return "text-destructive";
      default:
        return "text-blue-500";
    }
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Feed
          </div>
          <Badge variant="outline">
            {todayCommentCount}/{settings.maxCommentsPerDay} comments today
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-3 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    !notif.is_read && "bg-muted/30"
                  )}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("mt-1 w-2 h-2 rounded-full bg-current", getTypeIcon(notif.type))} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{notif.title}</h4>
                        <div className="flex items-center gap-2">
                          {notif.is_global && (
                            <Badge variant="secondary" className="text-xs">Global</Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notif.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>

                      {/* Comments Toggle */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(notif.id);
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        {comments[notif.id]?.length || 0} Comments
                        {expandedNotif === notif.id ? (
                          <ChevronUp className="h-3 w-3 ml-1" />
                        ) : (
                          <ChevronDown className="h-3 w-3 ml-1" />
                        )}
                      </Button>

                      {/* Comments Section */}
                      {expandedNotif === notif.id && (
                        <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                          {comments[notif.id]?.map((comment) => (
                            <div key={comment.id} className="flex items-start gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {comment.is_admin ? "A" : comment.username?.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium">
                                    {comment.is_admin ? "Admin" : comment.username}
                                  </span>
                                  {comment.is_admin && (
                                    <Badge variant="secondary" className="text-xs h-4">Admin</Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(comment.created_at), "MMM d, h:mm a")}
                                  </span>
                                </div>
                                <p className="text-sm mt-0.5">{comment.comment}</p>
                              </div>
                            </div>
                          ))}

                          {/* Add Comment */}
                          <div className="flex gap-2 mt-2">
                            <Input
                              placeholder={
                                canComment()
                                  ? "Add a comment..."
                                  : "Daily comment limit reached"
                              }
                              value={newComment[notif.id] || ""}
                              onChange={(e) =>
                                setNewComment((prev) => ({
                                  ...prev,
                                  [notif.id]: e.target.value,
                                }))
                              }
                              disabled={!canComment() || isSubmitting === notif.id}
                              maxLength={500}
                              className="h-8 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              size="sm"
                              className="h-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                submitComment(notif.id);
                              }}
                              disabled={
                                !canComment() ||
                                !newComment[notif.id]?.trim() ||
                                isSubmitting === notif.id
                              }
                            >
                              {isSubmitting === notif.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Send className="h-3 w-3" />
                              )}
                            </Button>
                          </div>

                          {!canComment() && (
                            <div className="flex items-center gap-1 text-xs text-destructive">
                              <AlertCircle className="h-3 w-3" />
                              Daily comment limit reached
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
