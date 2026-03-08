'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Navigation, 
  CheckCircle, 
  LogOut, 
  Package,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@/app/types';
import { useFirestore, useUser, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, limit } from 'firebase/firestore';

export default function DeliveryDashboard() {
  const { setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();

  // Real-time Orders from Firestore
  const ordersQuery = useMemoFirebase(() => {
    if (!firebaseUser?.uid) return null;
    return query(collection(db, 'orders'), limit(100));
  }, [db, firebaseUser?.uid]);

  const { data: allOrders, isLoading: isOrdersLoading } = useCollection(ordersQuery);

  // Filter orders for this agent
  const myOrders = useMemo(() => {
    if (!allOrders || !firebaseUser?.uid) return [];
    return allOrders.filter(o => o.agentId === firebaseUser.uid);
  }, [allOrders, firebaseUser?.uid]);

  const assignedOrders = useMemo(() => myOrders.filter(o => o.status !== 'DELIVERED'), [myOrders]);
  const historyOrders = useMemo(() => myOrders.filter(o => o.status === 'DELIVERED'), [myOrders]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'DELIVERED';
    
    if (currentStatus === 'CONFIRMED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'PICKED_UP';
    else if (currentStatus === 'PICKED_UP') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    
    updateDocumentNonBlocking(doc(db, 'orders', orderId), {
      status: nextStatus,
      updatedAt: new Date().toISOString()
    });
  };

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };

  const todayEarnings = useMemo(() => {
    return historyOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [historyOrders]);

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold font-headline text-primary">SwiftCart Agent</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-[10px] font-bold text-accent uppercase tracking-widest">Active</span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{firebaseUser?.email}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 rounded-full">
            <LogOut className="h-4 w-4 text-slate-400" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-6 border-b border-slate-100 px-2">
            <button 
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'assigned' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('assigned')}
            >
              Assigned ({assignedOrders.length})
            </button>
            <button 
              className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
              onClick={() => setActiveTab('history')}
            >
              Completed Today ({historyOrders.length})
            </button>
          </div>

          <div className="space-y-4">
            {isOrdersLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activeTab === 'assigned' ? (
              assignedOrders.length > 0 ? (
                assignedOrders.map(order => (
                  <Card key={order.id} className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold">ORD-{order.id}</CardTitle>
                          <CardDescription className="flex items-start gap-1.5 font-medium text-slate-400 text-xs">
                            <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" /> {order.address}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary" className="bg-slate-50 text-slate-600 text-[9px] font-bold uppercase tracking-wider border-none px-3 py-1">
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex -space-x-3">
                            {order.items?.slice(0, 3).map((item: any, idx: number) => (
                              <div key={idx} className="h-10 w-10 rounded-full border-4 border-white bg-slate-50 overflow-hidden shadow-sm">
                                <img src={item.imageUrl} alt="" className="object-cover w-full h-full" />
                              </div>
                            ))}
                            {order.items?.length > 3 && (
                              <div className="h-10 w-10 rounded-full border-4 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shadow-sm">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-900">{order.items?.length || 0} Products</p>
                            <p className="text-[10px] font-bold text-primary">₹{order.total?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.contactNumber && (
                            <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-full bg-slate-50 hover:bg-primary/10 hover:text-primary transition-colors border border-slate-100">
                              <a href={`tel:${order.contactNumber}`}><Phone className="h-4 w-4" /></a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="p-0 border-t border-slate-50 flex">
                      <Button 
                        variant="ghost" 
                        className="flex-1 h-14 rounded-none border-r border-slate-50 font-bold text-sm text-primary hover:bg-primary/5 gap-2"
                        asChild
                      >
                        <a 
                          href={order.customerLocation 
                            ? `https://www.google.com/maps/dir/?api=1&destination=${order.customerLocation.lat},${order.customerLocation.lng}`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.address)}`
                          } 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-4 w-4" /> Navigate
                        </a>
                      </Button>
                      <Button 
                        className="flex-1 h-14 rounded-none bg-primary hover:bg-primary/90 font-bold text-sm shadow-none"
                        onClick={() => handleStatusUpdate(order.id, order.status)}
                      >
                        {order.status === 'CONFIRMED' ? 'Start Preparation' : 
                         order.status === 'PREPARING' ? 'Mark as Picked Up' : 
                         order.status === 'PICKED_UP' ? 'Set Out for Delivery' :
                         'Complete Delivery'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="text-center py-24 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <Package className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No assigned orders</p>
                </div>
              )
            ) : (
              historyOrders.map(order => (
                <div key={order.id} className="p-5 bg-white rounded-3xl shadow-sm flex items-center justify-between border border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl">
                      <CheckCircle className="h-6 w-6 text-green-500" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900">ORD-{order.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Completed • {new Date(order.updatedAt || order.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">₹{order.total?.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase">Settled</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Earnings Today</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-4xl font-bold tracking-tight text-primary">₹{todayEarnings.toFixed(2)}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-50 text-slate-500 text-[10px] font-bold border-none px-2 py-0.5">
                  {historyOrders.length} Completed Orders
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
