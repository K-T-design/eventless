"use client"

import { Button } from "@/components/ui/button";
import { PlusCircle, QrCode, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import dynamic from 'next/dynamic';

const VanillaGlass = dynamic(() => import('@/components/vanilla-glass'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-200 animate-pulse rounded-lg"></div>
});


export default function Home() {
  return (
    <div className="flex flex-col bg-slate-50">
      <section className="relative w-full h-[60vh] md:h-[70vh]">
        <Image
          src="https://picsum.photos/1920/1080"
          alt="Dynamic crowd at a university event"
          fill
          className="object-cover"
          data-ai-hint="event crowd"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground p-4">
          <div className="bg-black/30 backdrop-blur-sm p-8 rounded-lg">
            <h1 className="text-4xl md:text-6xl font-headline font-bold mb-4 drop-shadow-md">
              Your Event Journey Starts Here
            </h1>
            <p className="text-lg md:text-xl max-w-2xl mb-8 drop-shadow">
              Discover, create, and manage university events seamlessly. E-Ventless brings your campus to life.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/discover">Discover Events</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/create-event">Create an Event</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section 
        id="platform" 
        className="w-full py-16 md:py-24 bg-white"
      >
        <div className="container mx-auto px-4 md:px-6">
           <div
            className="rounded-2xl shadow-2xl overflow-hidden"
           >
                <div 
                    className="py-20 px-6 text-center text-white relative bg-indigo-600"
                    style={{
                        backgroundImage: `linear-gradient(rgba(79, 70, 229, 0.9), rgba(79, 70, 229, 0.95)), url('https://ik.imagekit.io/t48u898g8/eventless_logo-removebg-preview%20(2).png?updatedAt=1757007814945')`,
                        backgroundSize: 'contain',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-shadow-lg">All-in-One Event Platform</h2>
                    <p className="text-lg md:text-xl max-w-3xl mx-auto opacity-95">Discover, create, and manage events with our comprehensive platform designed for universities and communities</p>
                </div>
                <div className="p-8 md:p-16 bg-slate-50">
                    <div className="grid md:grid-cols-3 gap-8 mb-16">
                        <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                           <Search className="h-12 w-12 text-indigo-600 mx-auto mb-4"/>
                           <h3 className="text-xl font-bold mb-2 text-slate-800">Event Discovery</h3>
                           <p className="text-slate-600">Easily find events from your university. Filter by category, search by name, and never miss out on what's happening on campus.</p>
                        </div>
                         <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                           <PlusCircle className="h-12 w-12 text-indigo-600 mx-auto mb-4"/>
                           <h3 className="text-xl font-bold mb-2 text-slate-800">Simple Event Creation</h3>
                           <p className="text-slate-600">Organizing an event? Create your event page in minutes with our intuitive form. Free plans available for individuals and small groups.</p>
                        </div>
                         <div className="text-center p-6 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all">
                           <QrCode className="h-12 w-12 text-indigo-600 mx-auto mb-4"/>
                           <h3 className="text-xl font-bold mb-2 text-slate-800">Effortless Check-in</h3>
                           <p className="text-slate-600">Streamline entry to your events with our mobile-friendly QR code scanner. Validate tickets instantly and keep the line moving.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div className="p-4">
                            <p className="text-4xl font-bold text-indigo-600">500+</p>
                            <p className="text-slate-500">Events Created</p>
                        </div>
                         <div className="p-4">
                            <p className="text-4xl font-bold text-indigo-600">10K+</p>
                            <p className="text-slate-500">Tickets Sold</p>
                        </div>
                         <div className="p-4">
                            <p className="text-4xl font-bold text-indigo-600">98%</p>
                            <p className="text-slate-500">User Satisfaction</p>
                        </div>
                         <div className="p-4">
                            <p className="text-4xl font-bold text-indigo-600">24/7</p>
                            <p className="text-slate-500">Support Available</p>
                        </div>
                    </div>
                </div>
                 <div className="bg-indigo-600 p-10 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                    <p className="max-w-xl mx-auto mb-6 opacity-90">Join thousands of event organizers and attendees who are already using our platform to create amazing experiences.</p>
                    <Button size="lg" asChild className="bg-white text-indigo-600 font-bold hover:bg-slate-100 rounded-full px-8 py-6 text-base shadow-lg hover:-translate-y-0.5 transition-transform">
                        <Link href="/create-event">Create Your Event Now</Link>
                    </Button>
                </div>
           </div>
        </div>
      </section>

      <section className="w-full py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4">A Touch of Magic</h2>
                <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground">Interact with the component below.</p>
            </div>
             <div className="h-[500px] relative rounded-lg overflow-hidden shadow-2xl bg-muted">
                <Suspense fallback={<div className="w-full h-full bg-muted rounded-lg flex items-center justify-center"><p>Loading 3D Component...</p></div>}>
                    <VanillaGlass />
                </Suspense>
            </div>
        </div>
      </section>

    </div>
  );
}
