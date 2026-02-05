import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserBalanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    username: string;
    points_balance: number;
    cash_balance: number;
  } | null;
  onSuccess: () => void;
}

interface SurveyLink {
  id: string;
  name: string;
  payout: number;
}

export default function UserBalanceDialog({ open, onOpenChange, user, onSuccess }: UserBalanceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [surveyLinks, setSurveyLinks] = useState<SurveyLink[]>([]);
  const [formData, setFormData] = useState({
    action: "add" as "add" | "deduct",
    amount: 0,
    balanceType: "points" as "points" | "cash",
    offerName: "",
    selectedOffer: "",
    bonusPercentage: 0,
  });

  useEffect(() => {
    fetchSurveyLinks();
  }, []);

  useEffect(() => {
    if (formData.selectedOffer && formData.selectedOffer !== "custom") {
      const offer = surveyLinks.find(s => s.id === formData.selectedOffer);
      if (offer) {
        setFormData(prev => ({
          ...prev,
          offerName: offer.name,
          amount: offer.payout,
        }));
      }
    }
  }, [formData.selectedOffer, surveyLinks]);

  const fetchSurveyLinks = async () => {
    const { data, error } = await supabase
      .from("survey_links")
      .select("id, name, payout")
      .eq("status", "active")
      .order("name");

    if (!error && data) {
      setSurveyLinks(data);
    }
  };

  const calculateFinalAmount = () => {
    const baseAmount = formData.amount;
    const bonus = formData.bonusPercentage > 0 ? (baseAmount * formData.bonusPercentage) / 100 : 0;
    return baseAmount + bonus;
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    const finalAmount = calculateFinalAmount();
    
    try {
      // Update user balance
      const currentBalance = formData.balanceType === "points" 
        ? user.points_balance 
        : user.cash_balance;
      
      const newBalance = formData.action === "add" 
        ? currentBalance + finalAmount 
        : currentBalance - finalAmount;

      if (newBalance < 0) {
        toast.error("Cannot deduct more than current balance");
        setIsLoading(false);
        return;
      }

      const updateField = formData.balanceType === "points" 
        ? { points_balance: newBalance } 
        : { cash_balance: newBalance };

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateField)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Log to earning history
      const description = formData.offerName 
        ? `${formData.action === "add" ? "Credit" : "Debit"} - ${formData.offerName}${formData.bonusPercentage > 0 ? ` (+${formData.bonusPercentage}% bonus)` : ""}`
        : `Manual ${formData.action === "add" ? "credit" : "debit"} by admin`;

      await supabase.from("earning_history").insert({
        user_id: user.id,
        amount: formData.action === "add" ? finalAmount : -finalAmount,
        type: formData.action === "add" ? "admin_credit" : "admin_debit",
        description,
        status: "approved",
        survey_link_id: formData.selectedOffer && formData.selectedOffer !== "custom" ? formData.selectedOffer : null,
      });

      toast.success(`Successfully ${formData.action === "add" ? "added" : "deducted"} ${finalAmount} ${formData.balanceType}`);
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        action: "add",
        amount: 0,
        balanceType: "points",
        offerName: "",
        selectedOffer: "",
        bonusPercentage: 0,
      });
    } catch (error) {
      toast.error("Failed to update balance");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Balance: {user?.username}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={formData.action}
                onValueChange={(v: "add" | "deduct") => setFormData({ ...formData, action: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add / Credit</SelectItem>
                  <SelectItem value="deduct">Deduct / Debit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Balance Type</Label>
              <Select
                value={formData.balanceType}
                onValueChange={(v: "points" | "cash") => setFormData({ ...formData, balanceType: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Points</SelectItem>
                  <SelectItem value="cash">Cash ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Offer (Optional)</Label>
            <Select
              value={formData.selectedOffer}
              onValueChange={(v) => setFormData({ ...formData, selectedOffer: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an offer or enter custom" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom / Manual Entry</SelectItem>
                {surveyLinks.map((link) => (
                  <SelectItem key={link.id} value={link.id}>
                    {link.name} ({link.payout} pts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Offer Name / Description</Label>
            <Input
              value={formData.offerName}
              onChange={(e) => setFormData({ ...formData, offerName: e.target.value })}
              placeholder="e.g., Survey Completion Bonus"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Bonus Percentage (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.bonusPercentage}
                onChange={(e) => setFormData({ ...formData, bonusPercentage: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>

          {formData.amount > 0 && (
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm">
                <span className="text-muted-foreground">Base Amount:</span> {formData.amount}
              </p>
              {formData.bonusPercentage > 0 && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Bonus ({formData.bonusPercentage}%):</span> +{(formData.amount * formData.bonusPercentage / 100).toFixed(2)}
                </p>
              )}
              <p className="text-sm font-semibold mt-1">
                <span className="text-muted-foreground">Final Amount:</span>{" "}
                <span className="text-primary">{calculateFinalAmount().toFixed(2)} {formData.balanceType}</span>
              </p>
            </div>
          )}

          <div className="p-3 rounded-lg bg-secondary/50 text-sm">
            <p><span className="text-muted-foreground">Current Points:</span> {user?.points_balance || 0}</p>
            <p><span className="text-muted-foreground">Current Cash:</span> ${(user?.cash_balance || 0).toFixed(2)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading || formData.amount <= 0}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {formData.action === "add" ? "Add" : "Deduct"} {calculateFinalAmount().toFixed(2)} {formData.balanceType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
