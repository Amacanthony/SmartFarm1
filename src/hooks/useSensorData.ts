
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface SensorData {
  timestamp: number;
  node_id: number;
  values: (number | null)[];
  distance: number | null;
  in_geofence: string | null;
}

export interface GPSData {
  node_id: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
  course?: number;
  last_seen: number;
}

export interface GreenhouseData {
  temperature: number;
  humidity: number;
  timestamp: number;
}

export interface SensorStats {
  totalMoistureNodes: number;
  activeMoistureNodes: number;
  avgSoilMoisture: number;
  onlineNodes: number;
  greenhouseTemperature: number;
  greenhouseHumidity: number;
  gpsNodesOnline: number;
}

// Configuration - UPDATE THESE SETTINGS TO MATCH YOUR FLASK SERVER
const API_CONFIG = {
  BASE_URL: 'https://smart-farm-test.onrender.com', // Change this to your Flask server IP address
  API_KEY: 'supersecure123', // Your Flask API key - change this to match your server
  ENDPOINTS: {
    SENSOR_DATA: '/api/sensor-data', // Using the new endpoint that returns all data
    INSTRUCTIONS: '/action/instructions'
  }
};

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [gpsData, setGpsData] = useState<GPSData[]>([]);
  
  // Initialize greenhouse data from localStorage to persist last values
  const [greenhouseData, setGreenhouseData] = useState<GreenhouseData | null>(() => {
    const stored = localStorage.getItem('lastGreenhouseData');
    return stored ? JSON.parse(stored) : null;
  });

  // Fetch sensor data from your Flask API
  const { data: apiData, isLoading, error } = useQuery({
    queryKey: ['sensorData'],
    queryFn: async () => {
      console.log('Fetching data from:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENSOR_DATA}`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SENSOR_DATA}?limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_CONFIG.API_KEY // Using header authentication as per your Flask server
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch sensor data: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('API Response:', result);
      return result;
    },
    refetchInterval: 2000, // Refetch every 2 seconds for instant updates
    retry: 3,
    retryDelay: 5000
  });

  useEffect(() => {
    if (apiData && apiData.status === 'success' && apiData.data) {
      console.log('Processing sensor data:', apiData.data);
      
      const processedData: SensorData[] = Array.isArray(apiData.data) ? apiData.data : [apiData.data];
      const moistureSensors: SensorData[] = [];
      const gpsNodes: GPSData[] = [];
      let greenhouseInfo: GreenhouseData | null = null;

      processedData.forEach(data => {
        // Nodes 1-4: Soil moisture sensors
        if (data.node_id >= 1 && data.node_id <= 4) {
          moistureSensors.push(data);
        }
        // Nodes 5, 6, 8, 9: GPS nodes
        else if (data.node_id === 5 || data.node_id === 6 || data.node_id === 8 || data.node_id === 9) {
          if (data.values && data.values.length >= 2) {
            gpsNodes.push({
              node_id: data.node_id,
              latitude: data.values[0] || 0,
              longitude: data.values[1] || 0,
              timestamp: data.timestamp,
              altitude: data.values[2] || undefined,
              speed: data.values[3] || undefined,
              course: data.values[4] || undefined,
              last_seen: Date.now()
            });
          }
        }
        // Node 7: Greenhouse climate
        else if (data.node_id === 7) {
          if (data.values && data.values.length >= 2) {
            greenhouseInfo = {
              temperature: data.values[0] || 0,
              humidity: data.values[1] || 0,
              timestamp: data.timestamp
            };
          }
        }
      });

      setSensorData(moistureSensors);
      setGpsData(gpsNodes);
      if (greenhouseInfo) {
        setGreenhouseData(greenhouseInfo);
        // Persist to localStorage for future sessions
        localStorage.setItem('lastGreenhouseData', JSON.stringify(greenhouseInfo));
      }

      console.log('Processed data:', {
        moisture: moistureSensors.length,
        gps: gpsNodes.length,
        greenhouse: !!greenhouseInfo
      });
    }
  }, [apiData]);

  const getLatestByNode = (nodeId: number): SensorData | undefined => {
    const nodeData = sensorData.filter(d => d.node_id === nodeId);
    return nodeData.length > 0 ? nodeData[nodeData.length - 1] : undefined;
  };

  const getSoilMoisture = (nodeId: number, sensorSlot: 1 | 2): number => {
    const nodeData = getLatestByNode(nodeId);
    if (!nodeData || !nodeData.values) return 0;
    
    // Sensor 1 is at index 0, Sensor 2 is at index 1
    return nodeData.values[sensorSlot - 1] || 0;
  };

  const isNodeOnline = (nodeId: number): boolean => {
    const OFFLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
    const currentTime = Date.now();
    
    if (nodeId >= 1 && nodeId <= 4) {
      const nodeData = getLatestByNode(nodeId);
      if (!nodeData) return false;
      return (currentTime - (nodeData.timestamp * 1000)) < OFFLINE_THRESHOLD;
    } else if (nodeId === 5 || nodeId === 6 || nodeId === 8 || nodeId === 9) {
      const gpsNode = gpsData.find(g => g.node_id === nodeId);
      if (!gpsNode) return false;
      return (currentTime - gpsNode.last_seen) < OFFLINE_THRESHOLD;
    } else if (nodeId === 7) {
      if (!greenhouseData) return false;
      return (currentTime - (greenhouseData.timestamp * 1000)) < OFFLINE_THRESHOLD;
    }
    
    return false;
  };

  const getStats = (): SensorStats => {
    const onlineMoistureNodes = [1, 2, 3, 4].filter(nodeId => isNodeOnline(nodeId)).length;
    const onlineGpsNodes = [5, 6, 8, 9].filter(nodeId => isNodeOnline(nodeId)).length;
    const onlineGreenhouseNode = isNodeOnline(7) ? 1 : 0;

    // Calculate average soil moisture across all sensors
    const allMoistureValues: number[] = [];
    [1, 2, 3, 4].forEach(nodeId => {
      const sensor1 = getSoilMoisture(nodeId, 1);
      const sensor2 = getSoilMoisture(nodeId, 2);
      if (sensor1 > 0) allMoistureValues.push(sensor1);
      if (sensor2 > 0) allMoistureValues.push(sensor2);
    });

    const avgSoilMoisture = allMoistureValues.length > 0 
      ? allMoistureValues.reduce((sum, val) => sum + val, 0) / allMoistureValues.length 
      : 0;

    return {
      totalMoistureNodes: 4,
      activeMoistureNodes: onlineMoistureNodes,
      avgSoilMoisture: Math.round(avgSoilMoisture),
      onlineNodes: onlineMoistureNodes + onlineGpsNodes + onlineGreenhouseNode,
      greenhouseTemperature: greenhouseData?.temperature || 0,
      greenhouseHumidity: greenhouseData?.humidity || 0,
      gpsNodesOnline: onlineGpsNodes
    };
  };

  return {
    sensorData,
    gpsData,
    greenhouseData,
    getLatestByNode,
    getSoilMoisture,
    isNodeOnline,
    getStats,
    isLoading,
    error: error as Error | null
  };
};
