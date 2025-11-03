
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droplets, Wifi, AlertTriangle } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';

const MoistureNodes = () => {
  const { getSoilMoisture, isNodeOnline, getLatestByNode } = useSensorData();

  const getMoistureStatusColor = (value: number) => {
    if (value > 70) return 'bg-green-500';
    if (value > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getMoistureStatusText = (value: number) => {
    if (value > 70) return 'Optimal';
    if (value > 30) return 'Low';
    return 'Critical';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(nodeId => {
        const online = isNodeOnline(nodeId);
        const nodeData = getLatestByNode(nodeId);
        const sensor1Value = getSoilMoisture(nodeId, 1);
        const sensor2Value = getSoilMoisture(nodeId, 2);
        const lastUpdate = nodeData ? new Date(nodeData.timestamp * 1000).toLocaleTimeString() : 'No data';

        return (
          <Card key={nodeId} className="border-farm-medium-green/20 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-farm-dark-green flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Moisture Node {nodeId}
                </CardTitle>
                <Badge className={online ? 'bg-green-500' : 'bg-red-500'}>
                  {online ? '🟢 Online' : '🔴 Offline'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">Last update: {lastUpdate}</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Sensor Slot 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Soil Sensor 1</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-farm-dark-green">{Math.round(sensor1Value)}%</span>
                    <Badge className={`${getMoistureStatusColor(sensor1Value)} text-white`}>
                      {getMoistureStatusText(sensor1Value)}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getMoistureStatusColor(sensor1Value)}`}
                    style={{ width: `${sensor1Value}%` }}
                  ></div>
                </div>
              </div>

              {/* Sensor Slot 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Soil Sensor 2</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-farm-dark-green">{Math.round(sensor2Value)}%</span>
                    <Badge className={`${getMoistureStatusColor(sensor2Value)} text-white`}>
                      {getMoistureStatusText(sensor2Value)}
                    </Badge>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${getMoistureStatusColor(sensor2Value)}`}
                    style={{ width: `${sensor2Value}%` }}
                  ></div>
                </div>
              </div>

              {/* Alerts */}
              {(sensor1Value < 30 || sensor2Value < 30) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    Critical moisture level detected. Immediate attention required.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MoistureNodes;
