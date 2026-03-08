
'use client';

import { useAppStore } from '@/app/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Package, DollarSign, ClipboardList, Truck, TrendingUp, Clock } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function AdminOverview() {
  const { products } = useAppStore();
  const db = useFirestore();

  const ordersQuery = useMemoFirebase(() => collection(db, 'orders'), [db]);
  const agentsQuery = useMemoFirebase(() => collection(db, 'deliveryAgents'), [db]);
  
  const { data: remoteOrders } = useCollection(ordersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const activeOrdersCount = remoteOrders?.filter(o => o.status !== 'DELIVERED').length || 0;
  const totalRevenue = remoteOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
  const availableAgents = agents?.filter(a => a.status === 'Available').length || 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Welcome back, Admin</h1>
        <p className="text-muted-foreground">Here is what is happening with your store today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Total Products</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {products.length}
              <Package className="h-6 w-6 text-primary opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Active Orders</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {activeOrdersCount}
              <ClipboardList className="h-6 w-6 text-accent opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Revenue Today</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              ₹{totalRevenue.toFixed(2)}
              <DollarSign className="h-6 w-6 text-green-500 opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-bold">Available Fleet</CardDescription>
            <CardTitle className="text-3xl font-bold flex items-center justify-between">
              {availableAgents}
              <Truck className="h-6 w-6 text-blue-500 opacity-20" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Store Performance
            </CardTitle>
            <CardDescription>Overview of recent sales and growth.</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
            <p className="text-sm italic">Analytics visualization coming soon.</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" /> Recent Activity
            </CardTitle>
            <CardDescription>Latest events from your fleet and orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {remoteOrders?.slice(0, 4).map(order => (
              <div key={order.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                <div className="bg-white p-2 rounded-full border shadow-sm">
                  <Package className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">New order ORD-{order.id}</p>
                  <p className="text-xs text-muted-foreground">₹{order.total?.toFixed(2)} • {order.address}</p>
                </div>
                <span className="text-[10px] font-black text-slate-400">JUST NOW</span>
              </div>
            ))}
            {(!remoteOrders || remoteOrders.length === 0) && (
              <div className="py-8 text-center text-sm text-muted-foreground italic">
                No recent activity recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
