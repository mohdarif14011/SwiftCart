
'use client';

import { useState, useEffect } from 'react';
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
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { OrderStatus } from '@/app/types';

export default function DeliveryDashboard() {
  const { orders, updateOrderStatus, setUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Simulated live location coordinates
  const [agentPos, setAgentPos] = useState({ lat: 40.7128, lng: -74.0060 });

  useEffect(() => {
    setIsClient(true);
    const interval = setInterval(() => {
      setAgentPos(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.001,
        lng: prev.lng + (Math.random() - 0.5) * 0.001,
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'DELIVERED';
    
    if (currentStatus === 'CONFIRMED') nextStatus = 'PREPARING';
    else if (currentStatus === 'PREPARING') nextStatus = 'PICKED_UP';
    else if (currentStatus === 'PICKED_UP') nextStatus = 'OUT_FOR_DELIVERY';
    else if (currentStatus === 'OUT_FOR_DELIVERY') nextStatus = 'DELIVERED';
    
    updateOrderStatus(orderId, nextStatus);
  };

  const handleLogout = () => {
    setUser(null);
    router.push('/');
  };

  const assignedOrders = orders.filter(o => o.status !== 'DELIVERED');
  const historyOrders = orders.filter(o => o.status === 'DELIVERED');

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
            <span className="text-xs font-bold text-accent uppercase tracking-wider">Online</span>
            <span className="text-[10px] text-muted-foreground">ID: AG-4892</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold font-headline">Live Route Map</CardTitle>
                <CardDescription>Real-time delivery tracking & traffic</CardDescription>
              </div>
              <Badge variant="outline" className="border-accent text-accent animate-pulse">
                GPS Active
              </Badge>
            </CardHeader>
            <CardContent className="p-0 h-[400px] relative bg-muted flex items-center justify-center">
              <img 
                src="https://picsum.photos/seed/delivery-map/1200/800" 
                alt="Map" 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
              
              {/* Simulated Map Markers */}
              <div 
                className="absolute w-8 h-8 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center transition-all duration-500"
                style={{ top: '40%', left: '45%' }}
              >
                <Truck className="h-4 w-4 text-white" />
              </div>
              <div className="absolute w-4 h-4 bg-accent rounded-full border-2 border-white shadow-lg" style={{ top: '30%', left: '60%' }}></div>
              <div className="absolute w-4 h-4 bg-accent rounded-full border-2 border-white shadow-lg" style={{ top: '70%', left: '20%' }}></div>
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-lg border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Navigation className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Location</p>
                    <p className="text-sm font-semibold">Broadway & W 42nd St, New York</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs gap-1">
                  Navigate <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b">
              <button 
                className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'assigned' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('assigned')}
              >
                Assigned Orders ({assignedOrders.length})
              </button>
              <button 
                className={`pb-2 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setActiveTab('history')}
              >
                Completed Today ({historyOrders.length})
              </button>
            </div>

            <div className="space-y-4">
              {activeTab === 'assigned' ? (
                assignedOrders.length > 0 ? (
                  assignedOrders.map(order => (
                    <Card key={order.id} className="border-none shadow-sm hover:ring-1 ring-primary/20 transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">ORD-{order.id}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {order.address}
                            </CardDescription>
                          </div>
                          <Badge className={
                            order.status === 'OUT_FOR_DELIVERY' ? 'bg-primary' : 'bg-muted text-foreground'
                          }>
                            {order.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                              {order.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="h-8 w-8 rounded-full border-2 border-white bg-muted overflow-hidden">
                                  <img src={item.imageUrl} alt="" className="object-cover w-full h-full" />
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="h-8 w-8 rounded-full border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                  +{order.items.length - 3}
                                </div>
                              )}
                            </div>
                            <p className="text-muted-foreground">{order.items.length} items • ${order.total.toFixed(2)}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-full text-primary border-primary">
                              <Phone className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex gap-2">
                        <Button 
                          className="flex-1 bg-primary"
                          onClick={() => handleStatusUpdate(order.id, order.status)}
                        >
                          {order.status === 'CONFIRMED' ? 'Start Preparation' : 
                           order.status === 'PREPARING' ? 'Mark as Picked Up' : 
                           order.status === 'PICKED_UP' ? 'Set Out for Delivery' :
                           'Mark as Delivered'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-20 bg-white rounded-xl border-dashed border-2">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">No active assignments</p>
                    <Button variant="link" className="text-primary">Request New Batch</Button>
                  </div>
                )
              ) : (
                historyOrders.map(order => (
                  <div key={order.id} className="p-4 bg-white rounded-xl shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold">ORD-{order.id}</p>
                        <p className="text-xs text-muted-foreground">Delivered at {isClient ? new Date(order.createdAt).toLocaleTimeString() : '...'}</p>
                      </div>
                    </div>
                    <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-accent text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <DollarSign className="h-20 w-20" />
            </div>
            <CardHeader>
              <CardTitle className="text-lg">Earnings Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black font-headline tracking-tighter">$142.50</p>
              <div className="mt-4 flex items-center gap-4 text-sm font-medium">
                <div className="flex flex-col">
                  <span>Orders</span>
                  <span className="text-xl">12</span>
                </div>
                <div className="flex flex-col">
                  <span>Tips</span>
                  <span className="text-xl">$42.00</span>
                </div>
                <div className="flex flex-col">
                  <span>Bonus</span>
                  <span className="text-xl">$15.00</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t border-white/10 pt-4">
              <Button variant="ghost" className="w-full text-white hover:bg-white/10 text-xs font-bold uppercase tracking-widest">
                View Earnings Details
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border-l-4 border-primary space-y-1">
                <p className="text-xs font-bold">New Bonus Available!</p>
                <p className="text-[10px] text-muted-foreground">Complete 3 more orders before 9 PM for a $20 bonus.</p>
              </div>
              <div className="p-3 bg-accent/5 rounded-lg border-l-4 border-accent space-y-1">
                <p className="text-xs font-bold">Traffic Alert</p>
                <p className="text-[10px] text-muted-foreground">Heavy traffic on 5th Ave. Consider taking the detour via Broadway.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Shift Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>On-time Delivery</span>
                  <span className="text-primary">98%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[98%]"></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span>Customer Rating</span>
                  <span className="text-accent">4.9/5</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[90%]"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
