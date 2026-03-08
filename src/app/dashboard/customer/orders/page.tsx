
'use client';

import { useAppStore } from '@/app/lib/store';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock, ArrowLeft, Phone, Loader2 } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useMemo } from 'react';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

export default function CustomerOrders() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();
  const successId = searchParams.get('success');

  // Real-time Orders from Firestore - filtered by userId for security and performance
  const ordersQuery = useMemoFirebase(() => {
    if (!firebaseUser?.uid) return null;
    return query(
      collection(db, 'orders'),
      where('userId', '==', firebaseUser.uid),
      limit(50)
    );
  }, [db, firebaseUser?.uid]);

  const { data: customerOrders, isLoading } = useCollection(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!customerOrders) return [];
    return [...customerOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [customerOrders]);

  const activeOrder = useMemo(() => {
    return successId ? sortedOrders.find(o => o.id === successId) : null;
  }, [sortedOrders, successId]);

  return (
    <div className="p-4 bg-slate-50 min-h-full space-y-4">
      <div className="flex items-center gap-3 pt-[max(0rem,calc(env(safe-area-inset-top)-3rem))]">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-xl bg-white shadow-sm hover:bg-slate-100 transition-colors h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4 text-slate-900" />
        </Button>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Orders</h2>
      </div>
      
      {successId && activeOrder && (
        <div className="bg-green-50/40 p-6 text-center space-y-3 rounded-3xl animate-in fade-in zoom-in duration-500 border border-green-100/50">
          <div className="w-14 h-14 bg-green-100/80 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-lg font-bold text-slate-900">Order Placed!</h3>
            <p className="text-[11px] text-slate-500 font-medium">ORD-{activeOrder.id} • {STATUS_LABELS[activeOrder.status]}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-[11px] bg-white/80 py-1.5 px-3 rounded-full border border-green-100/30">
              <Truck className="h-3.5 w-3.5" /> Tracking Live
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : sortedOrders.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm font-medium">No orders yet.</div>
      ) : (
        <div className="space-y-3 pb-8">
          {sortedOrders.map((o) => (
            <div key={o.id} className="bg-white p-4 rounded-2xl border border-slate-200/60 space-y-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-xl">
                    <Package className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-900">ORD-{o.id}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={o.status === 'DELIVERED' ? 'default' : 'secondary'} className="rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  {STATUS_LABELS[o.status] || o.status}
                </Badge>
              </div>
              
              <div className="space-y-2.5 px-1">
                {o.items?.slice(0, 3).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs font-medium text-slate-600">
                    <span>{item.name} <span className="text-slate-400 text-[10px]">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {(o.items?.length || 0) > 3 && (
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">+ {o.items.length - 3} more items</p>
                )}
              </div>
              
              <Separator className="bg-slate-200/50" />
              
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {o.status === 'DELIVERED' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {o.status === 'DELIVERED' ? 'Delivered' : 'Arriving Soon'}
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">₹{o.total?.toFixed(2)}</span>
              </div>
              
              {o.status !== 'DELIVERED' && o.agentId && (
                <Button variant="outline" size="sm" className="w-full gap-2 border-primary/20 text-primary text-xs h-9 font-bold" asChild>
                  <a href={`tel:${o.contactNumber || '9999999999'}`}>
                    <Phone className="h-3.5 w-3.5" /> Call Delivery Partner
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
