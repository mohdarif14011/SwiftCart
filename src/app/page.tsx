
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, ShieldCheck, MapPin } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white">
        <Link className="flex items-center justify-center" href="/">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <span className="ml-2 text-2xl font-bold font-headline text-primary tracking-tight">SwiftCart</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/auth" className="text-sm font-medium hover:text-primary transition-colors">
            Login
          </Link>
          <Link href="/auth" className="text-sm font-medium hover:text-primary transition-colors">
            Get Started
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-foreground font-headline">
                  Groceries Delivered in <span className="text-primary">Minutes</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Fresh products, smart lists, and lightning-fast delivery right to your doorstep. Experience the future of shopping with SwiftCart.
                </p>
              </div>
              <div className="space-x-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                  <Link href="/auth">Start Shopping</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10">
                  How it Works
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">Ultra Fast</h3>
                <p className="text-sm text-muted-foreground">Delivery within 15-30 minutes for all items in your neighborhood.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-accent/10 rounded-full">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold font-headline">Freshness Guaranteed</h3>
                <p className="text-sm text-muted-foreground">Hand-picked fresh produce and dairy from trusted local partners.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-primary/10 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">Smart Lists</h3>
                <p className="text-sm text-muted-foreground">Use AI to generate shopping lists based on your meal ideas.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 bg-accent/10 rounded-full">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-bold font-headline">Live Tracking</h3>
                <p className="text-sm text-muted-foreground">Real-time GPS tracking of your delivery agent from store to door.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-white">
        <p className="text-xs text-muted-foreground">© 2024 SwiftCart Inc. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">Terms of Service</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
