import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeftRight, ArrowRight, Coins, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const POINTS_TO_CASH_RATE = 0.01; // 1 point = $0.01
const CASH_TO_POINTS_RATE = 100; // $1 = 100 points

export default function ConvertPoints() {
  const { profile } = useAuth();
  const [pointsAmount, setPointsAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");

  const pointsToCash = parseFloat(pointsAmount) * POINTS_TO_CASH_RATE || 0;
  const cashToPoints = parseFloat(cashAmount) * CASH_TO_POINTS_RATE || 0;

  const handlePointsToCash = () => {
    const points = parseInt(pointsAmount);
    if (isNaN(points) || points <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (points > (profile?.points_balance || 0)) {
      toast.error("Insufficient points");
      return;
    }
    toast.success(`Converted ${points} points to $${pointsToCash.toFixed(2)}`);
    setPointsAmount("");
  };

  const handleCashToPoints = () => {
    const cash = parseFloat(cashAmount);
    if (isNaN(cash) || cash <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (cash > (profile?.cash_balance || 0)) {
      toast.error("Insufficient balance");
      return;
    }
    toast.success(`Converted $${cash.toFixed(2)} to ${cashToPoints} points`);
    setCashAmount("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Convert Points</h1>
        <p className="text-muted-foreground">Convert between points and cash</p>
      </div>

      {/* Balances */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Points Balance</p>
              <p className="text-2xl font-bold">{profile?.points_balance || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cash Balance</p>
              <p className="text-2xl font-bold">${profile?.cash_balance?.toFixed(2) || "0.00"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Conversion Rates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Points → Cash</p>
              <p className="text-xl font-bold">1 point = ${POINTS_TO_CASH_RATE}</p>
            </div>
            <div className="p-4 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">Cash → Points</p>
              <p className="text-xl font-bold">$1 = {CASH_TO_POINTS_RATE} points</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Forms */}
      <Card>
        <CardHeader>
          <CardTitle>Convert</CardTitle>
          <CardDescription>Choose conversion direction</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="points-to-cash">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="points-to-cash">Points → Cash</TabsTrigger>
              <TabsTrigger value="cash-to-points">Cash → Points</TabsTrigger>
            </TabsList>
            <TabsContent value="points-to-cash" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="points">Points to Convert</Label>
                <Input
                  id="points"
                  type="number"
                  placeholder="Enter points"
                  value={pointsAmount}
                  onChange={(e) => setPointsAmount(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <Coins className="h-8 w-8 text-primary" />
                <ArrowRight className="h-4 w-4" />
                <div>
                  <p className="text-sm text-muted-foreground">You'll receive</p>
                  <p className="text-2xl font-bold text-green-500">${pointsToCash.toFixed(2)}</p>
                </div>
              </div>
              <Button onClick={handlePointsToCash} className="w-full">
                Convert to Cash
              </Button>
            </TabsContent>
            <TabsContent value="cash-to-points" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="cash">Cash to Convert ($)</Label>
                <Input
                  id="cash"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                <Wallet className="h-8 w-8 text-green-500" />
                <ArrowRight className="h-4 w-4" />
                <div>
                  <p className="text-sm text-muted-foreground">You'll receive</p>
                  <p className="text-2xl font-bold text-primary">{cashToPoints} points</p>
                </div>
              </div>
              <Button onClick={handleCashToPoints} className="w-full">
                Convert to Points
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
