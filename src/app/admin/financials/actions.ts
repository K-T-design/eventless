'use server';

import { firestore } from '@/lib/firebase-admin';
import { startOfMonth, subMonths, format } from 'date-fns';

const SERVICE_FEE = 150;

type MonthlyRevenue = {
  month: string;
  revenue: number;
};

export async function getMonthlyRevenue(): Promise<{ success: boolean; data?: MonthlyRevenue[]; message?: string }> {
  try {
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));

    const ticketsRef = firestore.collection('tickets');
    const q = ticketsRef
        .where('purchaseDate', '>=', sixMonthsAgo)
        .where('tier.price', '>', 0);
        
    const snapshot = await q.get();

    if (snapshot.empty) {
      // Return last 6 months with 0 revenue if no tickets found
      const emptyData = Array.from({ length: 6 }).map((_, i) => {
        const date = subMonths(new Date(), i);
        return {
          month: format(date, 'MMMM'),
          revenue: 0,
        };
      }).reverse();
      return { success: true, data: emptyData };
    }

    const monthlyTotals: { [key: string]: number } = {};

    snapshot.docs.forEach(doc => {
      const ticket = doc.data();
      // Ensure purchaseDate is a valid Date object
      const purchaseDate = ticket.purchaseDate?.toDate();
      if (purchaseDate instanceof Date && !isNaN(purchaseDate.valueOf())) {
         const month = format(purchaseDate, 'yyyy-MM');
        if (!monthlyTotals[month]) {
            monthlyTotals[month] = 0;
        }
        monthlyTotals[month] += SERVICE_FEE;
      }
    });

    const chartData: MonthlyRevenue[] = Array.from({ length: 6 }).map((_, i) => {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'yyyy-MM');
      const monthName = format(date, 'MMMM');
      return {
        month: monthName,
        revenue: monthlyTotals[monthKey] || 0,
      };
    }).reverse(); // To have the current month last

    return { success: true, data: chartData };

  } catch (error: any) {
    console.error("Error fetching monthly revenue: ", error);
    return { success: false, message: error.message || "Failed to fetch revenue data." };
  }
}
