
'use server';

import { firestore } from '@/lib/firebase-admin';
import type { Event } from "@/types";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, subDays } from 'date-fns';

const SERVICE_FEE = 150;

export type NewUsersData = { date: string, users: number };

export async function getDashboardData() {
    try {
        const usersCollection = firestore.collection("users");
        const eventsCollection = firestore.collection("events");
        const ticketsCollection = firestore.collection("tickets");

        // --- Fetch Stats ---
        const usersSnapshot = await usersCollection.count().get();
        const eventsSnapshot = await eventsCollection.count().get();
        const pendingSnapshot = await eventsCollection.where("status", "==", "pending").count().get();
        const paidTicketsSnapshot = await ticketsCollection.where("tier.price", ">", 0).count().get();

        const stats = {
            totalUsers: usersSnapshot.data().count,
            totalEvents: eventsSnapshot.data().count,
            pendingEvents: pendingSnapshot.data().count,
            totalRevenue: paidTicketsSnapshot.data().count * SERVICE_FEE,
        };

        // --- Fetch Recent Events ---
        const recentEventsQuery = eventsCollection.orderBy("createdAt", "desc").limit(5);
        const recentEventsSnapshot = await recentEventsQuery.get();
        const recentEvents = recentEventsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                date: data.date.toDate(),
                createdAt: data.createdAt.toDate(),
            } as Event;
        });
        
        // --- Fetch New Users Chart Data ---
        const now = new Date();
        const firstDay = startOfMonth(now);
        const lastDay = endOfMonth(now);
        
        const usersQuery = usersCollection
            .where('metadata.dateCreated', '>=', firstDay)
            .where('metadata.dateCreated', '<=', lastDay);

        const newUsersSnapshot = await usersQuery.get();

        const dailyCounts: { [key: string]: number } = {};
        
        newUsersSnapshot.docs.forEach(doc => {
            const user = doc.data();
            const dateCreated = user.metadata.dateCreated.toDate();
            const day = format(dateCreated, 'yyyy-MM-dd');
            if (dailyCounts[day]) {
                dailyCounts[day]++;
            } else {
                dailyCounts[day] = 1;
            }
        });

        const allDays = eachDayOfInterval({ start: firstDay, end: lastDay });
        const newUsersData: NewUsersData[] = allDays.map(day => {
            const formattedDay = format(day, 'yyyy-MM-dd');
            return {
                date: formattedDay,
                users: dailyCounts[formattedDay] || 0
            }
        });
        
        return { 
            success: true, 
            data: { stats, recentEvents, newUsersData }
        };

    } catch (error: any) {
        console.error("Error fetching dashboard data:", error);
        return { success: false, message: error.message };
    }
}
