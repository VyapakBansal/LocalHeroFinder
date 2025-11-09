import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Incident {
  id: string;
  incident_type: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string | null;
  additional_info: string | null;
  created_at: string;
  requester_id: string;
}

interface LiveIncidentMapProps {
  userId: string;
  isAvailable: boolean;
  userLatitude: number | null;
  userLongitude: number | null;
}

function MapBoundsUpdater({ incidents, userLat, userLng }: { incidents: Incident[]; userLat: number | null; userLng: number | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (incidents.length === 0 && userLat && userLng) {
      map.setView([userLat, userLng], 13);
      return;
    }
    
    if (incidents.length > 0) {
      const bounds = L.latLngBounds(
        incidents.map(inc => [inc.latitude, inc.longitude] as [number, number])
      );
      if (userLat && userLng) {
        bounds.extend([userLat, userLng]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [incidents, userLat, userLng, map]);
  
  return null;
}

const getIncidentIcon = (type: string) => {
  const colors: Record<string, string> = {
    "CPR/AED": "#ef4444",
    "Choking": "#dc2626",
    "Severe Bleeding": "#991b1b",
    "Road Accident": "#3b82f6",
    "Anaphylaxis": "#f59e0b",
    "Elderly Fall": "#8b5cf6",
    "Blood Donation": "#10b981",
    "Missing Person": "#6366f1",
  };
  
  const color = colors[type] || "#3b82f6";
  
  return L.divIcon({
    className: "custom-incident-marker",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const userLocationIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background-color: #10b981; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const LiveIncidentMap = ({
  userId,
  isAvailable,
  userLatitude,
  userLongitude,
}: LiveIncidentMapProps) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isAvailable) {
      setIncidents([]);
      return;
    }

    fetchIncidents();

    const channel = supabase
      .channel("incidents-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        (payload) => {
          console.log("Incident update:", payload);
          fetchIncidents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAvailable]);

  const fetchIncidents = async () => {
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .eq("status", "awaiting_responder")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching incidents:", error);
      return;
    }

    setIncidents(data || []);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleAcceptIncident = async (incidentId: string) => {
    const { error } = await supabase
      .from("incidents")
      .update({
        responder_id: userId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", incidentId);

    if (error) {
      toast.error("Failed to accept incident");
      console.error("Error accepting incident:", error);
      return;
    }

    toast.success("Incident accepted! Navigate to the location.");
    setSelectedIncident(null);
    fetchIncidents();
  };

  const getIncidentColor = (type: string) => {
    const colors: Record<string, string> = {
      "CPR/AED": "bg-accent",
      "Choking": "bg-destructive",
      "Severe Bleeding": "bg-secondary",
      "Road Accident": "bg-primary",
      "Anaphylaxis": "bg-accent",
      "Elderly Fall": "bg-primary",
      "Blood Donation": "bg-success",
      "Missing Person": "bg-secondary",
    };
    return colors[type] || "bg-primary";
  };

  if (!isAvailable) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-foreground">You're Offline</h3>
          <p className="text-muted-foreground">
            Toggle availability on to start receiving emergency requests
          </p>
        </Card>
      </div>
    );
  }

  const getMapCenter = (): [number, number] => {
    if (incidents.length > 0) {
      const avgLat = incidents.reduce((sum, inc) => sum + inc.latitude, 0) / incidents.length;
      const avgLng = incidents.reduce((sum, inc) => sum + inc.longitude, 0) / incidents.length;
      return [avgLat, avgLng];
    }
    if (userLatitude && userLongitude) {
      return [userLatitude, userLongitude];
    }
    return [40.7128, -74.0060];
  };

  const mapCenter = getMapCenter();

  return (
    <div className="relative h-full bg-muted/30">
      {isMounted ? (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapBoundsUpdater incidents={incidents} userLat={userLatitude} userLng={userLongitude} />
          
          {userLatitude && userLongitude && (
            <Marker position={[userLatitude, userLongitude]} icon={userLocationIcon}>
              <Popup>
                <div className="text-center">
                  <strong>Your Location</strong>
                  <p className="text-sm text-muted-foreground">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {incidents.map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.latitude, incident.longitude]}
              icon={getIncidentIcon(incident.incident_type)}
              eventHandlers={{
                click: () => {
                  setSelectedIncident(incident);
                },
              }}
            >
              <Popup>
                <div className="text-center">
                  <strong>{incident.incident_type}</strong>
                  {incident.address && (
                    <p className="text-sm text-muted-foreground">{incident.address}</p>
                  )}
                  {userLatitude && userLongitude && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {calculateDistance(
                        userLatitude,
                        userLongitude,
                        incident.latitude,
                        incident.longitude
                      ).toFixed(1)} km away
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <MapPin className="w-16 h-16 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground text-lg">Loading map...</p>
          </div>
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 space-y-2 max-w-md z-[1000]">
        {incidents.map((incident) => {
          const distance = userLatitude && userLongitude
            ? calculateDistance(
                userLatitude,
                userLongitude,
                incident.latitude,
                incident.longitude
              )
            : null;

          return (
            <Card
              key={incident.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedIncident(incident)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${getIncidentColor(incident.incident_type)} mt-1`} />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{incident.incident_type}</h3>
                    <p className="text-sm text-muted-foreground">
                      {distance ? `${distance.toFixed(1)} km away` : "Calculating..."}
                    </p>
                    {incident.address && (
                      <p className="text-xs text-muted-foreground mt-1">{incident.address}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-accent font-medium">Awaiting</span>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedIncident && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Emergency Request</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIncident(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-semibold text-foreground">{selectedIncident.incident_type}</p>
              </div>

              {selectedIncident.address && (
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-foreground">{selectedIncident.address}</p>
                </div>
              )}

              {selectedIncident.additional_info && (
                <div>
                  <p className="text-sm text-muted-foreground">Additional Info</p>
                  <p className="text-foreground">{selectedIncident.additional_info}</p>
                </div>
              )}

              {userLatitude && userLongitude && (
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="font-semibold text-foreground">
                    {calculateDistance(
                      userLatitude,
                      userLongitude,
                      selectedIncident.latitude,
                      selectedIncident.longitude
                    ).toFixed(1)}{" "}
                    km
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedIncident(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90"
                  onClick={() => handleAcceptIncident(selectedIncident.id)}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Accept & Navigate
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LiveIncidentMap;