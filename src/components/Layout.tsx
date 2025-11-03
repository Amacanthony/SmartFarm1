
import React from 'react';
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-primary hover:text-primary/80" />
          <h1 className="text-2xl font-bold text-primary">NCAIR Smart Farm</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">System Online</span>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative inline-flex h-10 w-20 items-center rounded-full bg-muted border-2 border-border transition-colors hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Toggle theme"
          >
            <span
              className={`${
                theme === "dark" ? "translate-x-11" : "translate-x-1"
              } inline-block h-7 w-7 transform rounded-full bg-primary transition-transform duration-200 ease-in-out flex items-center justify-center shadow-md`}
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-primary-foreground" />
              ) : (
                <Sun className="h-4 w-4 text-primary-foreground" />
              )}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
