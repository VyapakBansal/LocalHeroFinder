import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, MapPin, Shield, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import RoleSelection from "@/components/RoleSelection";
import Logo from "@/components/Logo";
import MapView from "@/components/MapView";
import SOSFlow from "@/components/SOSflow";

const Index = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<"landing" | "role" | "sos" | "map">("landing");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();
  }, [navigate]);

  if (currentView === "role") {
    return <RoleSelection onBack={() => setCurrentView("landing")} />;
  }

  if (currentView === "sos") {
    return <SOSFlow onBack={() => setCurrentView("landing")} onComplete={() => setCurrentView("map")} />;
  }

  if (currentView === "map") {
    return <MapView onBack={() => setCurrentView("landing")}/>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-4 right-4 z-50">
        <Button
          size="lg"
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-2xl font-bold px-8 py-6 text-lg rounded-2xl border-4 border-destructive/20"
          onClick={() => window.location.href = "tel:911"}
        >
          <Phone className="w-6 h-6 mr-2" />
          Call 911
        </Button>
      </div>

      <section className="relative overflow-hidden pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <Logo showText={true} className="flex-col items-center" />
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connect with verified first responders in your area during emergencies. 
              Every second counts. Help is nearby.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-7 rounded-2xl shadow-xl font-bold transform transition-all hover:scale-105"
            >
              <Shield className="w-6 h-6 mr-2" />
              Get Started
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Nearby Responders</h3>
              <p className="text-muted-foreground leading-relaxed">
                Instantly connect with verified first responders within minutes of your location.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Real-Time Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                See responder status, location, and estimated arrival time in real-time.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-8 shadow-lg border border-border">
              <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Verified Heroes</h3>
              <p className="text-muted-foreground leading-relaxed">
                All responders are certified and verified with medical credentials.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
            When Every Second Counts
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Get immediate help for life-threatening emergencies
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "CPR/AED", icon: "❤️" },
              { title: "Choking", icon: "🫁" },
              { title: "Severe Bleeding", icon: "🩸" },
              { title: "Road Accident", icon: "🚗" },
              { title: "Anaphylaxis", icon: "💉" },
              { title: "Elderly Fall", icon: "👴" },
              { title: "Blood Donation", icon: "🩸" },
              { title: "Missing Person", icon: "🔍" },
            ].map((emergency) => (
              <div
                key={emergency.title}
                className="bg-card rounded-xl p-6 shadow-md border border-border hover:border-primary transition-all cursor-pointer hover:shadow-xl"
              >
                <div className="text-4xl mb-3">{emergency.icon}</div>
                <h3 className="font-semibold text-foreground text-lg">{emergency.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-accent">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Tap SOS</h3>
              <p className="text-muted-foreground leading-relaxed">
                Select your emergency type and share your location instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Match & Connect</h3>
              <p className="text-muted-foreground leading-relaxed">
                Verified responders nearby receive your alert and can accept.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-success">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Get Help</h3>
              <p className="text-muted-foreground leading-relaxed">
                Track your responder in real-time and communicate until help arrives.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <Users className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Community of Heroes
          </h2>
          <p className="text-xl mb-8 opacity-90 leading-relaxed">
            Whether you need help or want to help others, Local Hero Finder brings communities together in moments that matter most.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-10 py-7 rounded-2xl shadow-xl font-bold"
          >
            Join Today
          </Button>
        </div>
      </section>

      <footer className="py-8 px-4 bg-card border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p className="text-sm">
            © 2025 Local Hero Finder. Your safety is our priority. • Privacy-first • GDPR Compliant • End-to-end Encrypted
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
