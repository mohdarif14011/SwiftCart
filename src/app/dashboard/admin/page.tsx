
'use client';

import { useState } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Package, DollarSign, ClipboardList, Truck, TrendingUp, Clock, User, Phone, MapPin } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/app/types';

export default function AdminOverview() {
  const { products } = useAppStore();
  const db = useFirestore();
  const { toast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const ordersQuery = useMemoFirebase(() => query(collection(db, 'orders'), limit(50)), [db]);
  const agentsQuery = useMemoFirebase(() => query(collection(db, 'deliveryAgents'), limit(100)), [db]);
  
  const { data: remoteOrders } = useCollection(ordersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const activeOrdersCount = remoteOrders?.filter(o => o.status !== 'DELIVERED').length || 0;
  const totalRevenue = remoteOrders?.reduce((acc, o) => acc + (o.total || 0), 0) || 0;
  const availableAgents = agents?.filter(a => a.status === 'Available').length || 0;

  const handleAssignAgent = (orderId: string, agentId: string) => {
    updateDocumentNonBlocking(doc(db, 'orders', orderId), {
      agentId: agentId,
      status: 'PICKED_UP',
      assignedAt: new Date().toISOString()
    });

    toast({ 
      title: "Agent Assigned", 
      description: `Order ${orderId} has been successfully dispatched.` 
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor store performance and fleet activity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Products" value={products.length.toString()} icon={Package} />
        <StatCard title="Active Orders" value={activeOrdersCount.toString()} icon={ClipboardList} color="text-amber-500" />
        <StatCard title="Daily Revenue" value={`₹${totalRevenue.toFixed(2)}`} icon={DollarSign} color="text-emerald-500" />
        <StatCard title="Fleet Status" value={`${availableAgents} Online`} icon={Truck} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground text-xs italic">
            Visual analytics coming soon.
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {remoteOrders?.slice(0, 5).map(order => (
              <div 
                key={order.id} 
                className="group relative flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100 hover:border-primary/20 transition-all cursor-pointer shadow-sm"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center bg-white shrink-0">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">ORD-{order.id}</p>
                    <p className="text-[11px] text-muted-foreground truncate font-medium">
                      ₹{order.total?.toFixed(2)} • {order.address}
                    </p>
                  </div>
                </div>
                <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-full h-fit">
                  {order.status.replace('_', ' ')}
                </Badge>
              </div>
            ))}
            {(!remoteOrders || remoteOrders.length === 0) && (
              <div className="py-10 text-center text-xs text-muted-foreground italic">No recent activity.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <OrderDetailsDialog 
        order={selectedOrder} 
        isOpen={!!selectedOrder} 
        onClose={() => setSelectedOrder(null)} 
        agents={agents || []}
        onAssign={handleAssignAgent}
      />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: string, icon: any, color?: string }) {
  return (
    <Card className="border-none shadow-sm bg-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 ${color || 'text-primary'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-xl font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailsDialog({ order, isOpen, onClose, agents, onAssign }: { order: Order | null, isOpen: boolean, onClose: () => void, agents: any[], onAssign: (oid: string, aid: string) => void }) {
  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2rem] p-6 border-none">
        <DialogHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">ORD-{order.id}</Badge>
            <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase">{order.status.replace('_', ' ')}</Badge>
          </div>
          <DialogTitle className="text-xl font-bold pt-2">Order Summary</DialogTitle>
          <DialogDescription className="text-xs font-medium">{new Date(order.createdAt).toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Items</h4>
            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs font-medium">
                  <span className="text-slate-600">{item.name} <span className="text-slate-400">x{item.quantity}</span></span>
                  <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <Separator className="bg-slate-200/50 my-1" />
              <div className="flex justify-between text-sm font-bold">
                <span>Total Amount</span>
                <span className="text-primary">₹{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Customer</h4>
              <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 p-2 rounded-xl">
                <User className="h-3 w-3 text-primary" />
                <span className="truncate">Arif Mohd</span>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact</h4>
              <div className="flex items-center gap-2 text-xs font-medium bg-slate-50 p-2 rounded-xl">
                <Phone className="h-3 w-3 text-primary" />
                <span>+91 9999999999</span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Delivery Address</h4>
            <div className="flex items-start gap-2 text-xs font-medium bg-slate-50 p-3 rounded-xl">
              <MapPin className="h-3 w-3 text-primary mt-0.5 shrink-0" />
              <span className="leading-relaxed">{order.address}</span>
            </div>
          </div>

          {!order.agentId && order.status !== 'DELIVERED' && (
            <div className="pt-4 space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Assign Agent</h4>
              <div className="grid gap-2 max-h-[150px] overflow-y-auto no-scrollbar">
                {agents.filter(a => a.status === 'Available').map(agent => (
                  <div key={agent.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Truck className="h-3 w-3 text-primary" />
                      <div>
                        <p className="text-xs font-bold">{agent.firstName} {agent.lastName}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">{agent.vehicleType || 'E-Bike'}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => { onAssign(order.id, agent.id); onClose(); }} className="h-7 text-[10px] font-bold">Assign</Button>
                  </div>
                ))}
                {agents.filter(a => a.status === 'Available').length === 0 && (
                  <p className="text-center text-[10px] text-muted-foreground py-2 font-medium">No agents available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button variant="outline" onClick={onClose} className="w-full rounded-xl h-12 text-sm font-bold mt-2">Close Details</Button>
      </DialogContent>
    </Dialog>
  );
}
