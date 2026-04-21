import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { MapPin, Navigation, Clock, Edit2, Save, X } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';
import { toast } from 'sonner';

// Fix leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CattleTracker = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geofenceRef = useRef<L.Polygon | null>(null);

  const [isEditingGeofence, setIsEditingGeofence] = useState(false);

  // ✅ FIXED VALID POLYGON
  const [geofenceBounds, setGeofenceBounds] = useState<number[][]>([
    [8.966938, 7.394089],
    [8.966938, 7.398089],
    [8.962938, 7.398089],
    [8.962938, 7.394089],
  ]);

  const { gpsData } = useSensorData();

  // =========================
  // CREATE GEOFENCE
  // =========================
  const createGeofence = useCallback((map: L.Map) => {
    if (!geofenceBounds || geofenceBounds.length < 3) return;

    if (geofenceRef.current) {
      map.removeLayer(geofenceRef.current);
    }

    const polygon = L.polygon(geofenceBounds as L.LatLngExpression[], {
      color: '#22c55e',
      fillColor: '#22c55e',
      fillOpacity: 0.15,
      weight: 3
    }).addTo(map);

    geofenceRef.current = polygon;
  }, [geofenceBounds]);

  // =========================
  // INIT MAP
  // =========================
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([8.97, 7.39], 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // ✅ ENABLE GEOMAN
    map.pm.addControls({
      position: 'topleft',
      drawPolygon: false,
      drawMarker: false,
      drawCircle: false,
      drawPolyline: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: false,
    });

    createGeofence(map);

    return () => {
      map.remove();
    };
  }, []);

  // =========================
  // UPDATE GEOFENCE WHEN CHANGED
  // =========================
  useEffect(() => {
    if (mapInstanceRef.current) {
      createGeofence(mapInstanceRef.current);
    }
  }, [geofenceBounds]);

  // =========================
  // TOGGLE EDIT
  // =========================
  const toggleGeofenceEdit = () => {
    if (!geofenceRef.current) return;

    if (isEditingGeofence) {
      const latLngs = geofenceRef.current.getLatLngs()[0] as L.LatLng[];

      if (latLngs.length < 3) {
        toast.error("Invalid geofence shape");
        return;
      }

      const newBounds = latLngs.map(ll => [ll.lat, ll.lng]);

      setGeofenceBounds(newBounds);
      geofenceRef.current.pm.disable();

      setIsEditingGeofence(false);
      toast.success("Geofence saved");
    } else {
      geofenceRef.current.pm.enable({
        allowSelfIntersection: false,
        draggable: true,
        snappable: true
      });

      setIsEditingGeofence(true);
      toast.info("Editing geofence...");
    }
  };

  // =========================
  // CANCEL EDIT
  // =========================
  const cancelEdit = () => {
    if (!mapInstanceRef.current) return;

    geofenceRef.current?.pm.disable();
    createGeofence(mapInstanceRef.current);

    setIsEditingGeofence(false);
    toast.info("Edit cancelled");
  };

  // =========================
  // DUMMY MARKERS (GPS)
  // =========================
  useEffect(() => {
    if (!mapInstanceRef.current || !gpsData) return;

    gpsData.forEach((node: any) => {
      if (!node.latitude || !node.longitude) return;

      L.marker([node.latitude, node.longitude])
        .addTo(mapInstanceRef.current!)
        .bindPopup(`Node ${node.node_id}`);
    });
  }, [gpsData]);

  return (
    <div className="space-y-6">
      <Card className="h-[700px]">
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>Live Location Map</CardTitle>

            {isEditingGeofence ? (
              <div className="flex gap-2">
                <Button onClick={toggleGeofenceEdit}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={toggleGeofenceEdit}>
                <Edit2 className="w-4 h-4 mr-1" />
                Edit Geofence
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div ref={mapRef} className="w-full h-[620px]" />
        </CardContent>
      </Card>
    </div>
  );
};

export default CattleTracker;
