
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Gauge, AlertTriangle } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';
import MoistureNodes from '@/components/MoistureNodes';

const SensorNodes = () => {
  const { greenhouseData, isLoading, error } = useSensorData();

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-r from-farm-dark-green to-farm-forest-green p-6 rounded-lg text-white">
          <h2 className="text-3xl font-bold mb-2">Sensor Node Monitoring</h2>
          <p className="text-green-100">Real-time status of moisture sensors</p>
        </div>
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">Failed to connect to sensor API: {error.message}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-farm-dark-green to-farm-forest-green p-6 rounded-lg text-white">
        <h2 className="text-3xl font-bold mb-2">Sensor Node Monitoring</h2>
        <p className="text-green-100">Real-time status of moisture sensors</p>
        {isLoading && <p className="text-green-200 text-sm">Loading sensor data...</p>}
      </div>

      {/* Greenhouse Climate Summary */}
      {greenhouseData && (
        <Card className="border-farm-medium-green/20">
          <CardHeader>
            <CardTitle className="text-xl text-farm-dark-green flex items-center gap-2">
              <Gauge className="w-5 h-5" />
              Greenhouse Climate (Node 7)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <Thermometer className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-farm-dark-green">
                    {Math.round(greenhouseData.temperature)}°C
                  </div>
                  <div className="text-sm text-gray-600">Temperature</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 text-blue-500 text-2xl">💧</div>
                <div>
                  <div className="text-2xl font-bold text-farm-dark-green">
                    {Math.round(greenhouseData.humidity)}%
                  </div>
                  <div className="text-sm text-gray-600">Humidity</div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Last updated: {new Date(greenhouseData.timestamp * 1000).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moisture Sensor Nodes */}
      <div>
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-farm-dark-green">Soil Moisture Sensors (Nodes 1-4)</h3>
          <p className="text-gray-600">Each node has 2 soil moisture sensor slots</p>
        </div>
        <MoistureNodes />
      </div>
    </div>
  );
};

export default SensorNodes;
