// This is a script to seed your Firestore database with initial data.
// To run this script, you would typically use a tool like ts-node.
// e.g., npx ts-node src/lib/seed.ts
// Make sure you have firebase-admin installed and configured.

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Replace with your actual service account key file
// You can download this from your Firebase project settings.
// DO NOT commit this file to your git repository.
// const serviceAccount = require('../../serviceAccountKey.json');

// For this environment, we'll use placeholder credentials.
// In a real project, you would use a service account key.
if (process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

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
    description: "Join us for the most anticipated tech event of the year! The Tech Innovators Conference brings together the brightest minds in technology, from seasoned professionals to aspiring students. This full-day event will feature keynote speeches from industry leaders, hands-on workshops, and networking opportunities. Learn about the latest trends in AI, blockchain, and sustainable tech. Whether you are looking to launch your career, find a co-founder, or simply get inspired, this is the place to be. Your ticket includes access to all sessions, a complimentary lunch, and a digital swag bag."
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
    description: "Immerse yourself in a vibrant celebration of creativity at the Art & Culture Festival. Experience a diverse showcase of visual arts, live music performances, spoken word poetry, and traditional dance. This event brings together talented artists and performers from across the university community. Browse the art exhibition, enjoy delicious food from local vendors, and participate in interactive workshops. A perfect outing for anyone passionate about culture and the arts."
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
    description: "The annual Entrepreneurship Summit is designed to inspire and equip the next generation of business leaders. Featuring successful entrepreneurs, venture capitalists, and industry experts, the summit offers invaluable insights into starting and scaling a business. Attendees will have the opportunity to pitch their ideas, receive mentorship, and network with potential investors. If you have a business idea or are passionate about innovation, this summit is a must-attend."
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
    description: "A night of glamour, celebration, and nostalgia. The Final Year Dinner & Awards is the culminating event for the graduating class. Join your classmates for a memorable evening featuring a three-course meal, live band, awards presentation, and a dance party. It's the perfect opportunity to celebrate your achievements, reflect on your journey, and make lasting memories with friends before stepping into the future. Dress to impress!"
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
    description: "Are you ready to revolutionize healthcare with artificial intelligence? Join our 48-hour hackathon and collaborate with other innovators to build solutions for real-world health challenges. This is a fantastic opportunity to showcase your skills, learn from mentors, and win amazing prizes. The hackathon is open to students from all disciplines. No prior healthcare experience required—just a passion for problem-solving and technology. Food, drinks, and swag will be provided."
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
    description: "Discover your new favorite artist at Indie Music Night. We're showcasing the best-emerging talent from the local music scene. From soulful acoustic sets to high-energy bands, the night promises a diverse range of sounds and a great atmosphere. Come support independent music, hang out with fellow music lovers, and enjoy a laid-back evening of live performances. It's the perfect way to unwind and discover the sounds of tomorrow."
  },
];


async function seedDatabase() {
  try {
    // This is a placeholder for actual admin initialization
    // In a real scenario, you'd use a service account like this:
    // initializeApp({ credential: cert(serviceAccount) });
    console.log("Connecting to Firestore...");
    const db = getFirestore();
    console.log("Firestore connected.");

    const eventsCollection = db.collection('events');
    console.log('Seeding events...');

    for (const event of mockEvents) {
      await eventsCollection.add(event);
      console.log(`Added event: ${event.title}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// To run this seeding logic, you would execute this file.
// For example, using `ts-node src/lib/seed.ts`.
// Since we can't run it here, this serves as the setup for when you do.
// We will assume the database is seeded for the next steps.
console.log("Database seeder script is ready.");
console.log("To seed the database, you would run this script in your local environment.");

// If you want to run the seeder, uncomment the following line:
// seedDatabase();
