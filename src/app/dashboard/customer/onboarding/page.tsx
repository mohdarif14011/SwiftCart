
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Phone, Building2, ArrowLeft, Loader2, ChevronRight, Navigation } from 'lucide-react';
import { useAuth, useFirestore, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const FALLBACK_LAT = 25.4358;
const FALLBACK_LNG = 81.8463;

export default function CustomerOnboarding() {
  const [view, setView] = useState<'map' | 'details'>('map');
  const [gpsLocation, setGpsLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ phone: '', address: '', nearby: '' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    handleAutoLocate();
  }, []);

  const handleAutoLocate = () => {
    setLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
        () => { setGpsLocation({ lat: FALLBACK_LAT, lng: FALLBACK_LNG }); setLocating(false); }
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
    toast({ title: "Profile Ready", description: "Welcome to SwiftCart!" });
    router.push('/dashboard/customer');
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {view === 'map' ? (
        <>
          <div className="p-6 space-y-2">
            <h1 className="text-3xl font-black text-slate-900">Pin Your House</h1>
            <p className="text-slate-500 font-medium">Place the pin exactly where you want delivery.</p>
          </div>
          <div className="flex-1 relative bg-slate-100 overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://maps.google.com/maps?q=${gpsLocation?.lat || FALLBACK_LAT},${gpsLocation?.lng || FALLBACK_LNG}&z=18&output=embed`}
              className="w-full h-full grayscale opacity-70"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl animate-pulse ring-4 ring-primary/20">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
            <Button variant="outline" className="absolute bottom-6 right-6 rounded-full h-14 w-14 bg-white shadow-2xl p-0" onClick={handleAutoLocate} disabled={locating}>
              {locating ? <Loader2 className="h-6 w-6 animate-spin" /> : <Navigation className="h-6 w-6 text-primary" />}
            </Button>
          </div>
          <div className="p-6 bg-white border-t border-slate-100 shadow-2xl">
            <Button className="w-full h-14 text-lg font-black rounded-2xl" onClick={() => setView('details')} disabled={!gpsLocation}>
              Confirm Pin Location <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col h-screen p-6 space-y-8 overflow-y-auto">
          <div className="space-y-2">
            <button onClick={() => setView('map')} className="p-1 -ml-1"><ArrowLeft className="h-6 w-6 text-slate-900" /></button>
            <h1 className="text-3xl font-black text-slate-900">Delivery Info</h1>
            <p className="text-slate-500 font-medium">Finalize your delivery details.</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Street Address</label>
              <Input placeholder="House No, Area, City" className="h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
              <Input placeholder="e.g. +91 98765 43210" className="h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Landmark (Optional)</label>
              <Input placeholder="Near central park, etc." className="h-14 bg-slate-50 border-none rounded-2xl text-lg font-bold" value={form.nearby} onChange={(e) => setForm({...form, nearby: e.target.value})} />
            </div>
          </div>
          <div className="flex-1" />
          <Button className="w-full h-14 text-lg font-black rounded-2xl bg-primary" onClick={handleComplete} disabled={saving}>
            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : "Start Shopping"}
          </Button>
        </div>
      )}
    </div>
  );
}
