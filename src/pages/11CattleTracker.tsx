  import React, { useEffect, useRef, useState } from 'react';
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
  import { Button } from "@/components/ui/button";
  import L from 'leaflet';
  import 'leaflet/dist/leaflet.css';
  import '@geoman-io/leaflet-geoman-free';
  import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
  import { MapPin, Navigation, Clock, Edit2, Save, X } from "lucide-react";
  import { useSensorData } from '@/hooks/useSensorData';
  import CattleDetailModal from '@/components/CattleDetailModal';
  import { toast } from 'sonner';
  import jsPDF from 'jspdf';
  import autoTable from 'jspdf-autotable';

  // Fix for default markers in Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });

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

    const userInteractedRef = useRef<boolean>(false); // becomes true after user pans/zooms
    const hasAutoFitRef = useRef<boolean>(false); // ensure we fit bounds at most once automatically
    const lastCenterKey = 'cattle_map_center';
    const lastZoomKey = 'cattle_map_zoom';

    const [isEditingGeofence, setIsEditingGeofence] = useState(false);
    const [selectedCattle, setSelectedCattle] = useState<CattleData | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [highlightedCattleId, setHighlightedCattleId] = useState<number | null>(null);

    // Local storage keys
    const GEOFENCE_KEY = 'cattle_geofence_bounds';
    const CATTLE_HISTORY_KEY = 'cattle_details_history';
    const LAST_UPDATE_KEY = 'cattle_last_updates';

    // Persisted last update times
    const [lastUpdateTimes, setLastUpdateTimes] = useState<Record<number, string>>(() => {
      try {
        const saved = localStorage.getItem(LAST_UPDATE_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    // Persisted geofence bounds - centered at 8.970000, 7.390000 (current cattle position)
    const [geofenceBounds, setGeofenceBounds] = useState<number[][]>(() => {
      try {
        const saved = localStorage.getItem(GEOFENCE_KEY);
        return saved ? JSON.parse(saved) : [
          [8.966, 7.386],  // Southwest corner
          [8.966, 7.390],  // Southeast corner
          [8.970, 7.390],  // Northeast corner
          [8.970, 7.386]   // Northwest corner
        ];
      } catch {
        return [
          [8.966, 7.386],
          [8.966, 7.390],
          [8.970, 7.390],
          [8.970, 7.386]
        ];
      }
    });

    // Persisted cattle details history
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

    const [cattleHistory, setCattleHistory] = useState<Record<number, CattleDetailsEntry[]>>(() => {
      try {
        const saved = localStorage.getItem(CATTLE_HISTORY_KEY);
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    });

    const { gpsData, isNodeOnline } = useSensorData();

    // --------- Timestamp normalization helper ----------
    // Detects whether timestamp is seconds or milliseconds and returns a Date or null
    const normalizeTimestampToDate = (ts: number | undefined | null): Date | null => {
      if (ts == null) return null;
      const asNum = Number(ts);
      if (Number.isNaN(asNum)) return null;
      // If timestamp is in milliseconds (e.g., > 1e12) treat as ms
      if (asNum > 1e12) {
        return new Date(asNum);
      }
      // If it's likely seconds (e.g., > 1e9 and < 1e12), treat as seconds
      if (asNum > 1e9) {
        return new Date(asNum * 1000);
      }
      // otherwise invalid
      return null;
    };

    // --------- Create cattle data from GPS nodes 5,6,8,9 ----------
    const createCattleData = (): CattleData[] => {
      const cattleNames = ['Bessie', 'Daisy', 'Moobert', 'Luna'];
      const nodeIds = [5, 6, 8, 9];

      return nodeIds.map((nodeId, index) => {
        const gpsNode = gpsData.find(g => g.node_id === nodeId);

        if (gpsNode) {
          const online = isNodeOnline(nodeId);
          const date = normalizeTimestampToDate(gpsNode.timestamp);
          const lastUpdate = date ? date.toLocaleString() : 'No recent data';

          // Persist the last update time
          if (lastUpdate !== 'No recent data') {
            setLastUpdateTimes(prev => {
              const updated = { ...prev, [nodeId]: lastUpdate };
              try {
                localStorage.setItem(LAST_UPDATE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }

          return {
            id: nodeId,
            name: cattleNames[index],
            lat: gpsNode.latitude,
            lng: gpsNode.longitude,
            status: online ? (gpsNode.speed && gpsNode.speed > 0.5 ? 'moving' : 'grazing') : 'resting' as 'moving' | 'grazing' | 'resting',
            lastUpdate: lastUpdate !== 'No recent data' ? lastUpdate : (lastUpdateTimes[nodeId] || 'No recent data'),
            health: online ? 'good' : 'alert' as 'good' | 'alert',
            nodeId: nodeId
          };
        }

        // Fallback data if GPS not available - use last known update time
        const fallbackPositions = [
          [8.97000,7.39000],
          [8.97000,7.39000],
          [8.97000,7.39000],
          [8.97000,7.39000]
        ];

        return {
          id: nodeId,
          name: cattleNames[index],
          lat: fallbackPositions[index][0],
          lng: fallbackPositions[index][1],
          status: 'resting' as 'resting',
          lastUpdate: lastUpdateTimes[nodeId] || 'No recent data',
          health: 'alert' as 'alert',
          nodeId: nodeId
        };
      });
    };

    const cattleData = createCattleData();

    // Unique colors for each cattle - each gets a different color
    const NODE_COLORS = [
      '#1E7E34', // farm-medium-green
      '#228B3C', // farm-bright-green
      '#2ECC71', // farm-accent-green
      '#165A2C', // farm-forest-green
      '#FF6B6B', // coral red
      '#4ECDC4', // turquoise
      '#FFD93D', // yellow
      '#9B59B6', // purple
      '#E67E22', // orange
      '#3498DB', // blue
    ];

    // Larger colored dot icon per cattle - unique color for each
    const createCattleDotIcon = (cattleId: number, isHighlighted: boolean = false) => {
      const color = NODE_COLORS[cattleId % NODE_COLORS.length];
      const pulseAnimation = isHighlighted ? `
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
      ` : '';
      
      const pulseRing = isHighlighted ? `
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 9999px;
          animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        "></div>
      ` : '';
      
      return L.divIcon({
        className: 'cattle-dot-icon',
        html: `
          <style>${pulseAnimation}</style>
          <div style="position: relative; width: 24px; height: 24px;">
            ${pulseRing}
            <div style="
              background-color: ${color};
              width: ${isHighlighted ? '28px' : '24px'};
              height: ${isHighlighted ? '28px' : '24px'};
              border-radius: 9999px;
              border: ${isHighlighted ? '4px' : '3px'} solid ${isHighlighted ? '#FFD700' : 'white'};
              box-shadow: 0 ${isHighlighted ? '4px 8px' : '3px 6px'} rgba(0,0,0,${isHighlighted ? '0.6' : '0.4'});
              position: relative;
              z-index: ${isHighlighted ? '1000' : '1'};
            "></div>
          </div>
        `,
        iconSize: [isHighlighted ? 28 : 24, isHighlighted ? 28 : 24],
        iconAnchor: [isHighlighted ? 14 : 12, isHighlighted ? 14 : 12],
        popupAnchor: [0, isHighlighted ? -14 : -12]
      });
    };

    // Helper: small random offset to separate overlapping dots
    const jitter = (value: number) => value + (Math.random() - 0.5) * 0.00005;

    // ---------- Initialize map ----------
    useEffect(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Restore last center and zoom if present
      const savedCenter = localStorage.getItem(lastCenterKey);
      const savedZoom = localStorage.getItem(lastZoomKey);
      let initialCenter: L.LatLngExpression = [8.968, 7.388]; // Nigeria fallback
      let initialZoom = 15;

      try {
        if (savedCenter) {
          const parsed = JSON.parse(savedCenter);
          if (Array.isArray(parsed) && parsed.length === 2 && typeof parsed[0] === 'number') {
            initialCenter = [parsed[0], parsed[1]];
          }
        }
        if (savedZoom) {
          const z = Number(savedZoom);
          if (!Number.isNaN(z)) initialZoom = z;
        }
      } catch (e) {
        // ignore parse errors and fallback to defaults
      }

      const map = L.map(mapRef.current).setView(initialCenter, initialZoom);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // When the user interacts (zooms or moves), persist zoom & center and mark userInteracted
      const handleUserZoom = () => {
        try {
          const center = map.getCenter();
          localStorage.setItem(lastCenterKey, JSON.stringify([center.lat, center.lng]));
          localStorage.setItem(lastZoomKey, String(map.getZoom()));
        } catch (e) {}
        userInteractedRef.current = true;
      };

      const handleUserMove = () => {
        try {
          const center = map.getCenter();
          localStorage.setItem(lastCenterKey, JSON.stringify([center.lat, center.lng]));
        } catch (e) {}
        userInteractedRef.current = true;
      };

      map.on('zoomend', handleUserZoom);
      map.on('moveend', handleUserMove);

      // Create initial geofence
      createGeofence(map);

      return () => {
        map.off('zoomend', handleUserZoom);
        map.off('moveend', handleUserMove);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once

    // ---------- When gpsData first becomes available, fit bounds once automatically (if user hasn't interacted) ----------
    useEffect(() => {
      if (!mapInstanceRef.current) return;
      if (hasAutoFitRef.current) return; // already fitted once

      if (cattleData.length === 0) return;

      const bounds = L.latLngBounds(cattleData.map(c => [c.lat, c.lng] as L.LatLngTuple));
      if (!bounds.isValid()) return;

      // Only auto-fit if user hasn't interacted (so we don't override their zoom/pan)
      if (!userInteractedRef.current) {
        try {
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          hasAutoFitRef.current = true;
        } catch (e) {
          // ignore
        }
      }
      // If user has already interacted, do not change their view. Still mark that we attempted auto-fit so we don't try again.
      hasAutoFitRef.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gpsData.length]); // trigger when gpsData updates (length or new fetch)

    // ---------- Update markers immediately whenever gpsData changes (instant update) ----------
    useEffect(() => {
      if (!mapInstanceRef.current) return;
      const map = mapInstanceRef.current;

      const updateMarkers = () => {
        const seen = new Set<number>();

        cattleData.forEach(cattle => {
          seen.add(cattle.id);
          const existing = markersRef.current.get(cattle.id);

          // Use display jitter so overlapping identical coords remain visible
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

        // Remove markers that are no longer present
        markersRef.current.forEach((marker, id) => {
          if (!seen.has(id)) {
            map.removeLayer(marker);
            markersRef.current.delete(id);
          }
        });

        // Important: do NOT call fitBounds repeatedly here — that caused repeated zooming.
        // We only fit bounds once on first gpsData (handled above) unless user hasn't interacted.
      };

      // Instant update when gpsData changes
      updateMarkers();

      // Optional safety interval refresh (longer interval) - kept as a fallback (every 15s)
      const interval = setInterval(updateMarkers, 15000);
      return () => clearInterval(interval);
    }, [gpsData, highlightedCattleId]); // runs immediately when gpsData or highlighted cattle changes

    const createGeofence = (map: L.Map) => {
      if (geofenceRef.current) {
        map.removeLayer(geofenceRef.current);
      }

      // Use primary color from design system for geofence - make it more visible
      const polygon = L.polygon(geofenceBounds as L.LatLngExpression[], {
        color: 'hsl(140, 76%, 45%)',
        fillColor: 'hsl(140, 76%, 45%)',
        fillOpacity: 0.15,
        weight: 4,
        opacity: 0.9
      }).addTo(map);

      polygon.bindPopup('<div class="font-semibold text-farm-dark-green">Farm Geofence Boundary</div>');
      geofenceRef.current = polygon;
      
      console.log('Geofence created with bounds:', geofenceBounds);
    };

    const toggleGeofenceEdit = () => {
      if (!mapInstanceRef.current || !geofenceRef.current) return;

      const polygon = geofenceRef.current as any;

      if (isEditingGeofence) {
        // Save changes and disable editing
        const latLngs = (polygon.getLatLngs?.()[0] || []) as L.LatLng[];
        const newBounds = latLngs.map((ll: L.LatLng) => [ll.lat, ll.lng]);
        setGeofenceBounds(newBounds);
        try {
          localStorage.setItem(GEOFENCE_KEY, JSON.stringify(newBounds));
        } catch {}

        // Disable editing (Geoman fallback to Leaflet editing)
        if (polygon.pm?.disable) {
          polygon.pm.disable();
        } else if (polygon.editing?.disable) {
          polygon.editing.disable();
        }

        setIsEditingGeofence(false);
        toast.success('Geofence updated successfully');
      } else {
        // Enable editing mode (Geoman fallback to Leaflet editing)
        if (polygon.pm?.enable) {
          polygon.pm.enable({ allowSelfIntersection: false, draggable: true, snappable: true });
        } else if (polygon.editing?.enable) {
          polygon.editing.enable();
        }
        setIsEditingGeofence(true);
        toast.info('Click and drag the corners to edit the geofence');
      }
    };

    const cancelGeofenceEdit = () => {
      if (!mapInstanceRef.current || !geofenceRef.current) return;

      // @ts-ignore - Geoman PM API
      if (geofenceRef.current.pm) {
        // @ts-ignore
        geofenceRef.current.pm.disable();
      }

      setIsEditingGeofence(false);
      createGeofence(mapInstanceRef.current);
      toast.info('Geofence edit cancelled');
    };

    const getHealthColor = (health: string) => {
      switch (health) {
        case 'good': return 'bg-green-500';
        case 'fair': return 'bg-yellow-500';
        case 'alert': return 'bg-red-500 animate-pulse';
        default: return 'bg-gray-500';
      }
    };

    const handleCattleClick = (cattle: CattleData) => {
      setSelectedCattle(cattle);
      setIsModalOpen(true);
    };

    const handleSaveDetails = (details: any) => {
      const entry = {
        ...details,
        id: selectedCattle?.id as number,
        name: selectedCattle?.name as string,
        timestamp: Date.now(),
      };

      setCattleHistory((prev) => {
        const list = prev[entry.id] || [];
        const updated = { ...prev, [entry.id]: [...list, entry] };
        try {
          localStorage.setItem(CATTLE_HISTORY_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });

      toast.success(`Details saved for ${details.name}`);
    };

    // PDF Download for history table
    const handleDownloadPDF = () => {
      const entries = Object.values(cattleHistory).flat();
      const doc = new jsPDF();
      doc.text('Cattle Details History', 14, 16);
      autoTable(doc, {
        head: [['Name', 'Node', 'Weight', 'Color', 'Last Checkup', 'Health', 'Notes', 'Date']],
        body: entries.map((e) => [
          e.name || '-',
          String(e.id || '-'),
          e.weight != null ? `${e.weight} ${e.weightUnit || ''}`.trim() : '-',
          e.color || '-',
          e.lastCheckup || '-',
          e.healthStatus || '-',
          e.notes || '-',
          new Date(e.timestamp).toLocaleString(),
        ]),
        styles: { fontSize: 10 },
        startY: 22,
      });
      doc.save('cattle-history.pdf');
    };

    // Zoom to specific cattle location on map
    const handleGoToLocation = (cattle: CattleData) => {
      if (mapInstanceRef.current) {
        // Highlight this cattle
        setHighlightedCattleId(cattle.id);
        
        // Clear highlight after 5 seconds
        setTimeout(() => {
          setHighlightedCattleId(null);
        }, 5000);
        
        mapInstanceRef.current.setView([cattle.lat, cattle.lng], 18, {
          animate: true,
          duration: 1
        });
        // Open the marker popup
        const marker = markersRef.current.get(cattle.id);
        if (marker) {
          marker.openPopup();
        }
        toast.success(`Navigating to ${cattle.name}'s location`);
      }
    };

    // Zoom to geofence on map
    const handleGoToGeofence = () => {
      if (mapInstanceRef.current && geofenceBounds.length > 0) {
        const bounds = L.latLngBounds(geofenceBounds as L.LatLngExpression[]);
        mapInstanceRef.current.fitBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1
        });
        toast.info('Navigating to geofence boundary');
      }
    };

    // Keep total cattle for header
    const totalCattle = cattleData.length;

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-farm-dark-green to-farm-forest-green p-6 rounded-lg text-white shadow-lg">
          <h2 className="text-3xl font-bold mb-2">Cattle Tracking & Geofencing</h2>
          <p className="text-green-100">Real-time GPS monitoring of {totalCattle} cattle with geofence management</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="border-farm-medium-green/20 h-[700px] shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-farm-dark-green flex items-center gap-2 text-xl">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="text-base sm:text-xl">Live Location Map</span>
                  </CardTitle>
                  <div className="flex gap-2 flex-shrink-0">
                    {isEditingGeofence ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={toggleGeofenceEdit} 
                          className="bg-green-600 hover:bg-green-700 shadow-md"
                        >
                          <Save className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Save</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={cancelGeofenceEdit}
                          className="shadow-md"
                        >
                          <X className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Cancel</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleGoToGeofence}
                          className="shadow-md hover:bg-primary hover:text-primary-foreground transition-all"
                        >
                          <MapPin className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Go to Geofence</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={toggleGeofenceEdit}
                          className="shadow-md hover:bg-farm-dark-green hover:text-white transition-all"
                        >
                          <Edit2 className="w-4 h-4 sm:mr-1" />
                          <span className="hidden sm:inline">Edit Geofence</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {isEditingGeofence ? 'Drag the corners of the geofence to resize' : 'Click markers for detailed information'}
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div ref={mapRef} className="w-full h-[620px] rounded-b-lg relative z-0"></div>
              </CardContent>
            </Card>
          </div>

          {/* Cattle List */}
          <div className="space-y-4">
            <Card className="border-farm-medium-green/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-farm-dark-green text-lg">Cattle Status</CardTitle>
                <p className="text-sm text-muted-foreground">Click to view/edit details</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {cattleData.map(cattle => (
                  <div 
                    key={cattle.id} 
                    className="p-4 border-2 rounded-lg space-y-3 bg-card border-border"
                  >
                    <div 
                      className="cursor-pointer transition-all hover:opacity-80"
                      onClick={() => handleCattleClick(cattle)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: NODE_COLORS[cattle.id % NODE_COLORS.length] }}
                            aria-hidden="true"
                          ></span>
                          <h3 className="font-bold text-farm-dark-green dark:text-green-400">{cattle.name}</h3>
                          <span className="text-sm text-muted-foreground">📡 Node {cattle.nodeId}</span>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${getHealthColor(cattle.health)}`}></div>
                      </div>
                      {cattleHistory[cattle.id]?.length ? (
                        <p className="text-xs text-muted-foreground mt-2">
                          Latest: {cattleHistory[cattle.id][cattleHistory[cattle.id].length - 1].weight ?? '-'}
                          {cattleHistory[cattle.id][cattleHistory[cattle.id].length - 1].weightUnit ? ` ${cattleHistory[cattle.id][cattleHistory[cattle.id].length - 1].weightUnit}` : ''}
                          {' '}• {cattleHistory[cattle.id][cattleHistory[cattle.id].length - 1].healthStatus || 'N/A'}
                          {' '}• {cattleHistory[cattle.id][cattleHistory[cattle.id].length - 1].lastCheckup || 'No checkup'}
                        </p>
                      ) : null}
                      
                      <div className="space-y-1 text-sm text-muted-foreground mt-3">
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>{cattle.lat.toFixed(6)}, {cattle.lng.toFixed(6)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-medium">
                            {cattle.lastUpdate && cattle.lastUpdate !== 'No recent data' 
                              ? cattle.lastUpdate 
                              : 'No recent data'}
                          </span>
                        </div>
                        <div className={`text-xs font-medium ${isNodeOnline(cattle.nodeId) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isNodeOnline(cattle.nodeId) ? '🟢 GPS Online' : '🔴 GPS Offline'}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGoToLocation(cattle);
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Go to Location
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button
              className="w-full bg-farm-dark-green hover:bg-farm-medium-green transition-all shadow-md"
              onClick={handleDownloadPDF}
            >
              Download Cattle History PDF
            </Button>
          </div>
        </div>

        {/* Cattle Detail Modal */}
        {selectedCattle && (
          <CattleDetailModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            cattle={selectedCattle}
            onSave={handleSaveDetails}
          />
        )}
      </div>
    );
  };

  export default CattleTracker;
