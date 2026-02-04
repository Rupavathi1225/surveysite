import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, DollarSign, Users, ClipboardList, Shield } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold gradient-text">SurveySite</h1>
        <div className="flex gap-4">
          <Link to="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link to="/signup">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          Earn Money by Sharing <span className="gradient-text">Your Opinion</span>
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Complete surveys, participate in contests, and refer friends to earn real cash rewards.
        </p>
        <Link to="/signup">
          <Button size="lg" className="gap-2">
            Start Earning Now <ArrowRight className="h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: ClipboardList, title: "Daily Surveys", desc: "Complete quick surveys for instant rewards" },
            { icon: DollarSign, title: "Cash Rewards", desc: "Withdraw via UPI, PayPal, or Bank" },
            { icon: Users, title: "Referral Program", desc: "Earn from every friend you refer" },
            { icon: Shield, title: "Secure Payments", desc: "Fast and secure withdrawals" },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6 text-center">
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t text-center text-muted-foreground">
        <p>&copy; 2024 SurveySite. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Index;
