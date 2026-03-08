
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Truck, UserPlus, Mail, Phone, Lock, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useFirestore, useCollection, useMemoFirebase, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { useToast } from '@/hooks/use-toast';

export default function AdminFleet() {
  const [agentSearch, setAgentSearch] = useState('');
  const [isAddingAgent, setIsAddingAgent] = useState(false);
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

  const handleDeleteAgent = (id: string) => {
    deleteDocumentNonBlocking(doc(db, 'deliveryAgents', id));
    deleteDocumentNonBlocking(doc(db, 'roles_delivery_agent', id));
    toast({ title: "Agent Removed", description: "Fleet access revoked." });
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6 text-primary" /> Active Fleet
          </CardTitle>
          <CardDescription>Manage your delivery agents and track their status.</CardDescription>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2 bg-accent hover:bg-accent/90">
              <UserPlus className="h-4 w-4" /> Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Delivery Agent</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input value={agentForm.firstName} onChange={(e) => setAgentForm({...agentForm, firstName: e.target.value})} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input value={agentForm.lastName} onChange={(e) => setAgentForm({...agentForm, lastName: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Email</Label><Input type="email" value={agentForm.email} onChange={(e) => setAgentForm({...agentForm, email: e.target.value})} /></div>
              <div className="space-y-2"><Label>Phone</Label><Input value={agentForm.phone} onChange={(e) => setAgentForm({...agentForm, phone: e.target.value})} /></div>
              <div className="space-y-2"><Label>Password</Label><Input type="password" value={agentForm.password} onChange={(e) => setAgentForm({...agentForm, password: e.target.value})} /></div>
            </div>
            <DialogFooter>
              <Button className="w-full h-12" onClick={handleAddAgent} disabled={isAddingAgent}>
                {isAddingAgent ? <Loader2 className="animate-spin" /> : "Create Agent Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search fleet..." className="pl-10" value={agentSearch} onChange={(e) => setAgentSearch(e.target.value)} />
        </div>
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.firstName} {agent.lastName}</TableCell>
                  <TableCell className="text-xs">{agent.email}</TableCell>
                  <TableCell>
                    <Badge variant={agent.status === 'Available' ? 'default' : 'secondary'} className="text-[10px]">{agent.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteAgent(agent.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
