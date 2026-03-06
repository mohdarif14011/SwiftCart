
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UserRole } from '@/app/types';
import { useAppStore } from '@/app/lib/store';
import { ShoppingCart, User, Shield, Truck } from 'lucide-react';

export default function AuthPage() {
  const [role, setRole] = useState<UserRole>('CUSTOMER');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setUser = useAppStore((state) => state.setUser);

  const handleLogin = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockUser = {
        id: Math.random().toString(36).substr(2, 9),
        name: role === 'ADMIN' ? 'Admin User' : role === 'DELIVERY_AGENT' ? 'Agent Swift' : 'Happy Customer',
        email: 'user@example.com',
        role,
      };
      setUser(mockUser);
      setLoading(false);
      
      if (role === 'CUSTOMER') router.push('/dashboard/customer');
      else if (role === 'ADMIN') router.push('/dashboard/admin');
      else if (role === 'DELIVERY_AGENT') router.push('/dashboard/delivery');
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-primary">SwiftCart Login</CardTitle>
          <CardDescription>Select your role to enter the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <RadioGroup
              defaultValue="CUSTOMER"
              onValueChange={(v) => setRole(v as UserRole)}
              className="grid grid-cols-1 gap-4"
            >
              <div>
                <RadioGroupItem value="CUSTOMER" id="customer" className="peer sr-only" />
                <Label
                  htmlFor="customer"
                  className="flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Customer</p>
                      <p className="text-xs text-muted-foreground">Shop and track your orders</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="DELIVERY_AGENT" id="delivery" className="peer sr-only" />
                <Label
                  htmlFor="delivery"
                  className="flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Delivery Agent</p>
                      <p className="text-xs text-muted-foreground">Deliver orders and update status</p>
                    </div>
                  </div>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="ADMIN" id="admin" className="peer sr-only" />
                <Label
                  htmlFor="admin"
                  className="flex items-center justify-between rounded-lg border-2 border-muted bg-white p-4 hover:bg-accent/5 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">Administrator</p>
                      <p className="text-xs text-muted-foreground">Manage products and inventory</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full py-6 text-lg bg-primary hover:bg-primary/90" 
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Entering...' : 'Continue to Dashboard'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
