import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle, Send, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Ticket {
  id: string;
  ticket_no: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export default function SupportTicket() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (profile?.id) {
      fetchTickets();
    }
  }, [profile?.id]);

  const fetchTickets = async () => {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", profile?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setTickets(data);
    }
    setIsLoading(false);
  };

  const fetchReplies = async (ticketId: string) => {
    const { data } = await supabase
      .from("ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (data) {
      setReplies(data);
    }
  };

  const generateTicketNo = () => {
    return `TKT${Date.now().toString(36).toUpperCase()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error("Please login to continue");
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("support_tickets").insert({
      user_id: profile.id,
      ticket_no: generateTicketNo(),
      subject,
      message,
      status: "open",
    });

    if (error) {
      toast.error("Failed to create ticket");
    } else {
      toast.success("Support ticket created!");
      setSubject("");
      setMessage("");
      await fetchTickets();
    }
    setIsSubmitting(false);
  };

  const viewTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    await fetchReplies(ticket.id);
  };

  const handleReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;

    const { error } = await supabase.from("ticket_replies").insert({
      ticket_id: selectedTicket.id,
      user_id: profile?.id,
      message: replyMessage,
      is_admin: false,
    });

    if (!error) {
      toast.success("Reply sent!");
      setReplyMessage("");
      await fetchReplies(selectedTicket.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="default">Open</Badge>;
      case "in_progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "resolved":
        return <Badge className="bg-green-500">Resolved</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Support Ticket</h1>
        <p className="text-muted-foreground">Get help from our support team</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Ticket */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Create New Ticket
            </CardTitle>
            <CardDescription>Submit a support request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={profile?.username || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Ticket List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
            <CardDescription>Track your support requests</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No tickets yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket No</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">{ticket.ticket_no}</TableCell>
                      <TableCell className="truncate max-w-[150px]">{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => viewTicket(ticket)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Ticket Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket: {selectedTicket?.ticket_no}</DialogTitle>
            <DialogDescription>
              {selectedTicket?.subject} • {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Original Message */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground mb-1">
                You • {selectedTicket && format(new Date(selectedTicket.created_at), "MMM dd, yyyy HH:mm")}
              </p>
              <p>{selectedTicket?.message}</p>
            </div>

            {/* Replies */}
            {replies.map((reply) => (
              <div
                key={reply.id}
                className={`p-4 rounded-lg ${reply.is_admin ? "bg-primary/10 ml-4" : "bg-secondary/50 mr-4"}`}
              >
                <p className="text-sm text-muted-foreground mb-1">
                  {reply.is_admin ? "Support Team" : "You"} •{" "}
                  {format(new Date(reply.created_at), "MMM dd, yyyy HH:mm")}
                </p>
                <p>{reply.message}</p>
              </div>
            ))}
          </div>

          {/* Reply Form */}
          {selectedTicket?.status !== "closed" && selectedTicket?.status !== "resolved" && (
            <div className="flex gap-2 mt-4">
              <Textarea
                placeholder="Type your reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={2}
              />
              <Button onClick={handleReply} disabled={!replyMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
