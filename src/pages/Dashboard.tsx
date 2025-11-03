
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Thermometer, Droplets, Wifi, AlertTriangle, Satellite } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';

const Dashboard = () => {
  const navigate = useNavigate();
  const { sensorData, gpsData, greenhouseData, getSoilMoisture, isNodeOnline, getStats, isLoading, error } = useSensorData();
  const stats = getStats();

  // Prepare greenhouse climate data for chart
  const climateData = greenhouseData ? [
    {
      time: new Date(greenhouseData.timestamp * 1000).toLocaleTimeString(),
      temperature: greenhouseData.temperature,
      humidity: greenhouseData.humidity
    }
  ] : [];

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700">
            Failed to connect to sensor API: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-farm-dark-green to-farm-forest-green p-6 rounded-lg text-white shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Smart Farm Overview</h2>
        <p className="text-green-100">Real-time monitoring of moisture nodes, GPS trackers, and greenhouse climate</p>
        {isLoading && <p className="text-green-200 text-sm">Loading sensor data...</p>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="border-farm-medium-green/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/sensors')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Moisture Nodes</CardTitle>
            <Wifi className="h-5 w-5 text-farm-medium-green" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-farm-dark-green">{stats.activeMoistureNodes}</div>
            <p className="text-xs text-green-600 mt-1">Soil sensors active</p>
          </CardContent>
        </Card>

        <Card 
          className="border-farm-medium-green/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/cattle')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">GPS Trackers</CardTitle>
            <Satellite className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-farm-dark-green">{stats.gpsNodesOnline}/4</div>
            <p className="text-xs text-green-600 mt-1">Online trackers</p>
          </CardContent>
        </Card>

        <Card className="border-farm-medium-green/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">🌡️ Temperature</CardTitle>
            <Thermometer className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-farm-dark-green">{Math.round(stats.greenhouseTemperature)}°C</div>
            <p className="text-xs text-green-600 mt-1">Greenhouse</p>
          </CardContent>
        </Card>

        <Card className="border-farm-medium-green/20 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">💧 Humidity</CardTitle>
            <Droplets className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-farm-dark-green">{Math.round(stats.greenhouseHumidity)}%</div>
            <p className="text-xs text-green-600 mt-1">Greenhouse</p>
          </CardContent>
        </Card>
      </div>

      {/* Moisture Nodes Summary */}
      <Card className="border-farm-medium-green/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-farm-dark-green">Soil Moisture Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(nodeId => {
              const online = isNodeOnline(nodeId);
              const sensor1 = getSoilMoisture(nodeId, 1);
              const sensor2 = getSoilMoisture(nodeId, 2);

              return (
                <div key={nodeId} className={`p-4 rounded-lg border-2 transition-all duration-300 ${online ? 'border-green-300 bg-green-50 dark:bg-green-900/20 hover:shadow-lg' : 'border-red-300 bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg text-farm-dark-green dark:text-green-400">Node {nodeId}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${online ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                      {online ? '🟢 Online' : '🔴 Offline'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Sensor 1:</span>
                      <span className="font-bold text-farm-dark-green dark:text-green-400">{Math.round(sensor1)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">Sensor 2:</span>
                      <span className="font-bold text-farm-dark-green dark:text-green-400">{Math.round(sensor2)}%</span>
                    </div>
                  </div>
                  {(sensor1 < 30 || sensor2 < 30) && (
                    <div className="mt-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-1 font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Low moisture detected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Greenhouse Climate Chart */}
      <Card className="border-farm-medium-green/20 shadow-md">
        <CardHeader>
          <CardTitle className="text-farm-dark-green">Greenhouse Climate Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          {climateData.length > 0 && greenhouseData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-700 transition-all duration-300 hover:shadow-lg">
                <Thermometer className="w-16 h-16 mx-auto mb-3 text-red-500" />
                <div className="text-5xl font-bold text-red-600 dark:text-red-400">{Math.round(greenhouseData.temperature)}°C</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">Current Temperature</div>
              </div>
              <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-700 transition-all duration-300 hover:shadow-lg">
                <div className="text-5xl mb-3">💧</div>
                <div className="text-5xl font-bold text-blue-600 dark:text-blue-400">{Math.round(greenhouseData.humidity)}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-medium">Current Humidity</div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              {isLoading ? 'Loading climate data...' : 'No greenhouse climate data available'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
