import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type LeafletBasicMapProps = {
  center: [number, number];
  markerPosition: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
};

const LeafletBasicMap: React.FC<LeafletBasicMapProps> = ({
  center,
  markerPosition,
  zoom = 13,
  scrollWheelZoom = false,
  onMapClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;
    if (mapRef.current) return; // already initialized

    // Fix default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    markerRef.current = L.marker(markerPosition).addTo(map);

    if (onMapClick) {
      map.on("click", (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // Update view when center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom());
  }, [center[0], center[1]]);

  // Update marker when position changes
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;
    marker.setLatLng(markerPosition);
  }, [markerPosition[0], markerPosition[1]]);

  return (
    <div
      ref={containerRef}
      style={{ height: "100%", width: "100%" }}
      aria-label="Map showing selected location"
      role="img"
    />
  );
};

export default LeafletBasicMap;
