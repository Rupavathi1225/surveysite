import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, DollarSign, Users, ClipboardList, Shield, Star, Trophy, Gift } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">SurveySite</h1>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-primary border-0">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm mb-6">
            <Star className="h-4 w-4 fill-primary" />
            <span>Trusted by 50,000+ users worldwide</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Earn Money by Sharing <br />
            <span className="gradient-text">Your Opinion</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Complete surveys, participate in contests, and refer friends to earn real cash rewards. 
            Join thousands earning from home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary border-0 gap-2 text-lg px-8">
                Start Earning Now <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { value: "$2M+", label: "Paid Out" },
            { value: "50K+", label: "Active Users" },
            { value: "100+", label: "Surveys Daily" },
            { value: "4.9★", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4">
              <p className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</p>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          Why Choose <span className="gradient-text">SurveySite</span>?
        </h3>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { icon: ClipboardList, title: "Daily Surveys", desc: "Complete quick surveys for instant rewards", color: "text-primary" },
            { icon: DollarSign, title: "Cash Rewards", desc: "Withdraw via UPI, PayPal, or Bank", color: "text-green-500" },
            { icon: Users, title: "Referral Program", desc: "Earn from every friend you refer", color: "text-blue-500" },
            { icon: Shield, title: "Secure Payments", desc: "Fast and secure withdrawals", color: "text-purple-500" },
          ].map((feature) => (
            <Card key={feature.title} className="bg-card/50 border-border/50 hover:border-primary/50 transition-all hover:shadow-glow">
              <CardContent className="p-6 text-center">
                <div className={`h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h4 className="font-semibold mb-2 text-lg">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">
          How It <span className="gradient-text">Works</span>
        </h3>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: "1", icon: Users, title: "Sign Up", desc: "Create your free account in seconds" },
            { step: "2", icon: ClipboardList, title: "Complete Surveys", desc: "Answer surveys and earn points" },
            { step: "3", icon: Gift, title: "Get Paid", desc: "Withdraw your earnings instantly" },
          ].map((item) => (
            <div key={item.step} className="text-center relative">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                {item.step}
              </div>
              <h4 className="font-semibold text-lg mb-2">{item.title}</h4>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="gradient-primary border-0 overflow-hidden">
          <CardContent className="p-8 md:p-12 text-center text-primary-foreground">
            <Trophy className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Earning?</h3>
            <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
              Join thousands of users already earning money from home. Sign up is free and takes less than a minute.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Create Free Account <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground">&copy; 2024 SurveySite. All rights reserved.</p>
            <div className="flex gap-6">
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
              <Link to="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
