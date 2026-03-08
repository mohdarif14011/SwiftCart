
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Shield, Truck } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link className="flex items-center justify-center" href="/">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="ml-2 text-xl font-bold text-primary">SwiftCart</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/auth/customer" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/auth/customer" className="text-sm font-medium hover:text-primary transition-colors">
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl text-foreground">
                  Groceries Delivered in <span className="text-primary">Minutes</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl font-medium">
                  Fresh products, smart lists, and lightning-fast delivery right to your doorstep. Experience the future of shopping with SwiftCart.
                </p>
              </div>
              <div className="pt-4">
                <Button asChild size="lg" className="rounded-full px-8 h-14 text-lg font-semibold">
                  <Link href="/auth/customer">Start Shopping</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">© 2024 SwiftCart Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className="text-[10px] hover:underline underline-offset-4 text-muted-foreground" href="#">Terms of Service</Link>
            <Link className="text-[10px] hover:underline underline-offset-4 text-muted-foreground" href="#">Privacy</Link>
          </div>
        </div>
        <nav className="sm:ml-auto flex flex-wrap justify-center gap-4 sm:gap-6 items-center">
          <Link href="/auth/staff" className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1.5 transition-colors">
            <Shield className="h-3.5 w-3.5" /> Admin Portal
          </Link>
          <Link href="/auth/staff" className="text-xs font-semibold text-slate-500 hover:text-primary flex items-center gap-1.5 transition-colors">
            <Truck className="h-3.5 w-3.5" /> Delivery Portal
          </Link>
        </nav>
      </footer>
    </div>
  );
}
