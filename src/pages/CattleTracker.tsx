import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { MapPin, Navigation, Clock, Edit2, Save, X, Download } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';
import CattleDetailModal from '@/components/CattleDetailModal';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fix for default markers in Leaflet with error handling
try {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
} catch (error) {
  console.warn('Leaflet icon configuration failed:', error);
}

interface CattleData {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: 'moving' | 'grazing' | 'resting';
  lastUpdate: string;
  health: 'good' | 'fair' | 'alert';
  nodeId: number;
}

const CattleTracker = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geofenceRef = useRef<L.Polygon | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());

  const userInteractedRef = useRef<boolean>(false);
  const hasAutoFitRef = useRef<boolean>(false);
  const lastCenterKey = 'cattle_map_center';
  const lastZoomKey = 'cattle_map_zoom';

  const [isEditingGeofence, setIsEditingGeofence] = useState(false);
  const [selectedCattle, setSelectedCattle] = useState<CattleData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [highlightedCattleId, setHighlightedCattleId] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [lastUpdateTimes, setLastUpdateTimes] = useState<Record<number, string>>({});

  const GEOFENCE_KEY = 'cattle_geofence_bounds';
  const CATTLE_HISTORY_KEY = 'cattle_details_history';
  const LAST_UPDATE_KEY = 'cattle_last_updates';

  const getLocalStorage = (key: string, defaultValue: any) => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  const setLocalStorage = (key: string, value: any) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  };

  // ✅ FIXED GEofence default bounds (was invalid before)
  const [geofenceBounds, setGeofenceBounds] = useState<number[][]>(() => {
    const defaultBounds = [
      [8.966938, 7.394089],
      [8.966938, 7.392089],
      [8.964938, 7.392089],
      [8.964938, 7.394089]
    ];
    return getLocalStorage(GEOFENCE_KEY, defaultBounds);
  });

  const { gpsData, isNodeOnline } = useSensorData();

  const createGeofence = (map: L.Map) => {
    try {
      if (geofenceRef.current) {
        map.removeLayer(geofenceRef.current);
      }

      const polygon = L.polygon(geofenceBounds as L.LatLngExpression[], {
        color: 'hsl(140, 76%, 45%)',
        fillColor: 'hsl(140, 76%, 45%)',
        fillOpacity: 0.15,
        weight: 4,
        opacity: 0.9
      }).addTo(map);

      polygon.bindPopup('<div class="font-semibold text-farm-dark-green">Farm Geofence Boundary</div>');

      // ✅ enable geoman safely
      if ((polygon as any).pm) {
        (polygon as any).pm.setOptions({
          allowSelfIntersection: false,
          draggable: true,
          snappable: true,
        });
      }

      geofenceRef.current = polygon;
    } catch (error) {
      console.error(error);
    }
  };

  const toggleGeofenceEdit = () => {
    if (!mapInstanceRef.current || !geofenceRef.current) return;

    try {
      const polygon = geofenceRef.current as any;

      if (isEditingGeofence) {
        const latLngs = polygon.getLatLngs()[0] as L.LatLng[];

        const newBounds = latLngs.map((ll: L.LatLng) => [ll.lat, ll.lng]);
        setGeofenceBounds(newBounds);
        setLocalStorage(GEOFENCE_KEY, newBounds);

        polygon.pm?.disable();

        setIsEditingGeofence(false);
        toast.success("Geofence updated successfully");

      } else {
        polygon.pm?.enable({
          allowSelfIntersection: false,
          draggable: true,
          snappable: true,
        });

        setIsEditingGeofence(true);
        toast.info("Edit geofence by dragging points");
      }
    } catch (error) {
      toast.error("Failed to edit geofence");
    }
  };

  const cancelGeofenceEdit = () => {
    if (!mapInstanceRef.current || !geofenceRef.current) return;

    try {
      (geofenceRef.current as any).pm?.disable();
      setIsEditingGeofence(false);

      createGeofence(mapInstanceRef.current);

      toast.info("Geofence edit cancelled");
    } catch (error) {}
  };

  // ✅ re-render geofence when bounds change
  useEffect(() => {
    if (mapInstanceRef.current) {
      createGeofence(mapInstanceRef.current);
    }
  }, [geofenceBounds]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([8.97, 7.39], 15);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    createGeofence(map);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Live Map</CardTitle>

          <div className="flex gap-2">
            {isEditingGeofence ? (
              <>
                <Button onClick={toggleGeofenceEdit}>
                  <Save className="w-4 h-4" /> Save
                </Button>
                <Button onClick={cancelGeofenceEdit}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </>
            ) : (
              <Button onClick={toggleGeofenceEdit}>
                <Edit2 className="w-4 h-4" /> Edit Geofence
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div ref={mapRef} className="w-full h-[600px]" />
        </CardContent>
      </Card>
    </div>
  );
};

export default CattleTracker;
