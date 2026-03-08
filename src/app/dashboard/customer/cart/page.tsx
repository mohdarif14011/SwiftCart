'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  ArrowLeft, 
  MapPin, 
  User, 
  X, 
  TicketPercent, 
  Info
} from 'lucide-react';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

export default function CustomerCart() {
  const { cart, updateCartQuantity, removeFromCart, placeOrder } = useAppStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();

  const userProfileRef = useMemoFirebase(() => firebaseUser?.uid ? doc(db, 'customers', firebaseUser.uid) : null, [db, firebaseUser?.uid]);
  const { data: profile } = useDoc(userProfileRef);

  useEffect(() => {
    if (profile) {
      setDeliveryAddress(profile.address || '');
      setCustomerName(`${profile.firstName || ''} ${profile.lastName || ''}`.trim());
      setContactNumber(profile.phone || '');
    }
  }, [profile]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 20.00 : 0;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newOrder = {
      id: orderId,
      userId: firebaseUser?.uid || 'anonymous',
      customerName,
      contactNumber,
      items: [...cart],
      total: cartTotal + deliveryFee,
      status: 'CONFIRMED' as const,
      createdAt: new Date().toISOString(),
      address: deliveryAddress || 'Delivery to your current location',
      paymentMethod: 'Scan and pay at the time of delivery',
    };

    setDoc(doc(db, 'orders', orderId), newOrder, { merge: true });
    placeOrder(newOrder);
    router.push(`/dashboard/customer/orders?success=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-6 pt-6 pb-2 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full bg-slate-50 hover:bg-slate-100 h-10 w-10 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Button>
        <h2 className="text-lg font-bold text-slate-900">My Cart</h2>
        <div className="w-10" />
      </div>
      
      {cart.length === 0 ? (
        <div className="px-6 py-20 flex flex-col items-center gap-4 text-center">
          <div className="p-6 bg-slate-50 rounded-full">
            <ShoppingBag className="h-10 w-10 text-slate-200" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-lg text-slate-900">Your cart is empty</p>
            <p className="text-sm text-slate-400 font-medium">Add some fresh groceries to get started.</p>
          </div>
          <Button onClick={() => router.push('/dashboard/customer')} className="rounded-2xl h-12 px-8 font-bold bg-primary mt-4">Start Shopping</Button>
        </div>
      ) : (
        <div className="px-6 space-y-6 mt-2">
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.productId} className="py-3 flex gap-4 border-b border-slate-50 relative group">
                <div className="h-16 w-16 rounded-xl bg-slate-50 flex-shrink-0 flex items-center justify-center p-2">
                  <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      {item.weight}{item.unit}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end justify-between py-0.5">
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-300 hover:text-destructive transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="flex items-center bg-slate-50 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} 
                      className="p-1 hover:bg-slate-200 rounded transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-2 text-xs font-bold">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} 
                      className="p-1 bg-primary text-white rounded hover:opacity-90 transition-opacity"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-2 px-4">
            <TicketPercent className="h-4 w-4 text-slate-400" />
            <input 
              placeholder="Promo code" 
              className="flex-1 border-none bg-transparent h-8 p-0 focus:ring-0 font-medium text-xs outline-none"
            />
            <Button size="sm" variant="ghost" className="h-8 rounded-lg text-primary font-bold text-xs uppercase hover:bg-white">Apply</Button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</Label>
                <Input 
                  placeholder="Your Name" 
                  className="bg-slate-50 border-none rounded-xl h-10 text-sm font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ml-1">Contact Number</Label>
                <Input 
                  placeholder="Your Phone" 
                  className="bg-slate-50 border-none rounded-xl h-10 text-sm font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary shadow-none"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Delivery to</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/5 p-0"
                onClick={() => router.push('/dashboard/customer/onboarding')}
              >
                Edit
              </Button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
               <p className="text-xs font-medium text-slate-900 leading-relaxed">
                 {deliveryAddress || 'No address found. Please update profile.'}
               </p>
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-3 text-white flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <Info className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Payment Instruction</p>
              <p className="text-[11px] font-medium">Scan & Pay at the time of delivery</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">Subtotal</span>
              <span className="text-xs font-bold text-slate-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-slate-400">Delivery</span>
              <span className="text-xs font-bold text-slate-900">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <Separator className="bg-slate-50 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Amount</span>
              <span className="text-lg font-bold text-primary">₹{(cartTotal + deliveryFee).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-50 flex justify-center z-20">
          <Button 
            className="w-full h-14 rounded-2xl bg-primary font-bold text-base shadow-lg shadow-primary/20" 
            onClick={() => setIsConfirmOpen(true)}
            disabled={!deliveryAddress.trim() || !customerName.trim() || !contactNumber.trim()}
          >
            Checkout Now
          </Button>
        </div>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-6">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <AlertDialogTitle className="font-bold text-xl text-center">Confirm Order?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-center text-slate-500 text-sm leading-relaxed">
              Your fresh groceries will be delivered to <span className="text-slate-900 font-bold">"{deliveryAddress}"</span> shortly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-6">
            <AlertDialogCancel className="flex-1 rounded-xl h-11 border-none bg-slate-50 font-bold text-slate-900 text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-xl bg-primary h-11 font-bold text-white text-sm" onClick={handlePlaceOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
