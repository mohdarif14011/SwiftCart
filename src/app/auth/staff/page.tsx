
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAppStore } from '@/app/lib/store';
import { useToast } from '@/hooks/use-toast';

export default function StaffAuthPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const setUser = useAppStore((state) => state.setUser);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Check if user is Admin or Delivery Agent
      const adminDoc = await getDoc(doc(db, 'roles_admin', uid));
      const agentDoc = await getDoc(doc(db, 'roles_delivery_agent', uid));

      if (adminDoc.exists()) {
        setUser({ id: uid, name: 'Admin', email, role: 'ADMIN' });
        router.push('/dashboard/admin');
      } else if (agentDoc.exists()) {
        setUser({ id: uid, name: 'Agent', email, role: 'DELIVERY_AGENT' });
        router.push('/dashboard/delivery');
      } else {
        // Fallback for prototyping/mocking if roles aren't in DB yet
        // In a real app, we'd sign out if no role found
        toast({ title: "Role check", description: "No staff role found. Please contact an administrator." });
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/auth"><ArrowLeft className="mr-2 h-4 w-4" /> Back to selection</Link>
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl border-none">
        <CardHeader className="text-center space-y-1">
          <div className="flex justify-center mb-4 gap-2">
            <div className="bg-primary p-3 rounded-2xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div className="bg-accent p-3 rounded-2xl">
              <Truck className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold font-headline text-primary">Staff Portal</CardTitle>
          <CardDescription>Administrative and Delivery Agent Access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <Input id="email" name="email" type="email" placeholder="staff@swiftcart.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full py-6 text-lg" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Access Dashboard
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center justify-center">
          <p className="text-xs text-muted-foreground">Unauthorized access is prohibited.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
