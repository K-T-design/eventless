
"use client";
import { useEffect, useMemo, useState } from "react";
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
import { Search, Calendar as CalendarIcon } from "lucide-react";
import { firestore } from "@/lib/firebase";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_CATEGORIES } from "@/lib/categories";
import { NIGERIAN_UNIVERSITIES } from "@/lib/universities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addDays, format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";

export default function DiscoverPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsRef = collection(firestore, "events");
        const q = query(eventsRef, where("status", "==", "approved"));
        const eventSnapshot = await getDocs(q);
        const eventsList = eventSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: (data.date as Timestamp).toDate(),
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
  
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((event) =>
        selectedUniversity !== 'all' ? event.university === selectedUniversity : true
      )
      .filter((event) =>
        selectedCategory !== 'all' ? event.category === selectedCategory : true
      )
      .filter((event) => {
        if (!date?.from) return true;
        const fromDate = new Date(date.from.setHours(0,0,0,0));
        const toDate = date.to ? new Date(date.to.setHours(23,59,59,999)) : fromDate;
        
        return event.date >= fromDate && event.date <= toDate;
      });
  }, [events, searchTerm, selectedUniversity, selectedCategory, date]);
  
  const universities = useMemo(() => {
    const uniqueUniversities = [...new Set(events.map(event => event.university))];
    return uniqueUniversities.length > 0 ? uniqueUniversities.sort() : NIGERIAN_UNIVERSITIES.sort();
  }, [events]);

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Discover Events</h1>
        <p className="text-muted-foreground mt-2">
          Find out what's happening on campuses near you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4 bg-card rounded-lg shadow-sm sticky top-16 z-40">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search by event title..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select onValueChange={setSelectedUniversity} defaultValue={selectedUniversity}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map(uni => (
              <SelectItem key={uni} value={uni}>{uni}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <Select onValueChange={setSelectedCategory} defaultValue={selectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {EVENT_CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
         <div className="md:col-span-2 lg:col-span-4">
             <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
        </div>
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

    