import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { 
  Gift, Plus, Edit, Trash2, Loader2, Upload, FileSpreadsheet, 
  Link as LinkIcon, Download, AlertCircle, CheckCircle2, Eye
} from "lucide-react";
import { toast } from "sonner";

interface Offer {
  offer_id: string;
  title: string;
  url: string;
  country: string[] | null;
  payout: number;
  description: string | null;
  platform: string | null;
  preview_url: string | null;
  vertical: string | null;
  device: string | null;
  image_url: string | null;
  traffic_sources: string[] | null;
  expiry: string | null;
  devices: string[] | null;
  non_access_url: string | null;
  allowed_countries: string[] | null;
  payout_model: string | null;
  currency: string | null;
  percent: number | null;
  is_active: boolean | null;
  created_at: string | null;
}

const defaultFormData = {
  offer_id: "",
  title: "",
  url: "",
  country: "",
  payout: 0,
  description: "",
  platform: "",
  preview_url: "",
  vertical: "",
  device: "",
  image_url: "",
  traffic_sources: "",
  expiry: "",
  devices: "",
  non_access_url: "",
  allowed_countries: "",
  payout_model: "CPA",
  currency: "USD",
  percent: 0,
  is_active: true,
};

export default function AdminOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [activeTab, setActiveTab] = useState("manual");
  
  // Bulk upload state
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] }>({ success: 0, failed: 0, errors: [] });
  
  // Google Sheet state
  const [sheetUrl, setSheetUrl] = useState("");
  const [isSheetLoading, setIsSheetLoading] = useState(false);
  const [sheetData, setSheetData] = useState<any[]>([]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setOffers(data);
    if (error) toast.error("Failed to fetch offers");
    setIsLoading(false);
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      offer_id: offer.offer_id,
      title: offer.title,
      url: offer.url,
      country: offer.country?.join(", ") || "",
      payout: offer.payout,
      description: offer.description || "",
      platform: offer.platform || "",
      preview_url: offer.preview_url || "",
      vertical: offer.vertical || "",
      device: offer.device || "",
      image_url: offer.image_url || "",
      traffic_sources: offer.traffic_sources?.join(", ") || "",
      expiry: offer.expiry ? offer.expiry.split("T")[0] : "",
      devices: offer.devices?.join(", ") || "",
      non_access_url: offer.non_access_url || "",
      allowed_countries: offer.allowed_countries?.join(", ") || "",
      payout_model: offer.payout_model || "CPA",
      currency: offer.currency || "USD",
      percent: offer.percent || 0,
      is_active: offer.is_active ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingOffer(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const parseArrayField = (value: string): string[] | null => {
    if (!value.trim()) return null;
    return value.split(",").map(v => v.trim()).filter(v => v);
  };

  const handleSave = async () => {
    if (!formData.offer_id.trim() || !formData.title.trim() || !formData.url.trim()) {
      toast.error("Offer ID, Title, and URL are required");
      return;
    }

    setIsSaving(true);

    const data = {
      offer_id: formData.offer_id,
      title: formData.title,
      url: formData.url,
      country: parseArrayField(formData.country),
      payout: formData.payout,
      description: formData.description || null,
      platform: formData.platform || null,
      preview_url: formData.preview_url || null,
      vertical: formData.vertical || null,
      device: formData.device || null,
      image_url: formData.image_url || null,
      traffic_sources: parseArrayField(formData.traffic_sources),
      expiry: formData.expiry ? new Date(formData.expiry).toISOString() : null,
      devices: parseArrayField(formData.devices),
      non_access_url: formData.non_access_url || null,
      allowed_countries: parseArrayField(formData.allowed_countries),
      payout_model: formData.payout_model || null,
      currency: formData.currency || "USD",
      percent: formData.percent || null,
      is_active: formData.is_active,
    };

    if (editingOffer) {
      const { error } = await supabase.from("offers").update(data).eq("offer_id", editingOffer.offer_id);
      if (error) toast.error("Failed to update offer");
      else {
        toast.success("Offer updated!");
        setIsDialogOpen(false);
        fetchOffers();
      }
    } else {
      const { error } = await supabase.from("offers").insert(data);
      if (error) {
        if (error.message.includes("duplicate")) {
          toast.error("Offer ID already exists");
        } else {
          toast.error("Failed to create offer");
        }
      } else {
        toast.success("Offer created!");
        setIsDialogOpen(false);
        fetchOffers();
      }
    }
    setIsSaving(false);
  };

  const handleDelete = async (offerId: string) => {
    if (!confirm("Delete this offer?")) return;
    const { error } = await supabase.from("offers").delete().eq("offer_id", offerId);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Deleted!");
      fetchOffers();
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    const { error } = await supabase
      .from("offers")
      .update({ is_active: !offer.is_active })
      .eq("offer_id", offer.offer_id);
    
    if (error) toast.error("Failed to update status");
    else {
      toast.success(offer.is_active ? "Offer deactivated" : "Offer activated");
      fetchOffers();
    }
  };

  // Bulk upload handlers
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBulkFile(file);
    setBulkData([]);
    setBulkResults({ success: 0, failed: 0, errors: [] });
    
    const fileType = file.name.split('.').pop()?.toLowerCase();
    
    try {
      if (fileType === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        setBulkData(Array.isArray(data) ? data : [data]);
      } else if (fileType === 'csv') {
        const text = await file.text();
        const rows = parseCSV(text);
        setBulkData(rows);
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        toast.error("Excel files require xlsx library. Please use CSV or JSON format.");
      } else {
        toast.error("Unsupported file format. Use CSV, JSON, or Excel.");
      }
    } catch (err) {
      toast.error("Failed to parse file");
      console.error(err);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
    
    return rows;
  };

  const handleBulkUpload = async () => {
    if (bulkData.length === 0) {
      toast.error("No data to upload");
      return;
    }
    
    setIsBulkProcessing(true);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];
    
    for (const row of bulkData) {
      try {
        const offer = {
          offer_id: row.offer_id || row.id || `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: row.title || row.name || "Untitled Offer",
          url: row.url || row.link || "",
          country: row.country ? (typeof row.country === 'string' ? row.country.split(',').map((c: string) => c.trim()) : row.country) : null,
          payout: parseFloat(row.payout) || 0,
          description: row.description || null,
          platform: row.platform || null,
          preview_url: row.preview_url || null,
          vertical: row.vertical || null,
          device: row.device || null,
          image_url: row.image_url || null,
          traffic_sources: row.traffic_sources ? (typeof row.traffic_sources === 'string' ? row.traffic_sources.split(',').map((t: string) => t.trim()) : row.traffic_sources) : null,
          expiry: row.expiry ? new Date(row.expiry).toISOString() : null,
          devices: row.devices ? (typeof row.devices === 'string' ? row.devices.split(',').map((d: string) => d.trim()) : row.devices) : null,
          non_access_url: row.non_access_url || null,
          allowed_countries: row.allowed_countries ? (typeof row.allowed_countries === 'string' ? row.allowed_countries.split(',').map((c: string) => c.trim()) : row.allowed_countries) : null,
          payout_model: row.payout_model || "CPA",
          currency: row.currency || row.Currency || "USD",
          percent: parseFloat(row.percent) || null,
          is_active: row.is_active !== false && row.is_active !== "false",
        };
        
        const { error } = await supabase.from("offers").upsert(offer, { onConflict: 'offer_id' });
        
        if (error) {
          failed++;
          errors.push(`Row ${bulkData.indexOf(row) + 1}: ${error.message}`);
        } else {
          success++;
        }
      } catch (err: any) {
        failed++;
        errors.push(`Row ${bulkData.indexOf(row) + 1}: ${err.message}`);
      }
    }
    
    setBulkResults({ success, failed, errors });
    setIsBulkProcessing(false);
    
    if (success > 0) {
      toast.success(`Successfully imported ${success} offers`);
      fetchOffers();
    }
    if (failed > 0) {
      toast.error(`Failed to import ${failed} offers`);
    }
  };

  // Google Sheet handlers
  const handleFetchSheet = async () => {
    if (!sheetUrl.trim()) {
      toast.error("Please enter a Google Sheet URL");
      return;
    }
    
    setIsSheetLoading(true);
    setSheetData([]);
    
    try {
      // Extract sheet ID from URL
      const match = sheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (!match) {
        toast.error("Invalid Google Sheet URL");
        setIsSheetLoading(false);
        return;
      }
      
      const sheetId = match[1];
      // Use CSV export format (sheet must be public)
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        toast.error("Failed to fetch sheet. Make sure it's publicly accessible.");
        setIsSheetLoading(false);
        return;
      }
      
      const text = await response.text();
      const rows = parseCSV(text);
      setSheetData(rows);
      toast.success(`Loaded ${rows.length} rows from Google Sheet`);
    } catch (err) {
      toast.error("Failed to fetch Google Sheet");
      console.error(err);
    }
    
    setIsSheetLoading(false);
  };

  const handleImportSheet = async () => {
    if (sheetData.length === 0) {
      toast.error("No data to import");
      return;
    }
    
    // Reuse bulk upload logic
    setBulkData(sheetData);
    await handleBulkUpload();
    setSheetData([]);
  };

  const downloadTemplate = () => {
    const headers = [
      "offer_id", "title", "url", "country", "payout", "description", 
      "platform", "preview_url", "vertical", "device", "image_url",
      "traffic_sources", "expiry", "devices", "non_access_url", 
      "allowed_countries", "payout_model", "currency", "percent"
    ];
    const csv = headers.join(",") + "\n" + 
      "OFF-001,Sample Offer,https://example.com,\"US,UK\",10.00,A sample offer,web,https://preview.com,finance,all,,\"Social,Email\",2025-12-31,\"Desktop,Mobile\",,\"US,UK,CA\",CPA,USD,50";
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'offers_template.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offers Management</h1>
          <p className="text-muted-foreground">Manage offers via manual entry, bulk upload, or Google Sheets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Offer
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          <TabsTrigger value="sheet">Google Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Offers List ({offers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No offers yet</p>
                  <p className="text-sm">Click "Add Offer" to create one</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Offer ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Payout</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {offers.map((offer) => (
                        <TableRow key={offer.offer_id}>
                          <TableCell className="font-mono text-sm">{offer.offer_id}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{offer.title}</TableCell>
                          <TableCell>{offer.currency || "USD"} {offer.payout}</TableCell>
                          <TableCell>{offer.country?.slice(0, 3).join(", ") || "All"}{offer.country && offer.country.length > 3 ? "..." : ""}</TableCell>
                          <TableCell>
                            <Badge variant={offer.is_active ? "default" : "secondary"}>
                              {offer.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {offer.preview_url && (
                                <Button size="sm" variant="ghost" asChild>
                                  <a href={offer.preview_url} target="_blank" rel="noopener noreferrer">
                                    <Eye className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(offer)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleToggleActive(offer)}>
                                <Switch checked={offer.is_active ?? true} className="scale-75" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDelete(offer.offer_id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Bulk Upload
              </CardTitle>
              <CardDescription>
                Upload CSV, Excel, or JSON files. Download the template for correct format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <Label htmlFor="bulk-file" className="cursor-pointer">
                  <span className="text-primary hover:underline">Click to upload</span>
                  <span className="text-muted-foreground"> or drag and drop</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">CSV, JSON, or Excel files</p>
                <Input 
                  id="bulk-file" 
                  type="file" 
                  accept=".csv,.json,.xlsx,.xls"
                  className="hidden" 
                  onChange={handleFileChange}
                />
              </div>

              {bulkFile && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    <span>{bulkFile.name}</span>
                    <Badge variant="secondary">{bulkData.length} rows</Badge>
                  </div>
                  <Button onClick={handleBulkUpload} disabled={isBulkProcessing || bulkData.length === 0}>
                    {isBulkProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Import {bulkData.length} Offers
                      </>
                    )}
                  </Button>
                </div>
              )}

              {(bulkResults.success > 0 || bulkResults.failed > 0) && (
                <div className="space-y-2">
                  <div className="flex gap-4">
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="h-3 w-3" /> {bulkResults.success} Success
                    </Badge>
                    {bulkResults.failed > 0 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertCircle className="h-3 w-3" /> {bulkResults.failed} Failed
                      </Badge>
                    )}
                  </div>
                  {bulkResults.errors.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-sm text-destructive bg-destructive/10 p-2 rounded">
                      {bulkResults.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                Google Sheet Import
              </CardTitle>
              <CardDescription>
                Import offers from a public Google Sheet. Make sure the sheet is shared publicly (View access).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="https://docs.google.com/spreadsheets/d/..." 
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleFetchSheet} disabled={isSheetLoading}>
                  {isSheetLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Fetch"
                  )}
                </Button>
              </div>

              {sheetData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{sheetData.length} rows loaded</Badge>
                    <Button onClick={handleImportSheet} disabled={isBulkProcessing}>
                      {isBulkProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Import All
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="max-h-64 overflow-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(sheetData[0] || {}).slice(0, 5).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sheetData.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).slice(0, 5).map((val: any, j) => (
                              <TableCell key={j} className="max-w-[150px] truncate">{val}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {sheetData.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 5 of {sheetData.length} rows
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingOffer ? "Edit Offer" : "Add New Offer"}</DialogTitle>
            <DialogDescription>Fill in the offer details below</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Offer ID *</Label>
                <Input 
                  value={formData.offer_id} 
                  onChange={(e) => setFormData({ ...formData, offer_id: e.target.value })}
                  placeholder="OFF-001"
                  disabled={!!editingOffer}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Title *</Label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Offer title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>URL *</Label>
              <Input 
                value={formData.url} 
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Payout</Label>
                <Input 
                  type="number" 
                  step="0.01"
                  value={formData.payout} 
                  onChange={(e) => setFormData({ ...formData, payout: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payout Model</Label>
                <Select value={formData.payout_model} onValueChange={(v) => setFormData({ ...formData, payout_model: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPA">CPA</SelectItem>
                    <SelectItem value="CPI">CPI</SelectItem>
                    <SelectItem value="CPL">CPL</SelectItem>
                    <SelectItem value="CPS">CPS</SelectItem>
                    <SelectItem value="RevShare">RevShare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Countries (comma-separated)</Label>
                <Input 
                  value={formData.country} 
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="US, UK, CA"
                />
              </div>
              <div className="space-y-2">
                <Label>Allowed Countries (comma-separated)</Label>
                <Input 
                  value={formData.allowed_countries} 
                  onChange={(e) => setFormData({ ...formData, allowed_countries: e.target.value })}
                  placeholder="US, UK, CA"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <Input 
                  value={formData.platform} 
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="web, ios, android"
                />
              </div>
              <div className="space-y-2">
                <Label>Device</Label>
                <Input 
                  value={formData.device} 
                  onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                  placeholder="all, desktop, mobile"
                />
              </div>
              <div className="space-y-2">
                <Label>Vertical</Label>
                <Input 
                  value={formData.vertical} 
                  onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                  placeholder="finance, gaming, etc."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preview URL</Label>
                <Input 
                  value={formData.preview_url} 
                  onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input 
                  value={formData.image_url} 
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Traffic Sources (comma-separated)</Label>
                <Input 
                  value={formData.traffic_sources} 
                  onChange={(e) => setFormData({ ...formData, traffic_sources: e.target.value })}
                  placeholder="Social, Email, Display"
                />
              </div>
              <div className="space-y-2">
                <Label>Devices (comma-separated)</Label>
                <Input 
                  value={formData.devices} 
                  onChange={(e) => setFormData({ ...formData, devices: e.target.value })}
                  placeholder="Desktop, Mobile, Tablet"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input 
                  type="date"
                  value={formData.expiry} 
                  onChange={(e) => setFormData({ ...formData, expiry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Percent (%)</Label>
                <Input 
                  type="number"
                  value={formData.percent} 
                  onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Non-Access URL</Label>
              <Input 
                value={formData.non_access_url} 
                onChange={(e) => setFormData({ ...formData, non_access_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} 
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingOffer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}