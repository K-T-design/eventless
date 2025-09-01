import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Ticket, University } from "lucide-react";
import Image from "next/image";

// Mock data - we will replace this with a database call
const mockEvent = {
    id: "1",
    title: "Tech Innovators Conference 2024",
    university: "University of Lagos",
    date: "October 26, 2024",
    time: "9:00 AM - 5:00 PM",
    location: "Main Auditorium",
    price: 2500,
    imageUrl: "https://picsum.photos/1200/600?random=1",
    imageHint: "tech conference hall",
    description: "Join us for the most anticipated tech event of the year! The Tech Innovators Conference brings together the brightest minds in technology, from seasoned professionals to aspiring students. This full-day event will feature keynote speeches from industry leaders, hands-on workshops, and networking opportunities. Learn about the latest trends in AI, blockchain, and sustainable tech. Whether you are looking to launch your career, find a co-founder, or simply get inspired, this is the place to be. Your ticket includes access to all sessions, a complimentary lunch, and a digital swag bag."
};


export default function EventDetailPage({ params }: { params: { id: string } }) {
  // In the future, we will use params.id to fetch data from Firestore.
  const event = mockEvent;

  return (
    <div className="container mx-auto max-w-5xl py-12 px-4">
      <div className="grid md:grid-cols-2 gap-8 md:gap-12">
        <div className="relative aspect-video rounded-lg overflow-hidden">
             <Image
                src={event.imageUrl}
                alt={event.title}
                fill
                className="object-cover"
                data-ai-hint={event.imageHint}
            />
        </div>
        
        <div className="flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline mb-4">{event.title}</h1>
            <div className="flex flex-col gap-4 text-lg text-muted-foreground">
                <div className="flex items-center gap-3">
                    <University className="h-5 w-5 text-primary" />
                    <span>{event.university}</span>
                </div>
                <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{event.date}</span>
                </div>
                 <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{event.time}</span>
                </div>
                <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.location}</span>
                </div>
            </div>
             <div className="mt-8 flex items-center justify-between bg-muted/50 p-6 rounded-lg">
                <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-3xl font-bold text-primary">
                        {event.price > 0 ? `₦${event.price.toLocaleString()}` : 'Free'}
                    </p>
                </div>
                <Button size="lg" className="flex items-center gap-2">
                    <Ticket className="h-5 w-5"/>
                    Buy Ticket
                </Button>
            </div>
        </div>
        
        <div className="md:col-span-2">
            <h2 className="text-3xl font-bold font-headline mb-4 border-b pb-2">About this Event</h2>
            <p className="text-muted-foreground leading-relaxed">
                {event.description}
            </p>
        </div>
      </div>
    </div>
  )
}
