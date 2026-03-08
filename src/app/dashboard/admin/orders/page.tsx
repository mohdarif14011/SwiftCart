
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Package, Clock, Truck, User, Phone, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit } from 'firebase/firestore';
import { Order } from '@/app/types';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function AdminOrders() {
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const db = useFirestore();
  const { toast } = useToast();

  const ordersQuery = useMemoFirebase(() => query(collection(db, 'orders'), limit(100)), [db]);
  const agentsQuery = useMemoFirebase(() => query(collection(db, 'deliveryAgents'), limit(100)), [db]);
  
  const { data: orders } = useCollection(ordersQuery);
  const { data: agents } = useCollection(agentsQuery);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.address.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(orderSearch.toLowerCase())
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, orderSearch]);

  const handleAssignAgent = (orderId: string, agentId: string) => {
    updateDocumentNonBlocking(doc(db, 'orders', orderId), {
      agentId: agentId,
      status: 'PICKED_UP',
      assignedAt: new Date().toISOString()
    });

    toast({ title: "Agent Assigned", description: `Order ${orderId} has been dispatched.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Order Stream</h1>
          <p className="text-sm text-muted-foreground">Monitor real-time fulfillment and tracking.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Search by ID, name or address..." 
          className="pl-10 h-12 rounded-2xl bg-white border-none shadow-sm focus-visible:ring-primary/20"
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {filteredOrders.map((order) => (
          <div 
            key={order.id} 
            className="group relative flex items-center justify-between p-5 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 transition-all cursor-pointer shadow-sm"
            onClick={() => setSelectedOrder(order)}
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full border border-slate-100 flex items-center justify-center bg-slate-50 shrink-0">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">ORD-{order.id}</p>
                <p className="text-[11px] text-muted-foreground truncate font-medium">
                  {order.customerName || 'Customer'} • ₹{order.total?.toFixed(2)}
                </p>
              </div>
            </div>
            <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase py-1 px-3 rounded-full">
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        ))}

        {filteredOrders.length === 0 && (
          <div className="col-span-full py-32 text-center text-slate-300">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No orders found.</p>
          </div>
        )}
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

function OrderDetailsDialog({ order, isOpen, onClose, agents, onAssign }: { order: Order | null, isOpen: boolean, onClose: () => void, agents: any[], onAssign: (oid: string, aid: string) => void }) {
  if (!order) return null;

  const assignedAgent = agents.find(a => a.id === order.agentId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-8 border border-slate-100 bg-white shadow-2xl overflow-hidden">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary bg-slate-50 px-3 py-1">ORD-{order.id}</Badge>
            <Badge variant={order.status === 'DELIVERED' ? 'default' : 'secondary'} className="text-[10px] font-bold uppercase px-3 py-1">{order.status.replace('_', ' ')}</Badge>
          </div>
          <div>
            <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900">Order Details</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-400">{new Date(order.createdAt).toLocaleString()}</DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-8">
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cart Items</h4>
            <div className="space-y-3 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
              <div className="space-y-3 max-h-[120px] overflow-y-auto no-scrollbar">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm font-medium">
                    <span className="text-slate-500">{item.name} <span className="text-slate-300 ml-1">x{item.quantity}</span></span>
                    <span className="font-bold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="bg-slate-200/50 my-1" />
              <div className="flex justify-between items-center pt-1">
                <span className="text-base font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-bold text-primary">₹{order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Shopper</h4>
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <User className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{order.customerName || 'Customer'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Contact</h4>
              <div className="flex items-center gap-2 text-xs font-bold bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="truncate">{order.contactNumber || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Destination</h4>
            <div className="flex items-start gap-3 text-xs font-bold bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 leading-relaxed">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{order.address}</span>
            </div>
          </div>

          {order.agentId ? (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent ml-1">Fleet Agent</h4>
              <div className="flex items-center justify-between bg-accent/5 p-4 rounded-2xl border border-accent/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-full">
                    <Truck className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{assignedAgent ? `${assignedAgent.firstName} ${assignedAgent.lastName}` : 'Assigned Agent'}</p>
                    <p className="text-[10px] text-accent font-bold uppercase tracking-wider">{assignedAgent?.vehicleType || 'E-Bike'}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : order.status !== 'DELIVERED' && (
            <div className="pt-2 space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary ml-1">Dispatch Fleet</h4>
              <div className="grid gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
                {agents.filter(a => a.status === 'Available').map(agent => (
                  <div key={agent.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-primary/20 transition-all group shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/5 rounded-full">
                        <Truck className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-bold">{agent.firstName} {agent.lastName}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">{agent.vehicleType || 'E-Bike'}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => { onAssign(order.id, agent.id); onClose(); }} className="h-8 px-4 text-[10px] font-bold rounded-xl shadow-none">Dispatch</Button>
                  </div>
                ))}
                {agents.filter(a => a.status === 'Available').length === 0 && (
                  <div className="text-center py-6 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">No available agents</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
