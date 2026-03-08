
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ShoppingBag, Plus, Minus, ArrowLeft, MapPin, CreditCard, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function CustomerCart() {
  const { cart, updateCartQuantity, placeOrder } = useAppStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [paymentType, setPaymentType] = useState('cod');
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
  const deliveryFee = cart.length > 0 ? 2.00 : 0;

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
      paymentMethod: paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment',
    };

    setDocumentNonBlocking(doc(db, 'orders', orderId), newOrder, { merge: true });
    placeOrder(newOrder);
    router.push(`/dashboard/customer/orders?success=${orderId}`);
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()} 
          className="rounded-full bg-white shadow-sm hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-900" />
        </Button>
        <h2 className="text-2xl font-black text-slate-900">My Basket</h2>
      </div>
      
      {cart.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4 text-center">
          <div className="p-6 bg-white rounded-full shadow-inner">
            <ShoppingBag className="h-12 w-12 text-slate-200" />
          </div>
          <div>
            <p className="font-bold text-slate-900">Your basket is empty</p>
            <p className="text-sm text-slate-500">Add some fresh groceries to get started.</p>
          </div>
          <Button onClick={() => router.push('/dashboard/customer')} className="rounded-xl font-bold">Start Shopping</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Cart Items */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Order Items</h3>
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.productId} className="flex gap-4 items-center">
                  <div className="h-16 w-16 rounded-xl bg-slate-50 flex-shrink-0 border p-2">
                    <img src={item.imageUrl} alt={item.name} className="object-contain w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500 font-bold">${item.price.toFixed(2)} / unit</p>
                  </div>
                  <div className="flex items-center bg-slate-100 rounded-lg overflow-hidden shrink-0">
                    <button onClick={() => updateCartQuantity(item.productId, item.quantity - 1)} className="p-1 hover:bg-slate-200 transition-colors">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm font-black">{item.quantity}</span>
                    <button onClick={() => updateCartQuantity(item.productId, item.quantity + 1)} className="p-1 hover:bg-slate-200 transition-colors">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Personal Details</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name" className="text-xs font-bold text-slate-500">Name</Label>
                <Input 
                  id="customer-name"
                  placeholder="Your Name" 
                  className="bg-slate-50 border-none rounded-xl h-12 font-bold focus-visible:ring-primary"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-number" className="text-xs font-bold text-slate-500">Contact Number</Label>
                <Input 
                  id="contact-number"
                  placeholder="Your Phone Number" 
                  className="bg-slate-50 border-none rounded-xl h-12 font-bold focus-visible:ring-primary"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Delivery Address</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <p className="text-sm font-bold text-slate-900 leading-relaxed">
                 {deliveryAddress || 'No delivery address found in your profile. Please complete onboarding.'}
               </p>
            </div>
          </div>

          {/* Payment Type */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-400">Payment Type</h3>
            </div>
            
            <p className="text-xs font-bold text-accent bg-accent/5 p-3 rounded-xl border border-accent/20">
              Scan and pay at the time of delivery
            </p>

            <RadioGroup value={paymentType} onValueChange={setPaymentType} className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                <Label
                  htmlFor="cod"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-slate-50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                >
                  <span className="text-sm font-bold">Cash on Delivery</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="online" id="online" className="peer sr-only" />
                <Label
                  htmlFor="online"
                  className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-slate-50 hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all h-full"
                >
                  <span className="text-sm font-bold">Online Payment</span>
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Summary and Action */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Delivery Fee</span>
                <span className="font-bold">${deliveryFee.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-xl font-black pt-2">
                <span>Total</span>
                <span>${(cartTotal + deliveryFee).toFixed(2)}</span>
              </div>
            </div>
            
            <Button 
              className="w-full h-14 rounded-2xl bg-primary font-black shadow-lg text-lg" 
              onClick={() => setIsConfirmOpen(true)}
              disabled={!deliveryAddress.trim() || !customerName.trim() || !contactNumber.trim()}
            >
              Place Order
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl">Confirm Order?</AlertDialogTitle>
            <AlertDialogDescription className="font-medium">
              Your order will be delivered to <span className="text-slate-900 font-bold">"{deliveryAddress}"</span> in approximately 10-15 minutes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 mt-4">
            <AlertDialogCancel className="flex-1 rounded-xl h-12 border-none bg-slate-100 font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-xl bg-primary h-12 font-bold" onClick={handlePlaceOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
