import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Phone, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import SOSFlow from "./SOSflow";

import Logo from "./Logo";
import MapView from "./MapView";

interface RequesterDashboardProps {
  user: User;
}

const RequesterDashboard = ({ user }: RequesterDashboardProps) => {
  const navigate = useNavigate();
  const [showSOS, setShowSOS] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (showMap) {
    return (
      <MapView
        onBack={() => {
          setShowMap(false);
        }}
      />
    );
  }

  if (showSOS) {
    return (
      <SOSFlow
        onBack={() => setShowSOS(false)}
        onComplete={() => {
          setShowSOS(false);
          setShowMap(true);
          toast.success("Help request sent! Viewing map...");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="font-bold text-foreground">Local Hero Finder</h1>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="fixed top-20 right-4 z-50">
        <Button
          size="lg"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-2xl font-bold"
          onClick={() => window.location.href = "tel:911"}
        >
          <Phone className="w-5 h-5 mr-2" />
          Call 911
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
        <div className="max-w-md w-full space-y-4">
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-accent" />
            </div>
            
            <h2 className="text-2xl font-bold mb-3 text-foreground">Need Help?</h2>
            <p className="text-muted-foreground mb-6">
              Tap the button below to send an emergency alert to verified responders near you.
            </p>

            <Button
              size="lg"
              onClick={() => setShowSOS(true)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground w-full text-lg py-6 rounded-xl shadow-lg font-bold"
            >
              <Shield className="w-6 h-6 mr-2" />
              I Need Help Now
            </Button>
          </Card>

          <Card className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Become a Responder</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Use your skills to help save lives in your community
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/become-responder")}
              className="w-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Apply as Responder
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RequesterDashboard;