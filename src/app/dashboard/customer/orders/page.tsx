
'use client';

import { useAppStore } from '@/app/lib/store';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  PICKED_UP: 'Picked up',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
};

export default function CustomerOrders() {
  const { orders } = useAppStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const successId = searchParams.get('success');

  const activeOrder = successId ? orders.find(o => o.id === successId) : null;

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-2xl bg-white shadow-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Button>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">My Orders</h2>
      </div>
      
      {successId && activeOrder && (
        <div className="border-none bg-green-50/50 p-8 text-center space-y-4 rounded-[2.5rem] animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">Order Placed!</h3>
            <p className="text-sm text-slate-500 font-medium">ORD-{activeOrder.id} • Arriving soon</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-sm bg-white/60 py-2 px-4 rounded-full w-fit mx-auto border border-green-100/50">
            <Truck className="h-4 w-4" /> Tracking Live
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-medium">No orders yet.</div>
      ) : (
        <div className="space-y-4 pb-20">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <Package className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-base font-bold text-slate-900">ORD-{o.id}</p>
                    <p className="text-xs text-slate-400 font-medium">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={o.status === 'DELIVERED' ? 'default' : 'secondary'} className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {STATUS_LABELS[o.status] || o.status}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {o.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm font-medium text-slate-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {o.items.length > 2 && (
                  <p className="text-[11px] text-slate-400 font-semibold">+ {o.items.length - 2} more items</p>
                )}
              </div>
              
              <Separator className="bg-slate-50" />
              
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  <Clock className="h-4 w-4" /> Est. Arrival: 12 mins
                </div>
                <span className="text-xl font-bold text-primary">₹{o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
