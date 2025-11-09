import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, MapPin, Navigation, Phone, MessageCircle, Clock, Star, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const requesterIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #ef4444; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const responderIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #3b82f6; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

interface MapViewProps {
  onBack: () => void;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const MapView = ({ onBack }: MapViewProps) => {
  const [status, setStatus] = useState<"searching" | "matched" | "enroute" | "arrived">("matched");
  const [isMounted, setIsMounted] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [responderLocation, setResponderLocation] = useState<[number, number] | null>(null);
  const [incidentId, setIncidentId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Location error:", error);
        }
      );
    }

    const fetchIncident = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: incidents } = await supabase
        .from("incidents")
        .select("*")
        .eq("requester_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (incidents) {
        setIncidentId(incidents.id);
        setUserLocation([incidents.latitude, incidents.longitude]);
        
        if (incidents.responder_id && incidents.status === "accepted") {
          const { data: responderProfile } = await supabase
            .from("responder_profiles")
            .select("latitude, longitude")
            .eq("user_id", incidents.responder_id)
            .maybeSingle();
          
          if (responderProfile?.latitude && responderProfile?.longitude) {
            setResponderLocation([responderProfile.latitude, responderProfile.longitude]);
            setStatus("enroute");
          }
        }
      }
    };

    fetchIncident();
  }, []);

  const defaultLocation: [number, number] = [40.7128, -74.0060];
  const mapCenter = userLocation || defaultLocation;

  const responder = {
    name: "Dr. Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    rating: 4.9,
    responseCount: 127,
    certifications: ["EMT", "CPR", "First Aid"],
    eta: "3 min",
    distance: "0.8 mi",
  };

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

      <div className="bg-primary text-primary-foreground py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-primary-foreground hover:bg-primary-foreground/10 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="font-semibold">
              {status === "matched" && "Responder Matched"}
              {status === "enroute" && "Responder En Route"}
              {status === "arrived" && "Responder Arrived"}
            </span>
          </div>
          <div className="w-20" />
        </div>
      </div>
      <div className="relative h-[400px] border-y border-border">
        {isMounted && userLocation ? (
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={mapCenter} />
            
            <Marker position={userLocation} icon={requesterIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <p className="text-sm text-muted-foreground">Emergency Location</p>
                </div>
              </Popup>
            </Marker>

            {responderLocation && (
              <Marker position={responderLocation} icon={responderIcon}>
                <Popup>
                  <div className="text-center">
                    <strong>{responder.name}</strong>
                    <p className="text-sm text-muted-foreground">Coming to help</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <MapPin className="w-16 h-16 text-primary mx-auto animate-pulse" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 z-[1000] flex gap-2">
          <Badge className="bg-card text-foreground border border-border shadow-lg">
            <span className="w-2 h-2 bg-destructive rounded-full mr-2" />
            Your Location
          </Badge>
          {responderLocation && (
            <Badge className="bg-card text-foreground border border-border shadow-lg">
              <span className="w-2 h-2 bg-primary rounded-full mr-2" />
              Responder
            </Badge>
          )}
        </div>
      </div>

      <div className="py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="p-6 rounded-2xl shadow-xl">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-6">
                  <Avatar className="w-20 h-20 border-4 border-primary">
                    <AvatarImage src={responder.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      SJ
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-2xl font-bold text-foreground">
                          {responder.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                          <span className="font-semibold text-foreground">
                            {responder.rating}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({responder.responseCount} responses)
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        Verified
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {responder.certifications.map((cert) => (
                        <Badge
                          key={cert}
                          variant="outline"
                          className="border-primary/30 text-primary"
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-primary/10 rounded-xl p-4 text-center">
                    <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{responder.eta}</p>
                    <p className="text-sm text-muted-foreground">Estimated arrival</p>
                  </div>
                  <div className="bg-secondary/10 rounded-xl p-4 text-center">
                    <Navigation className="w-6 h-6 text-secondary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{responder.distance}</p>
                    <p className="text-sm text-muted-foreground">Distance away</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 rounded-xl font-semibold"
                  >
                    <Phone className="w-5 h-5 mr-2" />
                    Call Responder
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-xl font-semibold"
                  >
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Chat
                  </Button>
                </div>
              </div>

              <div className="md:w-80">
                <h4 className="font-bold text-foreground mb-4">Incident Status</h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-success-foreground" />
                      </div>
                      <div className="w-0.5 h-12 bg-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Alert Sent</p>
                      <p className="text-sm text-muted-foreground">12:34 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-success-foreground" />
                      </div>
                      <div className="w-0.5 h-12 bg-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Responder Matched</p>
                      <p className="text-sm text-muted-foreground">12:35 PM</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                      </div>
                      <div className="w-0.5 h-12 bg-border" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">En Route</p>
                      <p className="text-sm text-muted-foreground">Current</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-muted-foreground">Arrived</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-6 p-6 rounded-2xl bg-accent/10 border-accent/20">
            <h4 className="font-bold text-foreground mb-3">What to do while waiting:</h4>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Stay calm and in a safe location
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Keep your phone nearby and charged
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                Follow any immediate first-aid instructions if safe to do so
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">•</span>
                The responder can see your location and is navigating to you
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapView;