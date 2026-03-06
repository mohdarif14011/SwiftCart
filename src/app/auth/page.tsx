
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, User, Shield, Truck, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthSelectionPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-3xl shadow-lg">
              <ShoppingCart className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black font-headline text-primary tracking-tight">SwiftCart</h1>
          <p className="text-muted-foreground">Select your portal to continue</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Link href="/auth/customer">
            <Card className="hover:border-primary cursor-pointer transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-6 gap-6">
                  <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors">
                    <User className="h-8 w-8 text-primary group-hover:text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Customer Portal</h3>
                    <p className="text-sm text-muted-foreground">Shop fresh groceries and track deliveries</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/auth/staff">
            <Card className="hover:border-accent cursor-pointer transition-all group overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-center p-6 gap-6">
                  <div className="bg-accent/10 p-4 rounded-2xl group-hover:bg-accent group-hover:text-white transition-colors">
                    <div className="flex gap-1">
                      <Shield className="h-8 w-8 text-accent group-hover:text-white" />
                      <Truck className="h-8 w-8 text-accent group-hover:text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold">Staff Portal</h3>
                    <p className="text-sm text-muted-foreground">Admins and Delivery Agent access only</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
