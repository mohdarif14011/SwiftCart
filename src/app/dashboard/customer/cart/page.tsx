
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/app/lib/store';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Trash2, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function CustomerCart() {
  const { cart, updateCartQuantity, removeFromCart, placeOrder } = useAppStore();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const router = useRouter();
  const db = useFirestore();
  const { user: firebaseUser } = useUser();

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = cart.length > 0 ? 2.00 : 0;

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;
    const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
    const newOrder = {
      id: orderId,
      userId: firebaseUser?.uid || 'anonymous',
      items: [...cart],
      total: cartTotal + deliveryFee,
      status: 'CONFIRMED' as const,
      createdAt: new Date().toISOString(),
      address: 'Delivery to your current location',
    };

    setDocumentNonBlocking(doc(db, 'orders', orderId), newOrder, { merge: true });
    placeOrder(newOrder);
    router.push(`/dashboard/customer/orders?success=${orderId}`);
  };

  return (
    <div className="p-4 bg-slate-50 space-y-6">
      <h2 className="text-2xl font-black text-slate-900">My Basket</h2>
      
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
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
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
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Delivery Fee</span>
                <span className="font-bold">${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-black pt-2">
                <span>Total</span>
                <span>${(cartTotal + deliveryFee).toFixed(2)}</span>
              </div>
            </div>
            
            <Button className="w-full h-14 rounded-2xl bg-primary font-black shadow-lg" onClick={() => setIsConfirmOpen(true)}>
              Place Order
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black">Confirm Order?</AlertDialogTitle>
            <AlertDialogDescription>Your order will be delivered in approximately 10-15 minutes.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="flex-1 rounded-xl bg-primary" onClick={handlePlaceOrder}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
