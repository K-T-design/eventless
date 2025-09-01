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

const mockEvents: Event[] = [
  {
    id: "1",
    title: "Tech Innovators Conference 2024",
    university: "University of Lagos",
    date: "October 26, 2024",
    location: "Main Auditorium",
    price: 2500,
    imageUrl: "https://picsum.photos/600/400?random=1",
    imageHint: "tech conference",
  },
  {
    id: "2",
    title: "Art & Culture Festival",
    university: "University of Ibadan",
    date: "November 5, 2024",
    location: "Faculty of Arts",
    price: 1000,
    imageUrl: "https://picsum.photos/600/400?random=2",
    imageHint: "art festival",
  },
  {
    id: "3",
    title: "Entrepreneurship Summit",
    university: "Covenant University",
    date: "November 12, 2024",
    location: "CUCRID Building",
    price: 5000,
    imageUrl: "https://picsum.photos/600/400?random=3",
    imageHint: "business summit",
  },
  {
    id: "4",
    title: "Final Year Dinner & Awards",
    university: "University of Lagos",
    date: "November 18, 2024",
    location: "Jelili Omotola Halls",
    price: 15000,
    imageUrl: "https://picsum.photos/600/400?random=4",
    imageHint: "formal dinner",
  },
   {
    id: "5",
    title: "AI in Healthcare Hackathon",
    university: "Obafemi Awolowo University",
    date: "November 20, 2024",
    location: "ICT Centre",
    price: 0,
    imageUrl: "https://picsum.photos/600/400?random=5",
    imageHint: "students coding",
  },
   {
    id: "6",
    title: "Indie Music Night",
    university: "University of Nigeria, Nsukka",
    date: "December 2, 2024",
    location: "Student Union Building",
    price: 1500,
    imageUrl: "https://picsum.photos/600/400?random=6",
    imageHint: "live music",
  },
];

export default function DiscoverPage() {
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
          <Input placeholder="Search by event title..." className="pl-10" />
        </div>
        <Select>
          <SelectTrigger className="w-full md:w-[280px]">
            <SelectValue placeholder="Filter by university" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unilag">University of Lagos</SelectItem>
            <SelectItem value="ui">University of Ibadan</SelectItem>
            <SelectItem value="cu">Covenant University</SelectItem>
            <SelectItem value="oau">Obafemi Awolowo University</SelectItem>
            <SelectItem value="unn">University of Nigeria, Nsukka</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {mockEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
