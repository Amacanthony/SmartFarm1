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

  // Local storage keys
  const GEOFENCE_KEY = 'cattle_geofence_bounds';
  const CATTLE_HISTORY_KEY = 'cattle_details_history';
  const LAST_UPDATE_KEY = 'cattle_last_updates';

  // Safe localStorage getter
  const getLocalStorage = (key: string, defaultValue: any) => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (error) {
      console.warn(`Failed to read ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  // Safe localStorage setter
  const setLocalStorage = (key: string, value: any) => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to write ${key} to localStorage:`, error);
    }
  };

  // Initialize persisted states
  const [geofenceBounds, setGeofenceBounds] = useState<number[][]>(() => {
    const defaultBounds = [
      [8.966938, 7.394089],
      [8.966938, 7.394089],
      [8.964938, 7.392089],
      [8.964938, 7.392089]
    ];
    return getLocalStorage(GEOFENCE_KEY, defaultBounds);
  });

  type CattleDetailsEntry = {
    id: number;
    name: string;
    weight?: number;
    weightUnit?: string;
    color?: string;
    lastCheckup?: string;
    healthStatus?: string;
    notes?: string;
    timestamp: number;
  };

  const [cattleHistory, setCattleHistory] = useState<Record<number, CattleDetailsEntry[]>>(
    () => getLocalStorage(CATTLE_HISTORY_KEY, {})
  );

  // Use sensor data
  const { gpsData, isNodeOnline } = useSensorData();

  // Initialize lastUpdateTimes from localStorage once on mount
  useEffect(() => {
    const savedUpdateTimes = getLocalStorage(LAST_UPDATE_KEY, {});
    setLastUpdateTimes(savedUpdateTimes);
  }, []);

  // Timestamp normalization helper
  const normalizeTimestampToDate = (ts: number | undefined | null): Date | null => {
    if (ts == null) return null;
    const asNum = Number(ts);
    if (Number.isNaN(asNum)) return null;
    if (asNum > 1e12) return new Date(asNum);
    if (asNum > 1e9) return new Date(asNum * 1000);
    return null;
  };

  // Create cattle data from GPS nodes
  const createCattleData = useCallback((): CattleData[] => {
    try {
      const cattleNames = ['Bessie', 'Daisy', 'Moobert', 'Luna'];
      const nodeIds = [5, 6, 8, 9];

      return nodeIds.map((nodeId, index) => {
        const gpsNode = Array.isArray(gpsData) ? gpsData.find(g => g?.node_id === nodeId) : null;

        if (gpsNode && typeof gpsNode === 'object') {
          const online = isNodeOnline(nodeId);
          const date = normalizeTimestampToDate(gpsNode.timestamp);
          let lastUpdate = lastUpdateTimes[nodeId] || 'No recent data';
          if (date) lastUpdate = date.toLocaleString();

          return {
            id: nodeId,
            name: cattleNames[index] || `Cattle ${nodeId}`,
            lat: Number(gpsNode.latitude) || 8.97000,
            lng: Number(gpsNode.longitude) || 7.39000,
            status: online ? ((gpsNode.speed && gpsNode.speed > 0.5) ? 'moving' : 'grazing') : 'resting',
            lastUpdate: lastUpdate !== 'No recent data' ? lastUpdate : (lastUpdateTimes[nodeId] || 'No recent data'),
            health: online ? 'good' : 'alert',
            nodeId: nodeId
          };
        }

        const fallbackPositions = [
          [8.97000, 7.39000],
          [8.97000, 7.39000],
          [8.97000, 7.39000],
          [8.97000, 7.39000]
        ];

        return {
          id: nodeId,
          name: cattleNames[index] || `Cattle ${nodeId}`,
          lat: fallbackPositions[index]?.[0] || 8.97000,
          lng: fallbackPositions[index]?.[1] || 7.39000,
          status: 'resting',
          lastUpdate: lastUpdateTimes[nodeId] || 'No recent data',
          health: 'alert',
          nodeId: nodeId
        };
      });
    } catch (error) {
      console.error('Error creating cattle data:', error);
      return [];
    }
  }, [gpsData, lastUpdateTimes, isNodeOnline]);

  const cattleData = createCattleData();

  // Update lastUpdateTimes when new data comes in
  useEffect(() => {
    if (!gpsData || gpsData.length === 0) return;

    const newUpdateTimes: Record<number, string> = {};
    let hasUpdates = false;
    const nodeIds = [5, 6, 8, 9];

    nodeIds.forEach(nodeId => {
      const gpsNode = gpsData.find(g => g?.node_id === nodeId);
      if (gpsNode && typeof gpsNode === 'object') {
        const date = normalizeTimestampToDate(gpsNode.timestamp);
        if (date) {
          const newUpdateTime = date.toLocaleString();
          const currentUpdateTime = lastUpdateTimes[nodeId];
          if (!currentUpdateTime || date.getTime() > new Date(currentUpdateTime).getTime()) {
            newUpdateTimes[nodeId] = newUpdateTime;
            hasUpdates = true;
          }
        }
      }
    });

    if (hasUpdates) {
      const updatedTimes = { ...lastUpdateTimes, ...newUpdateTimes };
      setLastUpdateTimes(updatedTimes);
      setLocalStorage(LAST_UPDATE_KEY, updatedTimes);
    }
  }, [gpsData]);

  // Colors for cattle markers
  const NODE_COLORS = [
    '#1E7E34', '#228B3C', '#2ECC71', '#165A2C', '#FF6B6B',
    '#4ECDC4', '#FFD93D', '#9B59B6', '#E67E22', '#3498DB',
  ];

  // Create cattle dot icon
  const createCattleDotIcon = (cattleId: number, isHighlighted: boolean = false) => {
    const color = NODE_COLORS[cattleId % NODE_COLORS.length] || '#1E7E34';
    return L.divIcon({
      className: 'cattle-dot-icon',
      html: `
        <div style="
          background-color: ${color};
          width: ${isHighlighted ? '28px' : '24px'};
          height: ${isHighlighted ? '28px' : '24px'};
          border-radius: 9999px;
          border: ${isHighlighted ? '4px' : '3px'} solid ${isHighlighted ? '#FFD700' : 'white'};
          box-shadow: 0 ${isHighlighted ? '4px 8px' : '3px 6px'} rgba(0,0,0,${isHighlighted ? '0.6' : '0.4'});
        "></div>
      `,
      iconSize: [isHighlighted ? 28 : 24, isHighlighted ? 28 : 24],
      iconAnchor: [isHighlighted ? 14 : 12, isHighlighted ? 14 : 12],
      popupAnchor: [0, isHighlighted ? -14 : -12]
    });
  };

  // Helper: small random offset to separate overlapping dots
  const jitter = (value: number) => value + (Math.random() - 0.5) * 0.00005;

  // ─── FIX: createGeofence now accepts bounds as a parameter ───────────────────
  const createGeofence = useCallback((map: L.Map, bounds: number[][]) => {
    try {
      if (geofenceRef.current) {
        map.removeLayer(geofenceRef.current);
        geofenceRef.current = null;
      }

      const polygon = L.polygon(bounds as L.LatLngExpression[], {
        color: 'hsl(140, 76%, 45%)',
        fillColor: 'hsl(140, 76%, 45%)',
        fillOpacity: 0.15,
        weight: 4,
        opacity: 0.9
      }).addTo(map);

      polygon.bindPopup('<div class="font-semibold text-farm-dark-green">Farm Geofence Boundary</div>');
      geofenceRef.current = polygon;
    } catch (error) {
      console.error('Failed to create geofence:', error);
    }
  }, []);

  // ─── FIX: Re-draw geofence whenever geofenceBounds changes ──────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    // Don't redraw while the user is actively editing (pm handles that live)
    if (isEditingGeofence) return;
    createGeofence(mapInstanceRef.current, geofenceBounds);
  }, [geofenceBounds, isEditingGeofence, createGeofence]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const savedCenter = getLocalStorage(lastCenterKey, null);
      const savedZoom = getLocalStorage(lastZoomKey, null);

      let initialCenter: L.LatLngExpression = [8.97, 7.39];
      let initialZoom = 15;

      if (savedCenter && Array.isArray(savedCenter) && savedCenter.length === 2) {
        initialCenter = [savedCenter[0], savedCenter[1]];
      }
      if (savedZoom && typeof savedZoom === 'number') {
        initialZoom = savedZoom;
      }

      const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const handleUserInteraction = () => {
        try {
          const center = map.getCenter();
          setLocalStorage(lastCenterKey, [center.lat, center.lng]);
          setLocalStorage(lastZoomKey, map.getZoom());
        } catch (error) {
          console.warn('Failed to save map state:', error);
        }
        userInteractedRef.current = true;
      };

      map.on('zoomend', handleUserInteraction);
      map.on('moveend', handleUserInteraction);

      // ─── FIX: Pass current geofenceBounds into createGeofence ───────────────
      createGeofence(map, geofenceBounds);
      setMapError(null);

    } catch (error) {
      console.error('Failed to initialize map:', error);
      setMapError('Failed to load map. Please refresh the page.');
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('Error cleaning up map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once

  // Auto-fit bounds when GPS data becomes available
  useEffect(() => {
    if (!mapInstanceRef.current || hasAutoFitRef.current || cattleData.length === 0) return;
    try {
      const bounds = L.latLngBounds(cattleData.map(c => [c.lat, c.lng] as L.LatLngTuple));
      if (bounds.isValid() && !userInteractedRef.current) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
        hasAutoFitRef.current = true;
      }
    } catch (error) {
      console.warn('Failed to fit bounds:', error);
    }
  }, [cattleData]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = () => {
      try {
        const map = mapInstanceRef.current;
        if (!map) return;

        const seen = new Set<number>();

        cattleData.forEach(cattle => {
          seen.add(cattle.id);
          const existing = markersRef.current.get(cattle.id);
          const lat = jitter(cattle.lat);
          const lng = jitter(cattle.lng);

          const popupContent = `
            <div class="p-3 min-w-[200px]">
              <h3 class="font-bold text-lg mb-2 text-farm-dark-green">${cattle.name}</h3>
              <div class="space-y-1 text-sm">
                <p><strong>GPS Node:</strong> ${cattle.nodeId}</p>
                <p><strong>Health:</strong> <span class="capitalize">${cattle.health}</span></p>
                <p><strong>Location:</strong> ${cattle.lat.toFixed(6)}, ${cattle.lng.toFixed(6)}</p>
                <p><strong>Last Update:</strong> ${cattle.lastUpdate}</p>
              </div>
            </div>
          `;

          const isHighlighted = highlightedCattleId === cattle.id;

          if (existing) {
            existing.setLatLng([lat, lng]);
            existing.setPopupContent(popupContent);
            existing.setIcon(createCattleDotIcon(cattle.id, isHighlighted));
          } else {
            const marker = L.marker([lat, lng], {
              icon: createCattleDotIcon(cattle.id, isHighlighted)
            }).addTo(map);
            marker.bindPopup(popupContent);
            markersRef.current.set(cattle.id, marker);
          }
        });

        markersRef.current.forEach((marker, id) => {
          if (!seen.has(id)) {
            map.removeLayer(marker);
            markersRef.current.delete(id);
          }
        });
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
    const interval = setInterval(u
