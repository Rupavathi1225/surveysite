 import { useState, useEffect } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Input } from "@/components/ui/input";
 import { Activity, Search, RefreshCw, ChevronDown, ChevronUp, Monitor, Smartphone, Globe, AlertTriangle, ExternalLink, Shield } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { format } from "date-fns";
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
 
 interface LoginLog {
   id: string;
   user_id: string;
   email: string;
   ip_address: string | null;
   user_agent: string | null;
   login_at: string;
   status: string;
   device_type?: string | null;
   browser?: string | null;
   os?: string | null;
   location_city?: string | null;
   location_region?: string | null;
   location_country?: string | null;
   isp?: string | null;
   device_fingerprint?: string | null;
   is_new_device?: boolean | null;
   risk_score?: number | null;
   login_method?: string | null;
 }
 
 interface PageVisit {
   id: string;
   page_path: string;
   page_title: string | null;
   visited_at: string;
 }
 
 export default function AdminLoginLogs() {
   const [logs, setLogs] = useState<LoginLog[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [search, setSearch] = useState("");
   const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
   const [pageVisits, setPageVisits] = useState<Record<string, PageVisit[]>>({});
 
   useEffect(() => {
     fetchLogs();
     
     const channel = supabase
       .channel('login_logs_changes')
       .on(
         'postgres_changes',
         { event: 'INSERT', schema: 'public', table: 'login_logs' },
         (payload) => {
           setLogs((prev) => [payload.new as LoginLog, ...prev]);
         }
       )
       .subscribe();
 
     return () => {
       supabase.removeChannel(channel);
     };
   }, []);
 
   const fetchLogs = async () => {
     setIsLoading(true);
     const { data, error } = await supabase
       .from("login_logs")
       .select("*")
       .order("login_at", { ascending: false })
       .limit(100);
 
     if (!error && data) {
       setLogs(data as LoginLog[]);
     }
     setIsLoading(false);
   };
 
   const fetchPageVisits = async (logId: string) => {
     if (pageVisits[logId]) return;
     
     const { data } = await supabase
       .from("page_visits")
       .select("*")
       .eq("login_log_id", logId)
       .order("visited_at", { ascending: false })
       .limit(10);
     
     if (data) {
       setPageVisits(prev => ({ ...prev, [logId]: data as PageVisit[] }));
     }
   };
 
   const toggleExpand = (logId: string) => {
     if (expandedLogId === logId) {
       setExpandedLogId(null);
     } else {
       setExpandedLogId(logId);
       fetchPageVisits(logId);
     }
   };
 
   const filteredLogs = logs.filter(
     (log) =>
       log.email.toLowerCase().includes(search.toLowerCase()) ||
       log.ip_address?.includes(search)
   );
 
   const stats = {
     total: logs.length,
     successful: logs.filter(l => l.status === "success").length,
     failed: logs.filter(l => l.status === "failed").length,
     successRate: logs.length > 0 
       ? Math.round((logs.filter(l => l.status === "success").length / logs.length) * 100) 
       : 0
   };
 
   const getRiskColor = (score: number) => {
     if (score <= 30) return "text-green-500";
     if (score <= 60) return "text-yellow-500";
     return "text-red-500";
   };
 
   const getRiskLabel = (score: number) => {
     if (score <= 30) return "LOW";
     if (score <= 60) return "MEDIUM";
     return "HIGH";
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <div>
           <h1 className="text-2xl font-bold">Login Logs</h1>
           <p className="text-muted-foreground">Track and monitor all login attempts with page visit history</p>
         </div>
         <Button variant="outline" onClick={fetchLogs}>
           <RefreshCw className="h-4 w-4 mr-2" />
           Refresh
         </Button>
       </div>
 
       {/* Stats Cards */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground">Total Logs</p>
             <p className="text-3xl font-bold">{stats.total}</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground">Successful</p>
             <p className="text-3xl font-bold text-green-500">{stats.successful}</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground">Failed</p>
             <p className="text-3xl font-bold text-red-500">{stats.failed}</p>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="pt-6">
             <p className="text-sm text-muted-foreground">Success Rate</p>
             <p className="text-3xl font-bold">{stats.successRate}%</p>
           </CardContent>
         </Card>
       </div>
 
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Activity className="h-5 w-5" />
             Recent Login Attempts ({stats.total} total)
             <Badge variant="outline" className="ml-2">Live</Badge>
           </CardTitle>
           <div className="relative mt-4">
             <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Search by email or IP..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-10"
             />
           </div>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="space-y-3">
               {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="h-12 w-full" />
               ))}
             </div>
           ) : filteredLogs.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
               <p>No login logs found</p>
             </div>
           ) : (
             <div className="space-y-3">
               {filteredLogs.map((log) => (
                 <Collapsible key={log.id} open={expandedLogId === log.id} onOpenChange={() => toggleExpand(log.id)}>
                   <div className="border rounded-lg">
                     <CollapsibleTrigger asChild>
                       <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                             <Badge variant={log.status === "success" ? "default" : "destructive"}>
                               {log.status === "success" ? "✓ Success" : "✗ Failed"}
                             </Badge>
                             <span className="font-medium">{log.email.split("@")[0]}</span>
                             <span className="text-muted-foreground">{log.email}</span>
                           </div>
                           {expandedLogId === log.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                         </div>
                         
                         <div className="flex items-center gap-4 mt-2 text-sm">
                           <div className="flex items-center gap-1">
                             <Shield className={`h-4 w-4 ${getRiskColor(log.risk_score || 0)}`} />
                             <span>Risk: {log.risk_score || 0}/100</span>
                             <Badge variant="outline" className="ml-1">{getRiskLabel(log.risk_score || 0)}</Badge>
                           </div>
                           {log.is_new_device && (
                             <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                               <AlertTriangle className="h-3 w-3 mr-1" />New Device
                             </Badge>
                           )}
                         </div>
                       </div>
                     </CollapsibleTrigger>
                     
                     <CollapsibleContent>
                       <div className="border-t p-4 bg-muted/30 space-y-4">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div>
                             <p className="text-sm text-muted-foreground">Login Time</p>
                             <p className="font-medium">{format(new Date(log.login_at), "dd/MM/yyyy, hh:mm:ss a")}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">IP Address</p>
                             <p className="font-mono">{log.ip_address || "N/A"}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Location</p>
                             <p>{[log.location_city, log.location_region, log.location_country].filter(Boolean).join(", ") || "Unknown"}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">ISP</p>
                             <p>{log.isp || "Unknown"}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Device</p>
                             <div className="flex items-center gap-1">
                               {log.device_type === "mobile" ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                               <span>{log.device_type || "desktop"} - {log.os || "Unknown OS"}</span>
                             </div>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Browser</p>
                             <p>{log.browser || "Unknown"}</p>
                           </div>
                           <div>
                             <p className="text-sm text-muted-foreground">Method</p>
                             <p>{log.login_method || "PASSWORD"}</p>
                           </div>
                         </div>
                         
                         <div className="border-t pt-4">
                           <h4 className="font-medium flex items-center gap-2 mb-3">
                             <ExternalLink className="h-4 w-4" />Last 10 Pages Visited
                           </h4>
                           {pageVisits[log.id]?.length ? (
                             <div className="space-y-2">
                               {pageVisits[log.id].map((visit) => (
                                 <div key={visit.id} className="flex items-center justify-between text-sm bg-background p-2 rounded">
                                   <span className="font-mono">{visit.page_path}</span>
                                   <span className="text-muted-foreground">{format(new Date(visit.visited_at), "hh:mm:ss a")}</span>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-center text-muted-foreground py-4">No page visits recorded for this session</p>
                           )}
                         </div>
                         
                         <div className="border-t pt-4">
                           <h4 className="font-medium flex items-center gap-2 mb-3"><Shield className="h-4 w-4" />Fraud Analysis</h4>
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-background rounded">
                               <span className="font-medium">Fraud Risk Score</span>
                               <div className="flex items-center gap-2">
                                 <span className={`h-2 w-2 rounded-full ${log.risk_score && log.risk_score > 30 ? "bg-yellow-500" : "bg-green-500"}`} />
                                 <span className="font-bold">{log.risk_score || 0}/100</span>
                                 <Badge variant="outline">{getRiskLabel(log.risk_score || 0)}</Badge>
                               </div>
                             </div>
                             <div className="p-3 bg-background rounded">
                               <p className="font-medium mb-2">Detected Issues</p>
                               {log.is_new_device ? (
                                 <div className="flex items-center gap-2 text-orange-600">
                                   <AlertTriangle className="h-4 w-4" /><span>Login from new device</span>
                                 </div>
                               ) : <p className="text-muted-foreground text-sm">No issues detected</p>}
                             </div>
                             <div className="p-3 bg-background rounded">
                               <p className="font-medium mb-2">Device Information</p>
                               <p className="font-mono text-sm">Fingerprint: {log.device_fingerprint || "Not captured"}</p>
                               {log.is_new_device && <p className="text-orange-600 text-sm mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />New device detected for this user</p>}
                             </div>
                             <div className="p-3 bg-background rounded">
                               <p className="font-medium mb-2">Login Frequency</p>
                               <div className="flex gap-6 text-sm">
                                 <span>Last Hour: <strong>N/A</strong></span>
                                 <span>Last 24h: <strong>N/A</strong></span>
                               </div>
                             </div>
                             {log.is_new_device && (
                               <div className="p-3 bg-background rounded">
                                 <p className="font-medium mb-2">Recommended Actions</p>
                                 <ul className="list-disc list-inside text-sm text-muted-foreground">
                                   <li>Send device change notification to user</li>
                                 </ul>
                               </div>
                             )}
                           </div>
                         </div>
                       </div>
                     </CollapsibleContent>
                   </div>
                 </Collapsible>
               ))}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }