
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Truck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';

export default function DeliveryAuthPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { user: firebaseUser, isUserLoading } = useUser();
  const setUser = useAppStore((state) => state.setUser);
  const user = useAppStore((state) => state.user);
  const { toast } = useToast();

  // Redirect if already logged in as DELIVERY_AGENT
  useEffect(() => {
    if (!isUserLoading && firebaseUser && user?.role === 'DELIVERY_AGENT') {
      router.replace('/dashboard/delivery');
    }
  }, [firebaseUser, isUserLoading, user, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const agentDoc = await getDoc(doc(db, 'roles_delivery_agent', uid));

      if (agentDoc.exists()) {
        setUser({ id: uid, name: 'Agent', email, role: 'DELIVERY_AGENT' });
        toast({ title: "Connected", description: "Welcome back to the fleet." });
        router.push('/dashboard/delivery');
      } else {
        await signOut(auth);
        toast({ 
          variant: "destructive",
          title: "Access Denied", 
          description: "This account is not registered in the active delivery fleet." 
        });
      }
    } catch (error: any) {
      toast({ 
        variant: "destructive", 
        title: "Login failed", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mb-8">
        <Button variant="ghost" asChild className="mb-4 rounded-full">
          <Link href="/auth"><ArrowLeft className="mr-2 h-4 w-4" /> Portals</Link>
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-none rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center space-y-1 bg-accent/10 pb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-accent p-4 rounded-3xl shadow-lg">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-accent">Fleet Portal</CardTitle>
          <CardDescription className="font-medium">Active Delivery Partners</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fleet ID / Email</Label>
              <Input id="email" name="email" type="email" placeholder="agent@swiftcart.com" required className="h-12 rounded-2xl bg-slate-50 border-none px-4" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" title="Password" className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Access Pass</Label>
              <Input id="password" name="password" type="password" required className="h-12 rounded-2xl bg-slate-50 border-none px-4" />
            </div>
            <Button className="w-full py-7 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 transition-all mt-4" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Go Active"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center justify-center pb-8">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Encrypted Fleet Access</p>
        </CardFooter>
      </Card>
    </div>
  );
}
