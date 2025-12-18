import { useState } from "react";
import Popup from "@/components/Popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, ArrowRight } from "lucide-react";

const Index = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted email:", email);
    setIsPopupOpen(false);
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4 text-primary" />
          Beautiful Popups
        </div>

        <h1 className="text-4xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
          Elegant <span className="gradient-text">Popup</span> Components
        </h1>

        <p className="text-lg text-muted-foreground mb-10 max-w-md mx-auto">
          Click the button below to see a beautifully animated popup with smooth
          transitions and modern styling.
        </p>

        <Button
          onClick={() => setIsPopupOpen(true)}
          className="gradient-primary text-primary-foreground px-8 py-6 text-lg rounded-xl font-medium shadow-glow hover:shadow-lg transition-all hover:scale-105"
        >
          Open Popup
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>

      {/* Newsletter Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        title="Stay Updated"
      >
        <div className="space-y-5">
          <p className="text-muted-foreground">
            Subscribe to our newsletter and get the latest updates, tips, and
            exclusive content delivered straight to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-secondary border-0 focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-primary text-primary-foreground rounded-xl font-medium shadow-soft hover:shadow-glow transition-all"
            >
              Subscribe Now
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </Popup>
    </div>
  );
};

export default Index;
