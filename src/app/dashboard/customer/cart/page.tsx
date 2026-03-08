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
  ChevronRight,
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
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

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

    setDocumentNonBlocking(doc(db, 'orders', orderId), newOrder, { merge: true });
    placeOrder(newOrder);
    router.push(`/dashboard/customer/orders?success=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-32">
      {/* Header */}
      <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-slate-50/80 backdrop-blur-md z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-xl bg-white shadow-sm border border-slate-100"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Button>
        <h2 className="text-xl font-black text-slate-900">My Cart</h2>
        <div className="rounded-xl bg-white shadow-sm border border-slate-100 p-2.5">
          <ShoppingBag className="h-5 w-5 text-slate-900" />
        </div>
      </div>
      
      {cart.length === 0 ? (
        <div className="px-6 py-20 flex flex-col items-center gap-4 text-center">
          <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
            <ShoppingBag className="h-12 w-12 text-slate-200" />
          </div>
          <div>
            <p className="font-black text-xl text-slate-900">Your cart is empty</p>
            <p className="text-sm text-slate-500 font-medium">Add some fresh groceries to get started.</p>
          </div>
          <Button onClick={() => router.push('/dashboard/customer')} className="rounded-2xl h-14 px-8 font-black bg-primary">Start Shopping</Button>
        </div>
      ) : (
        <div className="px-6 space-y-4 mt-2">
          {/* Cart Items */}
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.productId} className="bg-white rounded-3xl p-4 flex gap-4 shadow-sm border border-slate-100/50 relative">
                <div className="h-24 w-24 rounded-2xl bg-slate-50 flex-shrink-0 flex items-center justify-center p-2">
                  <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h4 className="font-black text-slate-900 leading-tight">{item.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      {item.weight}{item.unit}
                    </p>
                  </div>
                  <p className="text-lg font-black text-slate-900">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end justify-between py-1">
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="text-slate-300 hover:text-destructive transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="flex items-center bg-slate-50 rounded-full border border-slate-100 p-1">
                    <button 
                      onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} 
                      className="p-1.5 hover:bg-slate-200 rounded-full transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-xs font-black">{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} 
                      className="p-1.5 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Promo Code */}
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100/50 flex items-center gap-3">
            <TicketPercent className="h-5 w-5 text-slate-400" />
            <Input 
              placeholder="Apply a promo code" 
              className="border-none bg-transparent h-auto p-0 focus-visible:ring-0 font-bold text-sm"
            />
            <Button size="sm" className="rounded-xl px-6 bg-primary font-black">Apply</Button>
          </div>

          {/* User Details */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Full Name</Label>
                <Input 
                  placeholder="Your Name" 
                  className="bg-slate-50 border-none rounded-2xl h-12 font-bold px-4 focus-visible:ring-primary shadow-inner"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Contact Number</Label>
                <Input 
                  placeholder="Your Phone" 
                  className="bg-slate-50 border-none rounded-2xl h-12 font-bold px-4 focus-visible:ring-primary shadow-inner"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery to</h3>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
               <p className="text-xs font-bold text-slate-900 leading-relaxed">
                 {deliveryAddress || 'No address found. Please update profile.'}
               </p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-slate-900 rounded-3xl p-5 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Payment Method</p>
                <p className="text-xs font-bold">Scan & Pay on Delivery</p>
              </div>
            </div>
          </div>

          {/* Bill Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100/50 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">Subtotal</span>
              <span className="text-sm font-black text-slate-900">₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-400">Delivery</span>
              <span className="text-sm font-black text-slate-900">₹{deliveryFee.toFixed(2)}</span>
            </div>
            <Separator className="bg-slate-50" />
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-slate-900">Total Cost</span>
              <span className="text-xl font-black text-primary">₹{(cartTotal + deliveryFee).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Floating Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-lg border-t border-slate-100 flex justify-center z-20">
          <Button 
            className="w-full h-16 rounded-3xl bg-primary font-black text-lg shadow-xl shadow-primary/20" 
            onClick={() => setIsConfirmOpen(true)}
            disabled={!deliveryAddress.trim() || !customerName.trim() || !contactNumber.trim()}
          >
            Checkout Now
          </Button>
        </div>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-[40px] border-none p-8">
          <AlertDialogHeader>
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
            <AlertDialogTitle className="font-black text-2xl text-center">Confirm Order?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-center text-slate-500 pt-2 leading-relaxed">
              Your fresh groceries will be delivered to <span className="text-slate-900 font-black">"{deliveryAddress}"</span> in 10-15 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 mt-6">
            <AlertDialogCancel className="flex-1 rounded-2xl h-14 border-none bg-slate-100 font-black text-slate-900">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-2xl bg-primary h-14 font-black shadow-lg shadow-primary/20" onClick={handlePlaceOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

