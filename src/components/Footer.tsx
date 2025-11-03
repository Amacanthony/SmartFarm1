import React from 'react';
import { Leaf, Droplets, Thermometer } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary via-primary/90 to-primary border-t-2 border-primary-foreground/20 py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-primary-foreground">
              <Leaf className="h-5 w-5" />
              <span className="font-bold text-lg">NCAIR Smart Farm</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-primary-foreground/80 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4" />
              <span>Climate Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span>Soil Analysis</span>
            </div>
          </div>
          
          <div className="text-primary-foreground/90 text-sm font-medium">
            © 2025 NCAIR Smart Farm
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
