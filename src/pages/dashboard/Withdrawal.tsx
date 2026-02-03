import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentMethod {
  id: string;
  name: string;
  minimum_amount: number;
  fee_percentage: number;
  status: string;
}

export default function Withdrawal() {
  const { profile, refreshProfile } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("status", "active");

    if (!error && data) {
      setPaymentMethods(data);
      if (data.length > 0) {
        setSelectedMethod(data[0].id);
      }
    }
  };

  const selectedPaymentMethod = paymentMethods.find((m) => m.id === selectedMethod);
  const minAmount = selectedPaymentMethod?.minimum_amount || 4;
  const feePercentage = selectedPaymentMethod?.fee_percentage || 2;
  const fee = parseFloat(amount) * (feePercentage / 100) || 0;
  const finalAmount = parseFloat(amount) - fee || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id) {
      toast.error("Please login to continue");
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue < minAmount) {
      toast.error(`Minimum withdrawal amount is $${minAmount}`);
      return;
    }

    if ((profile?.cash_balance || 0) < amountValue) {
      toast.error("Insufficient balance");
      return;
    }

    if (!accountId.trim()) {
      toast.error("Please enter your account ID");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("withdrawals").insert({
      user_id: profile.id,
      amount: amountValue,
      fee,
      payment_method: selectedPaymentMethod?.name || "",
      account_id: accountId,
      status: "pending",
    });

    if (error) {
      toast.error("Failed to submit withdrawal request");
    } else {
      toast.success("Withdrawal request submitted!");
      setAmount("");
      setAccountId("");
      await refreshProfile();
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal</h1>
        <p className="text-muted-foreground">Request a cash withdrawal</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Withdrawal Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Request Withdrawal
            </CardTitle>
            <CardDescription>Choose your payment method and amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{method.name}</span>
                          <span className="text-sm text-muted-foreground">
                            Min: ${method.minimum_amount} | Fee: {method.fee_percentage}%
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minAmount}
                  placeholder={`Min: $${minAmount}`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId">
                  {selectedPaymentMethod?.name === "UPI"
                    ? "UPI ID"
                    : selectedPaymentMethod?.name === "PayPal"
                    ? "PayPal Email"
                    : "Account ID"}
                </Label>
                <Input
                  id="accountId"
                  placeholder="Enter your account details"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Withdrawal"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${profile?.cash_balance?.toFixed(2) || "0.00"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Available for withdrawal</p>
            </CardContent>
          </Card>

          {amount && parseFloat(amount) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Withdrawal Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span>${parseFloat(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Fee ({feePercentage}%)</span>
                  <span>-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold">
                  <span>You'll receive</span>
                  <span className="text-primary">${finalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Withdrawals are processed within 24-48 hours. Make sure your account details are correct.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
