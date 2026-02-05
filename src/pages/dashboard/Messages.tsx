import DirectMessages from "@/components/dashboard/DirectMessages";

export default function Messages() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Chat with other users</p>
      </div>
      <DirectMessages />
    </div>
  );
}
