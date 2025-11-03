
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Save, Key, Bell, Wifi, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState('30');

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your configuration has been updated successfully.",
    });
  };

  const handleConnectSupabase = () => {
    toast({
      title: "Supabase Integration",
      description: "Please connect to Supabase using the green button in the top right corner for backend functionality.",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-farm-dark-green to-farm-forest-green p-6 rounded-lg text-white">
        <h2 className="text-3xl font-bold mb-2">System Settings</h2>
        <p className="text-green-100">Configure your NCAIR Smart Farm monitoring system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Configuration */}
        <Card className="border-farm-medium-green/20">
          <CardHeader>
            <CardTitle className="text-farm-dark-green flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">Flask API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Flask API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-600">
                This key is used to authenticate with your ESP32 Flask API endpoint
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apiEndpoint">API Endpoint URL</Label>
              <Input
                id="apiEndpoint"
                placeholder="http://your-esp32-ip:5000"
                defaultValue="http://localhost:5000"
              />
            </div>

            <Alert className="border-farm-medium-green bg-farm-light-green">
              <Wifi className="h-4 w-4 text-farm-medium-green" />
              <AlertDescription>
                Ensure your ESP32 is connected to the same network and the Flask API is running on the specified endpoint.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-farm-medium-green/20">
          <CardHeader>
            <CardTitle className="text-farm-dark-green flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Enable Notifications</Label>
                <p className="text-sm text-gray-600">Receive alerts for system events</p>
              </div>
              <Switch
                id="notifications"
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoRefresh">Auto Refresh</Label>
                <p className="text-sm text-gray-600">Automatically update sensor data</p>
              </div>
              <Switch
                id="autoRefresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="refreshInterval">Refresh Interval</Label>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Database Integration */}
        <Card className="border-farm-medium-green/20">
          <CardHeader>
            <CardTitle className="text-farm-dark-green flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <Database className="h-4 w-4 text-blue-500" />
              <AlertDescription>
                For complete backend functionality including data storage, authentication, and advanced analytics, 
                connect your project to Supabase using the integration button.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleConnectSupabase}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Connect to Supabase
            </Button>

            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Benefits of Supabase integration:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Real-time data storage and retrieval</li>
                <li>User authentication and authorization</li>
                <li>Advanced analytics and reporting</li>
                <li>API key management and security</li>
                <li>Automated backup and data retention</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="border-farm-medium-green/20">
          <CardHeader>
            <CardTitle className="text-farm-dark-green flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Version:</span>
                <span className="ml-2 font-medium">1.0.0</span>
              </div>
              <div>
                <span className="text-gray-600">Nodes:</span>
                <span className="ml-2 font-medium">6 Active</span>
              </div>
              <div>
                <span className="text-gray-600">Cattle:</span>
                <span className="ml-2 font-medium">5 Tracked</span>
              </div>
              <div>
                <span className="text-gray-600">Uptime:</span>
                <span className="ml-2 font-medium">99.8%</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-farm-dark-green mb-2">API Endpoints</h4>
              <div className="space-y-1 text-xs font-mono bg-gray-50 p-3 rounded">
                <div>GET /grade/criteria/all</div>
                <div>GET /action/instructions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveSettings}
          className="bg-farm-medium-green hover:bg-farm-bright-green"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;
