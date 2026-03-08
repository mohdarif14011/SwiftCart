
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';

export default function CustomerAuthPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const setUser = useAppStore((state) => state.setUser);
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (!isUserLoading && firebaseUser) {
      router.replace('/dashboard/customer');
    }
  }, [firebaseUser, isUserLoading, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      setUser({
        id: user.uid,
        name: user.displayName || 'Customer',
        email: user.email || '',
        role: 'CUSTOMER',
      });
      
      toast({ 
        title: "Welcome to SwiftCart!", 
        description: `Signed in as ${user.displayName || user.email}` 
      });
      
      router.push('/dashboard/customer');
    } catch (error: any) {
      console.error(error);
      toast({ 
        variant: "destructive", 
        title: "Sign in failed", 
        description: error.message || "An unexpected error occurred during Google sign in."
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to home</Link>
        </Button>
      </div>
      
      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <ShoppingCart className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-primary tracking-tight">Customer Portal</CardTitle>
          <CardDescription>Experience lightning-fast grocery delivery</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Sign in to manage your orders, track deliveries, and use our AI shopping tools.
            </p>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-14 text-base font-bold gap-3 border-2 hover:bg-slate-50 transition-all shadow-sm"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {loading ? "Connecting..." : "Continue with Google"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Secure Authentication</span>
            </div>
          </div>
        </CardContent>
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground px-4 leading-relaxed">
            By continuing, you agree to SwiftCart's Terms of Service and Privacy Policy.
          </p>
        </div>
      </Card>
    </div>
  );
}
