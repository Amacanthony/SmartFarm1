
import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Satellite, Clock } from "lucide-react";
import { GPSData } from '@/hooks/useSensorData';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPSMapProps {
  gpsData: GPSData[];
  isNodeOnline: (nodeId: number) => boolean;
}

const GPSMap = ({ gpsData, isNodeOnline }: GPSMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString()
    };
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  // Create cattle data from GPS data
  const createCattleData = () => {
    return gpsData.map((gps) => ({
      id: 100 + gps.node_id,
      name: `GPS Tracker ${gps.node_id}`,
      lat: gps.latitude,
      lng: gps.longitude,
      status: isNodeOnline(gps.node_id) ? 'moving' : 'resting' as 'moving' | 'resting',
      lastUpdate: new Date(gps.timestamp * 1000).toLocaleString(),
      health: isNodeOnline(gps.node_id) ? 'good' : 'alert' as 'good' | 'alert',
      isGPSTracked: true,
      nodeId: gps.node_id
    }));
  };

  useEffect(() => {
    if (!mapRef.current || !gpsData.length) return;
    
    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize map with the first GPS location
    const map = L.map(mapRef.current).setView([gpsData[0].latitude, gpsData[0].longitude], 14);
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Create custom cow icons for different statuses
    const createIcon = (status: string, health: string) => {
      let color = '#ef4444'; // default red for offline/alert
      if (status === 'moving' && health === 'good') {
        color = '#22c55e'; // green for moving and healthy
      } else if (status === 'resting' && health === 'good') {
        color = '#3b82f6'; // blue for resting and healthy
      }
      
      // Beautiful cow icon with dynamic color
      const iconHtml = `
        <div style="position: relative; width: 36px; height: 36px;">
          <div style="
            background-color: ${color}; 
            width: 36px; 
            height: 36px; 
            border-radius: 50%; 
            border: 3px solid white; 
            box-shadow: 0 4px 8px rgba(0,0,0,0.3); 
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-size: 20px;
          ">🐄</div>
        </div>
      `;
      
      return L.divIcon({
        className: 'custom-div-icon',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
    };

    // Add cattle markers from GPS data
    const cattleData = createCattleData();
    cattleData.forEach(cattle => {
      const marker = L.marker([cattle.lat, cattle.lng], {
        icon: createIcon(cattle.status, cattle.health)
      }).addTo(map);

      const popupContent = `
        <div class="p-2">
          <h3 class="font-bold text-lg">${cattle.name}</h3>
          <p class="text-sm text-gray-600">Status: ${cattle.status}</p>
          <p class="text-sm text-gray-600">Health: ${cattle.health}</p>
          <p class="text-sm text-gray-600">Last seen: ${cattle.lastUpdate}</p>
          <p class="text-sm text-blue-600">📡 GPS Node ${cattle.nodeId}</p>
          <p class="text-sm text-gray-600">Coordinates: ${formatCoordinates(cattle.lat, cattle.lng)}</p>
        </div>
      `;
      marker.bindPopup(popupContent);
    });

    // Fit map bounds to show all markers if multiple GPS points
    if (gpsData.length > 1) {
      const group = L.featureGroup(
        gpsData.map(gps => L.marker([gps.latitude, gps.longitude]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [gpsData, isNodeOnline]);

  return (
    <Card className="border-farm-medium-green/20">
      <CardHeader>
        <CardTitle className="text-xl text-farm-dark-green flex items-center gap-2">
          <Satellite className="w-5 h-5" />
          Live Location Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gpsData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>No GPS data available</p>
          </div>
        ) : (
          <>
            {/* GPS Coordinates Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {gpsData.map(gps => {
                const online = isNodeOnline(gps.node_id);
                const { time, date } = formatTimestamp(gps.timestamp);
                
                return (
                  <div 
                    key={gps.node_id} 
                    className={`p-4 rounded-lg border-2 ${
                      online ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${online ? 'text-green-600' : 'text-red-600'}`} />
                        <span className="font-semibold text-farm-dark-green">
                          GPS Node {gps.node_id}
                        </span>
                      </div>
                      <Badge className={online ? 'bg-green-500' : 'bg-red-500'}>
                        {online ? '🟢 Online' : '🔴 Offline'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Coordinates:</span>
                        <br />
                        <span className="font-mono text-farm-dark-green">
                          {formatCoordinates(gps.latitude, gps.longitude)}
                        </span>
                      </div>
                      
                      {gps.altitude && (
                        <div className="text-sm">
                          <span className="text-gray-600">Altitude:</span>
                          <span className="ml-2 font-medium">{gps.altitude.toFixed(1)}m</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>{time} - {date}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* OpenStreetMap with Cattle Visualization */}
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="text-center text-gray-600 p-2 bg-white border-b">
                <h4 className="font-medium text-sm">Live Cattle Tracking Map</h4>
                <p className="text-xs">🟢 Moving & Healthy • 🔵 Resting & Healthy • 🔴 Offline/Alert</p>
              </div>
              <div ref={mapRef} className="w-full h-[400px]"></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GPSMap;
