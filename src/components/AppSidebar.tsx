
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Waves, 
  MapPin, 
  TrendingUp,
  Info
} from "lucide-react";
import logo from "@/assets/logo.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Sensor Nodes",
    url: "/sensors",
    icon: Waves,
  },
  {
    title: "Cattle Tracker",
    url: "/cattle",
    icon: MapPin,
  },
  {
    title: "About",
    url: "/about",
    icon: Info,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: TrendingUp,
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <Sidebar className="bg-sidebar border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt="NCAIR Logo" className="w-12 h-12 object-contain" />
          <div>
            <h2 className="text-lg font-bold text-sidebar-foreground">NCAIR</h2>
            <p className="text-xs text-sidebar-foreground/70 uppercase tracking-wide">Smart Farm</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  className={`w-full transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary text-primary-foreground rounded-full shadow-lg' 
                      : 'text-sidebar-foreground hover:bg-gray-800 hover:text-white dark:hover:bg-gray-700 rounded-lg'
                  }`}
                >
                  <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
