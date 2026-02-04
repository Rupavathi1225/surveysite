import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminChat from "@/components/dashboard/AdminChat";
import NotificationFeed from "@/components/dashboard/NotificationFeed";
import { MessageSquare, Bell } from "lucide-react";

export default function ChatCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chat & Notifications</h1>
        <p className="text-muted-foreground">
          Chat with admin and view system notifications
        </p>
      </div>

      <Tabs defaultValue="chat" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Admin Chat
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <AdminChat />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
