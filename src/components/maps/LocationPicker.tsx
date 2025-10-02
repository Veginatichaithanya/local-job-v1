import React, { useEffect, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import LeafletBasicMap from "@/components/maps/LeafletBasicMap";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Default marker icon config is applied inside LeafletBasicMap

interface LocationPickerProps {
  onLocationSelect: (data: {
    pincode: string;
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
  initialPincode?: string;
  initialLat?: number;
  initialLng?: number;
}

class MapErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any) {
    console.error('Map error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-[400px] rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Map failed to load. Please try again later.</p>
        </div>
      );
    }
    return this.props.children as any;
  }
}

// MapClickHandler not needed: click handled in LeafletBasicMap

export function LocationPicker({ onLocationSelect, initialPincode, initialLat, initialLng }: LocationPickerProps) {
  const [pincode, setPincode] = useState(initialPincode || "");
  const [position, setPosition] = useState<[number, number]>([initialLat || 20.5937, initialLng || 78.9629]);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const { toast } = useToast();

  // Memoize map center to prevent unnecessary re-renders
  const mapCenter = useMemo(() => position, [position[0], position[1]]);

  useEffect(() => {
    // Delay map initialization to avoid context issues
    const timer = setTimeout(() => setShowMap(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const lookupPincode = async () => {
    if (!pincode || pincode.length < 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit pincode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Using Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${pincode}&country=India&format=json&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const location = data[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        const displayName = location.display_name;

        setPosition([lat, lng]);
        setAddress(displayName);
        
        onLocationSelect({
          pincode,
          latitude: lat,
          longitude: lng,
          address: displayName,
        });

        toast({
          title: "Location Found",
          description: "Location has been updated on the map",
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find location for this pincode",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      toast({
        title: "Error",
        description: "Failed to fetch location data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await response.json();

      if (data && data.address) {
        const foundPincode = data.address.postcode || "";
        const displayName = data.display_name;

        setPincode(foundPincode);
        setAddress(displayName);

        onLocationSelect({
          pincode: foundPincode,
          latitude: lat,
          longitude: lng,
          address: displayName,
        });
      }
    } catch (error) {
      console.error("Error reverse geocoding:", error);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value)}
            placeholder="Enter 6-digit pincode"
            maxLength={6}
          />
        </div>
        <Button 
          onClick={lookupPincode} 
          disabled={loading}
          className="mt-8"
        >
          {loading ? "Searching..." : "Lookup"}
        </Button>
      </div>

      {address && (
        <div className="text-sm text-muted-foreground">
          <strong>Address:</strong> {address}
        </div>
      )}

      {showMap ? (
        <MapErrorBoundary>
          <div className="h-[400px] rounded-lg overflow-hidden border">
            <LeafletBasicMap
              center={mapCenter}
              markerPosition={position}
              zoom={13}
              scrollWheelZoom={false}
              onMapClick={handleMapClick}
            />
          </div>
        </MapErrorBoundary>
      ) : (
        <div className="h-[400px] rounded-lg overflow-hidden border bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Click on the map to select a location or enter a pincode to search
      </p>
    </div>
  );
}