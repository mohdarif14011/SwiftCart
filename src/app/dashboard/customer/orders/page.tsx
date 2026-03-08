
'use client';

import { useAppStore } from '@/app/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, CheckCircle2, Clock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Separator } from '@/components/ui/separator';

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
  const successId = searchParams.get('success');

  const activeOrder = successId ? orders.find(o => o.id === successId) : null;

  return (
    <div className="p-4 bg-slate-50 space-y-6">
      <h2 className="text-2xl font-black text-slate-900">My Orders</h2>
      
      {successId && activeOrder && (
        <Card className="border-none bg-green-50 shadow-none p-6 text-center space-y-4 rounded-3xl animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Order Placed!</h3>
            <p className="text-sm text-slate-500 font-bold">ORD-{activeOrder.id} • Arriving soon</p>
          </div>
          <div className="flex items-center justify-center gap-2 text-primary font-black text-sm">
            <Truck className="h-4 w-4" /> Tracking Live
          </div>
        </Card>
      )}

      {orders.length === 0 ? (
        <div className="py-20 text-center text-slate-400 font-bold">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    <Package className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">ORD-{o.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{new Date(o.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Badge variant={o.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                  {STATUS_LABELS[o.status] || o.status}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {o.items.slice(0, 2).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{item.name} x{item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {o.items.length > 2 && (
                  <p className="text-[10px] text-slate-400 font-bold">+ {o.items.length - 2} more items</p>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center pt-1">
                <div className="flex items-center gap-1 text-[10px] font-black text-slate-400">
                  <Clock className="h-3 w-3" /> Est. Arrival: 12 mins
                </div>
                <span className="font-black text-slate-900">${o.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
