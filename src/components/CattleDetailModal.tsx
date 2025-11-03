import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface CattleDetails {
  id: number;
  name: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  color: string;
  lastCheckup: Date | null;
  healthStatus: string;
  notes: string;
}

interface CattleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cattle: {
    id: number;
    name: string;
    nodeId?: number;
    lat: number;
    lng: number;
    status: string;
    health: string;
    lastUpdate: string;
  };
  onSave: (details: CattleDetails) => void;
}

const CattleDetailModal: React.FC<CattleDetailModalProps> = ({ isOpen, onClose, cattle, onSave }) => {
  const [weight, setWeight] = useState<number>(450);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [color, setColor] = useState<string>('Brown and White');
  const [lastCheckup, setLastCheckup] = useState<Date | null>(new Date());
  const [healthStatus, setHealthStatus] = useState<string>('healthy');
  const [notes, setNotes] = useState<string>('');

  const handleSave = () => {
    onSave({
      id: cattle.id,
      name: cattle.name,
      weight,
      weightUnit,
      color,
      lastCheckup,
      healthStatus,
      notes,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-farm-dark-green">{cattle.name}</DialogTitle>
          <DialogDescription>
            GPS Node {cattle.nodeId || 'N/A'} • Location: {cattle.lat.toFixed(4)}, {cattle.lng.toFixed(4)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Weight Section */}
          <div className="space-y-2">
            <Label htmlFor="weight" className="text-base font-semibold">Weight</Label>
            <div className="flex gap-2">
              <Input
                id="weight"
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="flex-1"
              />
              <Select value={weightUnit} onValueChange={(value: 'kg' | 'lbs') => setWeightUnit(value)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color Section */}
          <div className="space-y-2">
            <Label htmlFor="color" className="text-base font-semibold">Color / Appearance</Label>
            <Input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g., Brown and White, Black, Holstein"
            />
          </div>

          {/* Last Checkup Date */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Last Checkup Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastCheckup ? format(lastCheckup, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={lastCheckup || undefined}
                  onSelect={(date) => setLastCheckup(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Health Status */}
          <div className="space-y-2">
            <Label htmlFor="healthStatus" className="text-base font-semibold">Health Status</Label>
            <Select value={healthStatus} onValueChange={setHealthStatus}>
              <SelectTrigger id="healthStatus">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="good">Good</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="needs-attention">Needs Attention</SelectItem>
                <SelectItem value="under-treatment">Under Treatment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes Section */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-base font-semibold">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional observations, treatments, or notes..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Current Status Info */}
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
            <h4 className="font-semibold text-farm-dark-green">Current Status</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{cattle.status}</span>
              </div>
              <div>
                <span className="text-gray-600">Health:</span>
                <span className="ml-2 font-medium capitalize">{cattle.health}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Last Update:</span>
                <span className="ml-2 font-medium">{cattle.lastUpdate}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-farm-dark-green hover:bg-farm-forest-green">
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CattleDetailModal;
