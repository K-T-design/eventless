
"use client";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/event-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Event } from "@/types";
import { Search } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function DiscoverPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        // Only fetch events that have been approved
        const eventsRef = collection(firestore, "events");
        const q = query(eventsRef, where("status", "==", "approved"));
        const eventSnapshot = await getDocs(q);
        const eventsList = eventSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(), // Convert Firestore Timestamp to Date
          } as Event;
        });
        setEvents(eventsList);
      } catch (error) {
        console.error("Error fetching approved events: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const filteredEvents = events
    .filter((event) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((event) =>
      selectedUniversity ? event.university === selectedUniversity : true
    );
  
  // Create a unique list of universities from the approved events
  const universities = [...new Set(events.map(event => event.university))];

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Discover Events</h1>
        <p className="text-muted-foreground mt-2">
          Find out what's happening on campuses near you.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-card rounded-lg shadow-sm sticky top-16 z-40">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by event title..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={setSelectedUniversity} value={selectedUniversity}>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter by university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Universities</SelectItem>
            {universities.map(uni => (
              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
         <div className="text-center py-12 border-2 border-dashed rounded-lg col-span-full">
            <p className="text-muted-foreground">No events found. Try adjusting your filters.</p>
        </div>
      )}
    </div>
  );
}
