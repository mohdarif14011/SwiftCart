
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Truck, UserPlus, Mail, Phone, Trash2, Loader2, Package, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function AdminFleet() {
  const [agentSearch, setAgentSearch] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [agentForm, setAgentForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  
  const db = useFirestore();
  const { toast } = useToast();

  const agentsQuery = useMemoFirebase(() => collection(db, 'deliveryAgents'), [db]);
  const { data: agents } = useCollection(agentsQuery);

  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    return agents.filter(a => 
      `${a.firstName} ${a.lastName}`.toLowerCase().includes(agentSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(agentSearch.toLowerCase())
    );
  }, [agents, agentSearch]);

  const handleAddAgent = async () => {
    if (!agentForm.email || !agentForm.password || !agentForm.firstName || !agentForm.lastName) {
      toast({ variant: "destructive", title: "Error", description: "All fields are required." });
      return;
    }

    setIsAddingAgent(true);
    let secondaryApp;
    try {
      secondaryApp = initializeApp(firebaseConfig, 'AgentOnboarding');
      const secondaryAuth = getAuth(secondaryApp);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, agentForm.email, agentForm.password);
      const uid = userCredential.user.uid;
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setDocumentNonBlocking(doc(db, 'roles_delivery_agent', uid), { active: true }, { merge: true });
      setDocumentNonBlocking(doc(db, 'deliveryAgents', uid), {
        id: uid,
        firstName: agentForm.firstName,
        lastName: agentForm.lastName,
        email: agentForm.email,
        phone: agentForm.phone,
        status: 'Available',
        joinedAt: new Date().toISOString()
      }, { merge: true });

      toast({ title: "Agent Onboarded", description: `${agentForm.firstName} has been created.` });
      setAgentForm({ email: '', password: '', firstName: '', lastName: '', phone: '' });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Onboarding Failed", description: error.message });
      if (secondaryApp) await deleteApp(secondaryApp);
    } finally {
      setIsAddingAgent(false);
    }
  };

  const handleDeleteAgent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteDocumentNonBlocking(doc(db, 'deliveryAgents', id));
    deleteDocumentNonBlocking(doc(db, 'roles_delivery_agent', id));
    toast({ title: "Agent Removed", description: "Fleet access revoked." });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Fleet Command</h1>
        <p className="text-sm text-muted-foreground">Manage your delivery partners and track fulfillment.</p>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" /> Active Partners
            </CardTitle>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90 rounded-xl">
                <UserPlus className="h-4 w-4" /> Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Add New Delivery Agent</DialogTitle>
                <DialogDescription>Create a new account for a delivery partner.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input className="rounded-xl" value={agentForm.firstName} onChange={(e) => setAgentForm({...agentForm, firstName: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input className="rounded-xl" value={agentForm.lastName} onChange={(e) => setAgentForm({...agentForm, lastName: e.target.value})} /></div>
                </div>
                <div className="space-y-2"><Label>Email</Label><Input className="rounded-xl" type="email" value={agentForm.email} onChange={(e) => setAgentForm({...agentForm, email: e.target.value})} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input className="rounded-xl" value={agentForm.phone} onChange={(e) => setAgentForm({...agentForm, phone: e.target.value})} /></div>
                <div className="space-y-2"><Label>Password</Label><Input className="rounded-xl" type="password" value={agentForm.password} onChange={(e) => setAgentForm({...agentForm, password: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl" onClick={handleAddAgent} disabled={isAddingAgent}>
                  {isAddingAgent ? <Loader2 className="animate-spin" /> : "Create Agent Account"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-10 h-10 bg-slate-50 border-none rounded-xl text-sm" 
                value={agentSearch} 
                onChange={(e) => setAgentSearch(e.target.value)} 
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow className="border-none">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6">Agent</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6">Contact</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6">Status</TableHead>
                  <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-400 px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgents.map((agent) => (
                  <TableRow 
                    key={agent.id} 
                    className="cursor-pointer hover:bg-slate-50/80 transition-colors border-slate-50"
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <TableCell className="font-bold text-slate-900 px-6 py-4">
                      {agent.firstName} {agent.lastName}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-500 px-6 py-4">{agent.email}</TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge variant={agent.status === 'Available' ? 'default' : 'secondary'} className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-lg">
                        {agent.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6 py-4">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-slate-300 hover:text-destructive h-8 w-8 rounded-full" 
                        onClick={(e) => handleDeleteAgent(e, agent.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAgents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-300 italic text-sm">
                      No fleet agents found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AgentDetailsDialog 
        agent={selectedAgent} 
        isOpen={!!selectedAgent} 
        onClose={() => setSelectedAgent(null)} 
      />
    </div>
  );
}

function AgentDetailsDialog({ agent, isOpen, onClose }: { agent: any | null, isOpen: boolean, onClose: () => void }) {
  const db = useFirestore();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!agent?.id) return null;
    return query(collection(db, 'orders'), where('agentId', '==', agent.id));
  }, [db, agent?.id]);

  const { data: agentOrders, isLoading: ordersLoading } = useCollection(ordersQuery);

  if (!agent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[2.5rem] p-0 border-none bg-white shadow-2xl overflow-hidden gap-0">
        <div className="p-8 pb-4">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border-none">
                Fleet Profile
              </Badge>
              <Badge variant={agent.status === 'Available' ? 'default' : 'secondary'} className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-lg">
                {agent.status}
              </Badge>
            </div>
            <div>
              <DialogTitle className="text-3xl font-bold tracking-tight text-slate-900">
                {agent.firstName} {agent.lastName}
              </DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
                <Mail className="h-3 w-3" /> {agent.email}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Contact</p>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-primary" /> {agent.phone || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Joined</p>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" /> {agent.joinedAt ? new Date(agent.joinedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-8 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Delivery History
            </h3>
            <Badge variant="outline" className="text-[9px] font-bold border-slate-200">
              {agentOrders?.filter(o => o.status === 'DELIVERED').length || 0} Successful
            </Badge>
          </div>

          <div className="space-y-2 max-h-[250px] overflow-y-auto no-scrollbar pr-1">
            {ordersLoading ? (
              <div className="py-10 text-center"><Loader2 className="h-4 w-4 animate-spin text-primary mx-auto" /></div>
            ) : agentOrders && agentOrders.filter(o => o.status === 'DELIVERED').length > 0 ? (
              agentOrders
                .filter(o => o.status === 'DELIVERED')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(order => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">ORD-{order.id}</p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()} • ₹{order.total?.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-50 p-1.5 rounded-full">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-slate-300 italic text-[11px] font-medium border-2 border-dashed border-slate-200 rounded-3xl bg-white">
                No deliveries completed yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
