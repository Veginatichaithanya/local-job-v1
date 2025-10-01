import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, IndianRupee } from "lucide-react";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Job {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  wage: number;
  location?: string;
  description?: string;
  distance?: number;
}

interface JobsMapProps {
  jobs: Job[];
  center?: [number, number];
  onJobClick?: (jobId: string) => void;
}

export function JobsMap({ jobs, center, onJobClick }: JobsMapProps) {
  const mapCenter: [number, number] = center || [20.5937, 78.9629]; // India center
  const validJobs = jobs.filter(job => job.latitude && job.longitude);

  if (validJobs.length === 0) {
    return (
      <div className="h-[400px] rounded-lg border flex items-center justify-center bg-muted">
        <div className="text-center p-6">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-semibold mb-2">No Jobs with Location Data</h3>
          <p className="text-sm text-muted-foreground">
            Jobs with location information will be displayed on the map
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border">
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validJobs.map((job) => (
          <Marker key={job.id} position={[job.latitude, job.longitude]}>
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold mb-2">{job.title}</h3>
                {job.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {job.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <IndianRupee className="w-4 h-4" />
                  <span className="font-semibold">₹{job.wage}/day</span>
                </div>
                {job.location && (
                  <p className="text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {job.location}
                  </p>
                )}
                {job.distance !== undefined && (
                  <Badge variant="outline" className="mb-2">
                    {job.distance.toFixed(1)} km away
                  </Badge>
                )}
                {onJobClick && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => onJobClick(job.id)}
                  >
                    View Details
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}