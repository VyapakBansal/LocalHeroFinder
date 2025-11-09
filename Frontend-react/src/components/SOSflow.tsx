import { useState } from "react";
import { ArrowLeft, Phone, MapPin, Clock, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SOSFlowProps {
  onBack: () => void;
  onComplete: () => void;
}

const emergencyTypes = [
  {
    id: "CPR/AED",
    title: "CPR/AED Needed",
    icon: "❤️",
    description: "Person unconscious or not breathing normally",
    priority: "critical",
  },
  {
    id: "Choking",
    title: "Choking",
    icon: "🫁",
    description: "Person unable to breathe or speak",
    priority: "critical",
  },
  {
    id: "Severe Bleeding",
    title: "Severe Bleeding",
    icon: "🩸",
    description: "Heavy blood loss or deep wound",
    priority: "critical",
  },
  {
    id: "Road Accident",
    title: "Road Accident",
    icon: "🚗",
    description: "Vehicle collision with injuries",
    priority: "high",
  },
  {
    id: "Anaphylaxis",
    title: "Anaphylaxis",
    icon: "💉",
    description: "Severe allergic reaction",
    priority: "critical",
  },
  {
    id: "Elderly Fall",
    title: "Elderly Fall",
    icon: "👴",
    description: "Senior fell and may be injured",
    priority: "medium",
  },
  {
    id: "Blood Donation",
    title: "Blood Donation",
    icon: "🩸",
    description: "Urgent blood needed",
    priority: "medium",
  },
  {
    id: "Missing Person",
    title: "Missing Person",
    icon: "🔍",
    description: "Lost person needs help",
    priority: "medium",
  },
];

const SOSFlow = ({ onBack, onComplete }: SOSFlowProps) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);

    try {
      if (!("geolocation" in navigator)) {
        toast.error("Location not supported by your browser");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { data: { user } } = await supabase.auth.getUser();

          if (!user) {
            toast.error("Please sign in to request help");
            setLoading(false);
            return;
          }

          const { error } = await supabase.from("incidents").insert({
            requester_id: user.id,
            incident_type: selectedType,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            additional_info: additionalInfo || null,
            status: "awaiting_responder",
          });

          if (error) {
            toast.error("Failed to send emergency request");
            console.error("Error creating incident:", error);
            setLoading(false);
            return;
          }

          setStep(3);
          setTimeout(() => {
            toast.success("Emergency request sent to nearby responders!");
            onComplete();
          }, 2000);
        },
        (error) => {
          toast.error("Please enable location access");
          console.error("Location error:", error);
          setLoading(false);
        }
      );
    } catch (error) {
      toast.error("Something went wrong");
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const selectedEmergency = emergencyTypes.find((e) => e.id === selectedType);

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency Call Button */}
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

      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {step < 3 && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-8 hover:bg-muted rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {step === 1 && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                  What's the Emergency?
                </h1>
                <p className="text-xl text-muted-foreground">
                  Select the type of help you need
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {emergencyTypes.map((emergency) => (
                  <Card
                    key={emergency.id}
                    onClick={() => handleTypeSelect(emergency.id)}
                    className={`p-6 cursor-pointer hover:shadow-xl transition-all border-2 rounded-2xl ${
                      emergency.priority === "critical"
                        ? "hover:border-destructive"
                        : "hover:border-primary"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-5xl mb-3">{emergency.icon}</div>
                      <h3 className="font-bold text-foreground text-lg mb-2">
                        {emergency.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {emergency.description}
                      </p>
                      {emergency.priority === "critical" && (
                        <div className="mt-3 inline-flex items-center text-xs font-semibold text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                          Critical
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-8 bg-accent/10 border border-accent/20 rounded-2xl p-6">
                <p className="text-center text-foreground">
                  <strong>Remember:</strong> For life-threatening emergencies, always call 911 first. Local Hero Finder provides additional support.
                </p>
              </div>
            </div>
          )}

          {step === 2 && selectedEmergency && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 rounded-2xl shadow-xl">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{selectedEmergency.icon}</div>
                  <h2 className="text-3xl font-bold text-foreground mb-2">
                    {selectedEmergency.title}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedEmergency.description}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          Your Location
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Will be shared with nearby responders
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-secondary flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">
                          Estimated Response
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Notifying verified responders nearby
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Additional Information (Optional)
                    </label>
                    <Textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="Any additional details that might help responders..."
                      className="rounded-xl min-h-24"
                    />
                  </div>

                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      What happens next?
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Nearby verified responders receive your alert</li>
                      <li>• You'll see who's on their way in real-time</li>
                      <li>• You can communicate with your responder</li>
                      <li>• Professional emergency services are also notified</li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="flex-1 rounded-xl py-6 text-lg font-semibold"
                    >
                      Change Type
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 bg-accent hover:bg-accent/90 rounded-xl py-6 text-lg font-bold"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send Alert"
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-2xl mx-auto">
              <Card className="p-8 rounded-2xl shadow-xl text-center">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Shield className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Alert Sent Successfully
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Nearby responders have been notified. Help is on the way.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-success font-semibold">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                    Searching for nearby responders...
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SOSFlow;