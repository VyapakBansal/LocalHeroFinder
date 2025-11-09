import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LogOut, MapPin, Shield } from "lucide-react";
import { toast } from "sonner";
import Logo from "./Logo";

interface ResponderDashboardProps {
  user: User;
}

interface ResponderProfile {
  availability_status: boolean;
  verification_status: string;
  latitude: number | null;
  longitude: number | null;
}

const ResponderDashboard = ({ user }: ResponderDashboardProps) => {
  const [profile, setProfile] = useState<ResponderProfile | null>(null);
  const [availability, setAvailability] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  const fetchProfile = async () => {
    const { data, error } = await supabase
      .from("responder_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    if (!data) {
      const { error: insertError } = await supabase
        .from("responder_profiles")
        .insert({
          user_id: user.id,
          availability_status: false,
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
      } else {
        fetchProfile();
      }
      return;
    }

    setProfile(data);
    setAvailability(data.availability_status);
  };

  const toggleAvailability = async (checked: boolean) => {
    if (checked) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { error } = await supabase
              .from("responder_profiles")
              .update({
                availability_status: checked,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
              .eq("user_id", user.id);

            if (error) {
              toast.error("Failed to update availability");
              return;
            }

            setAvailability(checked);
            setProfile((prev) => prev ? {
              ...prev,
              availability_status: checked,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            } : null);
            toast.success(checked ? "You're now available" : "You're now offline");
          },
          (error) => {
            toast.error("Please enable location access");
            console.error("Location error:", error);
          }
        );
      } else {
        toast.error("Location not supported");
      }
    } else {
      const { error } = await supabase
        .from("responder_profiles")
        .update({ availability_status: checked })
        .eq("user_id", user.id);

      if (error) {
        toast.error("Failed to update availability");
        return;
      }

      setAvailability(checked);
      toast.success("You're now offline");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="font-bold text-foreground">Responder Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {profile?.verification_status === "verified" ? "✓ Verified" : "Pending verification"}
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <Label htmlFor="availability" className="text-base font-medium">
              Available for emergencies
            </Label>
          </div>
          <Switch
            id="availability"
            checked={availability}
            onCheckedChange={toggleAvailability}
          />
        </div>
      </div>

      <div className="h-[calc(100vh-140px)]">
        {profile?.verification_status === "verified" ? (
          <h1>PUTting MAP here</h1>
        ) : (
          <div className="h-full relative">
            <h1>Pytting mapp </h1>
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Card className="p-8 max-w-md text-center">
                <h2 className="text-xl font-bold mb-2 text-foreground">Verification Pending</h2>
                <p className="text-muted-foreground">
                  Your account is pending verification. Once verified, you'll be able to view and accept emergency requests.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponderDashboard;