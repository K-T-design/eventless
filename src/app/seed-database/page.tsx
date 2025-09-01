
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { firestore } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, writeBatch, doc } from 'firebase/firestore';

const mockEvents = [
  {
    title: "Tech Innovators Conference 2024",
    university: "University of Lagos",
    date: new Date("2024-10-26T09:00:00"),
    time: "9:00 AM - 5:00 PM",
    location: "Main Auditorium",
    price: 2500,
    imageUrl: "https://picsum.photos/1200/600?random=1",
    imageHint: "tech conference hall",
    description: "Join us for the most anticipated tech event of the year! The Tech Innovators Conference brings together the brightest minds in technology, from seasoned professionals to aspiring students. This full-day event will feature keynote speeches from industry leaders, hands-on workshops, and networking opportunities. Learn about the latest trends in AI, blockchain, and sustainable tech. Whether you are looking to launch your career, find a co-founder, or simply get inspired, this is the place to be. Your ticket includes access to all sessions, a complimentary lunch, and a digital swag bag.",
    status: 'approved',
    createdAt: serverTimestamp(),
  },
  {
    title: "Art & Culture Festival",
    university: "University of Ibadan",
    date: new Date("2024-11-05T12:00:00"),
    time: "12:00 PM - 8:00 PM",
    location: "Faculty of Arts",
    price: 1000,
    imageUrl: "https://picsum.photos/1200/600?random=2",
    imageHint: "art festival outdoor",
    description: "Immerse yourself in a vibrant celebration of creativity at the Art & Culture Festival. Experience a diverse showcase of visual arts, live music performances, spoken word poetry, and traditional dance. This event brings together talented artists and performers from across the university community. Browse the art exhibition, enjoy delicious food from local vendors, and participate in interactive workshops. A perfect outing for anyone passionate about culture and the arts.",
    status: 'approved',
    createdAt: serverTimestamp(),
  },
  {
    title: "Entrepreneurship Summit",
    university: "Covenant University",
    date: new Date("2024-11-12T10:00:00"),
    time: "10:00 AM - 4:00 PM",
    location: "CUCRID Building",
    price: 5000,
    imageUrl: "https://picsum.photos/1200/600?random=3",
    imageHint: "business seminar",
    description: "The annual Entrepreneurship Summit is designed to inspire and equip the next generation of business leaders. Featuring successful entrepreneurs, venture capitalists, and industry experts, the summit offers invaluable insights into starting and scaling a business. Attendees will have the opportunity to pitch their ideas, receive mentorship, and network with potential investors. If you have a business idea or are passionate about innovation, this summit is a must-attend.",
    status: 'pending',
    createdAt: serverTimestamp(),
  },
  {
    title: "Final Year Dinner & Awards",
    university: "University of Lagos",
    date: new Date("2024-11-18T19:00:00"),
    time: "7:00 PM - 11:00 PM",
    location: "Jelili Omotola Halls",
    price: 15000,
    imageUrl: "https://picsum.photos/1200/600?random=4",
    imageHint: "elegant dinner party",
    description: "A night of glamour, celebration, and nostalgia. The Final Year Dinner & Awards is the culminating event for the graduating class. Join your classmates for a memorable evening featuring a three-course meal, live band, awards presentation, and a dance party. It's the perfect opportunity to celebrate your achievements, reflect on your journey, and make lasting memories with friends before stepping into the future. Dress to impress!",
    status: 'approved',
    createdAt: serverTimestamp(),
  },
   {
    title: "AI in Healthcare Hackathon",
    university: "Obafemi Awolowo University",
    date: new Date("2024-11-20T09:00:00"),
    time: "48 Hours",
    location: "ICT Centre",
    price: 0,
    imageUrl: "https://picsum.photos/1200/600?random=5",
    imageHint: "students programming",
    description: "Are you ready to revolutionize healthcare with artificial intelligence? Join our 48-hour hackathon and collaborate with other innovators to build solutions for real-world health challenges. This is a fantastic opportunity to showcase your skills, learn from mentors, and win amazing prizes. The hackathon is open to students from all disciplines. No prior healthcare experience required—just a passion for problem-solving and technology. Food, drinks, and swag will be provided.",
    status: 'approved',
    createdAt: serverTimestamp(),
  },
   {
    title: "Indie Music Night",
    university: "University of Nigeria, Nsukka",
    date: new Date("2024-12-02T18:00:00"),
    time: "6:00 PM - 10:00 PM",
    location: "Student Union Building",
    price: 1500,
    imageUrl: "https://picsum.photos/1200/600?random=6",
    imageHint: "concert stage lights",
    description: "Discover your new favorite artist at Indie Music Night. We're showcasing the best-emerging talent from the local music scene. From soulful acoustic sets to high-energy bands, the night promises a diverse range of sounds and a great atmosphere. Come support independent music, hang out with fellow music lovers, and enjoy a laid-back evening of live performances. It's the perfect way to unwind and discover the sounds of tomorrow.",
    status: 'pending',
    createdAt: serverTimestamp(),
  },
];


export default function SeedDatabasePage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    async function seedDatabase() {
        setLoading(true);
        setStatus('idle');
        setMessage('');

        try {
            const eventsCollectionRef = collection(firestore, 'events');
            
            // Check if events already exist to prevent duplicates
            const existingEvents = await getDocs(eventsCollectionRef);
            if (!existingEvents.empty) {
                 setStatus('error');
                 setMessage('Database already contains event data. Seeding was skipped to prevent duplicates. To re-seed, please clear the "events" collection in your Firestore console.');
                 setLoading(false);
                 return;
            }

            // Use a batch write for efficiency
            const batch = writeBatch(firestore);
            mockEvents.forEach(event => {
                const newDocRef = doc(collection(firestore, 'events'));
                batch.set(newDocRef, { ...event, organizerId: 'super_admin_seed' }); 
            });
            
            await batch.commit();

            setStatus('success');
            setMessage(`${mockEvents.length} events have been successfully added to your database.`);
        } catch (error: any) {
            console.error("Error seeding database: ", error);
            setStatus('error');
            setMessage(`An error occurred: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 text-center">
            <h1 className="text-3xl font-bold font-headline mb-4">Seed Database</h1>
            <p className="text-muted-foreground mb-8">
                This is a one-time action to populate your Firestore database with sample event data.
            </p>

            <div className="bg-card p-8 rounded-lg shadow-sm border">
                <Button onClick={seedDatabase} disabled={loading || status === 'success'} size="lg">
                    {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {status === 'success' ? 'Seeding Complete' : 'Start Seeding'}
                </Button>

                {status !== 'idle' && (
                    <div className="mt-6 text-left">
                        {status === 'success' && (
                            <div className="flex items-center gap-3 p-4 rounded-md bg-green-50 border border-green-200 text-green-800">
                                <CheckCircle className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold">Success!</h3>
                                    <p className="text-sm">{message}</p>
                                </div>
                            </div>
                        )}
                         {status === 'error' && (
                            <div className="flex items-center gap-3 p-4 rounded-md bg-red-50 border border-red-200 text-red-800">
                                <XCircle className="h-6 w-6" />
                                <div>
                                    <h3 className="font-semibold">Error</h3>
                                    <p className="text-sm">{message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                 <p className="text-xs text-muted-foreground mt-8">
                    Note: This is a temporary developer tool. This page should be removed before launching your application to production.
                </p>
            </div>
        </div>
    );
}
