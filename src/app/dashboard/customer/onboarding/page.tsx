'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, MapPin, Navigation, Info } from 'lucide-react';
import { useFirestore, setDocumentNonBlocking, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const FALLBACK_LAT = 25.4358;
const FALLBACK_LNG = 81.8463;

export default function CustomerOnboarding() {
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', nearby: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => firebaseUser?.uid ? doc(db, 'customers', firebaseUser.uid) : null, [db, firebaseUser?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  // Automatically locate on mount
  useEffect(() => {
    handleAutoLocate();
  }, []);

  // Populate form if profile already exists
  useEffect(() => {
    if (profile) {
      setForm({
        phone: profile.phone || '',
        address: profile.address || '',
        nearby: profile.nearby || ''
      });
      if (profile.location) {
        setGpsLocation(profile.location);
      }
    }
  }, [profile]);

  const handleAutoLocate = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { 
          setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); 
          setLocating(false); 
          toast({ title: "Location Captured", description: "Your current coordinates have been pinned automatically." });
        },
        () => { 
          setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG }); 
          setLocating(false);
          toast({ variant: "destructive", title: "Location Error", description: "Using default city coordinates. Please ensure GPS is on." });
        },
        { enableHighAccuracy: true }
      );
    } else {
      setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG });
      setLocating(false);
    }
  };

  const handleComplete = () => {
    if (!firebaseUser?.uid) return;
    if (!form.phone.trim() || !form.address.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Phone and Address are required." });
      return;
    }

    setSaving(true);
    const names = (firebaseUser.displayName || 'Customer').split(' ');
    const profileData = {
      id: firebaseUser.uid,
      firstName: names[0],
      lastName: names.slice(1).join(' ') || 'User',
      email: firebaseUser.email,
      phone: form.phone,
      address: form.address,
      nearby: form.nearby,
      location: gpsLocation,
      updatedAt: new Date().toISOString()
    };

    setDocumentNonBlocking(doc(db, 'customers', firebaseUser.uid), profileData, { merge: true });
    toast({ title: "Profile Updated", description: "Your delivery details are now ready." });
    router.push('/dashboard/customer');
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white p-6 sm:p-10 max-w-xl mx-auto">
      <div className="flex flex-col gap-8">
        <div className="space-y-4">
          <button 
            onClick={() => router.back()} 
            className="p-2 -ml-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors w-fit"
          >
            <ArrowLeft className="h-6 w-6 text-slate-900" />
          </button>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Delivery Info</h1>
            <p className="text-slate-500 font-medium">We've pinned your location. Just add your details.</p>
          </div>
        </div>

        <div className="bg-primary/5 rounded-3xl p-5 border border-primary/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">GPS Location</p>
              <p className="text-xs font-bold text-slate-900">
                {locating ? "Locating you..." : gpsLocation ? "Pinned Automatically" : "Waiting for GPS..."}
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 rounded-full hover:bg-white" 
            onClick={handleAutoLocate}
            disabled={locating}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4 text-primary" />}
          </Button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Street Address</label>
            <Input 
              placeholder="House No, Building Name, Street" 
              className="h-14 bg-slate-50 border-none rounded-2xl text-base font-semibold px-5 focus-visible:ring-1 focus-visible:ring-primary shadow-none" 
              value={form.address} 
              onChange={(e) => setForm({...form, address: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Mobile Number</label>
            <Input 
              placeholder="e.g. +91 98765 43210" 
              className="h-14 bg-slate-50 border-none rounded-2xl text-base font-semibold px-5 focus-visible:ring-1 focus-visible:ring-primary shadow-none" 
              value={form.phone} 
              onChange={(e) => setForm({...form, phone: e.target.value})} 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Landmark (Optional)</label>
            <Input 
              placeholder="Near park, grocery store, etc." 
              className="h-14 bg-slate-50 border-none rounded-2xl text-base font-semibold px-5 focus-visible:ring-1 focus-visible:ring-primary shadow-none" 
              value={form.nearby} 
              onChange={(e) => setForm({...form, nearby: e.target.value})} 
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full h-16 text-lg font-bold rounded-[2rem] bg-primary shadow-xl shadow-primary/20 hover:scale-[0.98] transition-transform" 
            onClick={handleComplete} 
            disabled={saving || locating}
          >
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "Save & Continue"}
          </Button>
          
          <div className="flex items-center justify-center gap-2 mt-6 text-slate-400">
            <Info className="h-3 w-3" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Secure Checkout Enabled</p>
          </div>
        </div>
      </div>
    </div>
  );
}
