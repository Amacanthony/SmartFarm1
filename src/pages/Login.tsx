import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Leaf } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = login(username, password);
    
    if (success) {
      toast.success('Welcome to NCAIR Smart Farm!');
    } else {
      toast.error('Invalid credentials. Please try again.');
      setPassword('');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/images/farm-background.png)'
      }}
    >
      <div className="absolute inset-0 bg-black/30 dark:bg-black/60" />
      <Card className="w-full max-w-md shadow-2xl relative z-10 bg-card/95 backdrop-blur-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-2 p-2">
            <img 
              src="/logo.png" 
              alt="NCAIR Smart Farm" 
              className="w-full h-full object-contain"
              loading="eager"
              width="80"
              height="80"
            />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">NCAIR Smart Farm</CardTitle>
          <CardDescription className="text-base">
            Enter your credentials to access the farm management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold">
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
