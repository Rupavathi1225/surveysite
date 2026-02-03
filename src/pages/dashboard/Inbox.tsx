import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox as InboxIcon, Mail, MailOpen } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  created_at: string;
  from_user: string;
  subject: string;
  message: string;
  is_read: boolean;
}

export default function Inbox() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  useEffect(() => {
    if (profile?.id) {
      fetchMessages();
    }
  }, [profile?.id]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setMessages(data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (message: Message) => {
    if (!message.is_read) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", message.id);

      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, is_read: true } : m))
      );
    }
    setSelectedMessage(message);
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">Your messages and notifications</p>
        </div>
        {unreadCount > 0 && (
          <Badge variant="default">{unreadCount} unread</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <InboxIcon className="h-5 w-5" />
            Messages
          </CardTitle>
          <CardDescription>Internal messaging system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <InboxIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">You'll receive notifications and updates here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8"></TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((message) => (
                  <TableRow
                    key={message.id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => markAsRead(message)}
                  >
                    <TableCell>
                      {message.is_read ? (
                        <MailOpen className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Mail className="h-4 w-4 text-primary" />
                      )}
                    </TableCell>
                    <TableCell className={!message.is_read ? "font-medium" : ""}>
                      {message.from_user}
                    </TableCell>
                    <TableCell className={!message.is_read ? "font-medium" : ""}>
                      {message.subject}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(message.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={message.is_read ? "secondary" : "default"}>
                        {message.is_read ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription>
              From: {selectedMessage?.from_user} • {selectedMessage && format(new Date(selectedMessage.created_at), "MMM dd, yyyy HH:mm")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 whitespace-pre-wrap">{selectedMessage?.message}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
