import { format, subDays, isAfter, isBefore } from "date-fns";

export const defaultDateBegin = format(subDays(new Date(), 30), 'yyyy-MM-dd');
export const defaultDateEnd = format(new Date(), 'yyyy-MM-dd');

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(1);
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string | null | undefined, timeString: string | null | undefined): string {
  if (!dateString) return "—";
  try {
    const formattedDate = format(new Date(dateString), 'MMM d, yyyy');
    if (!timeString) return formattedDate;
    return `${formattedDate} at ${timeString}`;
  } catch (e) {
    return dateString;
  }
}
