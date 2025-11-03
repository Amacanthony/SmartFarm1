import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Droplets, Thermometer, Wind, MapPin, Activity, Beef } from "lucide-react";
import { useSensorData } from '@/hooks/useSensorData';

const Analytics = () => {
  const { sensorData, gpsData, greenhouseData, getStats, isNodeOnline, isLoading, error } = useSensorData();

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 rounded-2xl text-primary-foreground shadow-2xl">
          <h2 className="text-4xl font-bold mb-3">Farm Analytics</h2>
          <p className="text-primary-foreground/90 text-lg">Real-time insights from your smart farm sensors</p>
        </div>
        <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-lg">
          <span className="text-destructive">Error loading analytics data: {error.message}</span>
        </div>
      </div>
    );
  }

  if (isLoading || sensorData.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 rounded-2xl text-primary-foreground shadow-2xl">
          <h2 className="text-4xl font-bold mb-3">Farm Analytics</h2>
          <p className="text-primary-foreground/90 text-lg">Real-time insights from your smart farm sensors</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
          <span className="text-blue-600 dark:text-blue-400">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  const stats = getStats();

  // Cattle data preparation
  const cattleNames = ['Bessie', 'Daisy', 'Moobert', 'Luna'];
  const cattleNodeIds = [5, 6, 8, 9];
  
  const cattleStats = cattleNodeIds.map((nodeId, index) => {
    const gpsNode = gpsData.find(g => g.node_id === nodeId);
    const online = isNodeOnline(nodeId);
    return {
      name: cattleNames[index],
      nodeId: nodeId,
      online: online,
      lat: gpsNode?.latitude || 0,
      lng: gpsNode?.longitude || 0,
      speed: gpsNode?.speed || 0,
      status: online ? (gpsNode?.speed && gpsNode.speed > 0.5 ? 'Moving' : 'Grazing') : 'Resting'
    };
  });

  const cattleStatusData = [
    { name: 'Online', value: cattleStats.filter(c => c.online).length, color: '#22c55e' },
    { name: 'Offline', value: cattleStats.filter(c => !c.online).length, color: '#ef4444' }
  ];

  const cattleActivityData = cattleStats.map(c => ({
    name: c.name,
    activity: c.online ? (c.speed > 0.5 ? 100 : c.speed > 0.1 ? 60 : 30) : 0,
    fullMark: 100
  }));

  // Prepare data for charts
  const recentData = sensorData.slice(0, 24).reverse();
  const dailyTrends = recentData.map((d) => ({
    time: new Date(d.timestamp * 1000).getHours() + ':00',
    temperature: greenhouseData?.temperature || 0,
    humidity: greenhouseData?.humidity || 0,
    moisture: d.values[0] || 0
  }));

  const nodeComparison = [1, 2, 3, 4].map(nodeId => {
    const nodeData = sensorData.find(d => d.node_id === nodeId);
    const moisture = nodeData?.values[0] || 0;
    return {
      node: `Node ${nodeId}`,
      moisture: moisture,
      fill: moisture > 70 ? 'hsl(var(--primary))' : moisture > 30 ? '#f59e0b' : '#ef4444'
    };
  });

  const statusDistribution = [
    { 
      name: 'Optimal', 
      value: nodeComparison.filter(n => n.moisture > 70).length,
      color: 'hsl(var(--primary))'
    },
    { 
      name: 'Warning', 
      value: nodeComparison.filter(n => n.moisture > 30 && n.moisture <= 70).length,
      color: '#f59e0b'
    },
    { 
      name: 'Critical', 
      value: nodeComparison.filter(n => n.moisture <= 30).length,
      color: '#ef4444'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 rounded-2xl text-primary-foreground shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] -z-10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-3 flex items-center gap-3">
            <TrendingUp className="w-10 h-10" />
            Farm Analytics
          </h2>
          <p className="text-primary-foreground/90 text-lg">Real-time insights from your smart farm sensors</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soil Nodes</CardTitle>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.activeMoistureNodes}/{stats.totalMoistureNodes}</div>
            <p className="text-xs text-muted-foreground mt-1">Active nodes</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Soil Moisture</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Math.round(stats.avgSoilMoisture)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Average level</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Temperature</CardTitle>
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Math.round(stats.greenhouseTemperature)}°C</div>
            <p className="text-xs text-muted-foreground mt-1">Greenhouse</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Humidity</CardTitle>
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Wind className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{Math.round(stats.greenhouseHumidity)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Current level</p>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cattle Online</CardTitle>
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <Beef className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.gpsNodesOnline}/4</div>
            <p className="text-xs text-muted-foreground mt-1">GPS tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cattle Activity Radar */}
        <Card className="border-green-500/20 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              Cattle Activity Levels
            </CardTitle>
            <p className="text-sm text-muted-foreground">Movement patterns</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={cattleActivityData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '10px' }}
                />
                <Radar 
                  name="Activity" 
                  dataKey="activity" 
                  stroke="#22c55e" 
                  fill="#22c55e" 
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cattle Status Pie */}
        <Card className="border-green-500/20 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              Cattle GPS Status
            </CardTitle>
            <p className="text-sm text-muted-foreground">Real-time tracking</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cattleStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {cattleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {cattleStats.map(cattle => (
                <div key={cattle.nodeId} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">{cattle.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${cattle.online ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                    {cattle.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environmental Trends */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-primary" />
              Environmental Trends
            </CardTitle>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  fill="url(#colorTemp)"
                  name="Temperature (°C)"
                />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fill="url(#colorHumidity)"
                  name="Humidity (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Soil Moisture Comparison */}
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-2xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Droplets className="w-5 h-5 text-primary" />
              Soil Moisture by Node
            </CardTitle>
            <p className="text-sm text-muted-foreground">Current readings</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={nodeComparison}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="node" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar 
                  dataKey="moisture" 
                  fill="url(#barGradient)"
                  name="Moisture (%)"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights Section */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-foreground text-xl">System Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 bg-primary/10 border border-primary/20 rounded-xl space-y-2 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground">Soil Monitoring</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.activeMoistureNodes} of {stats.totalMoistureNodes} nodes actively monitoring soil conditions.
              </p>
            </div>
            <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h4 className="font-semibold text-foreground">Climate Control</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Greenhouse at {Math.round(stats.greenhouseTemperature)}°C with {Math.round(stats.greenhouseHumidity)}% humidity.
              </p>
            </div>
            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="font-semibold text-foreground">Soil Health</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Average moisture level of {Math.round(stats.avgSoilMoisture)}% across all monitoring points.
              </p>
            </div>
            <div className="p-5 bg-green-500/10 border border-green-500/20 rounded-xl space-y-2 hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Beef className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-semibold text-foreground">Cattle Tracking</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.gpsNodesOnline} of 4 cattle tracked with GPS. {cattleStats.filter(c => c.status === 'Moving').length} currently moving.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;