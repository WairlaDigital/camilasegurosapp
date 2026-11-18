import type { SeatTypeOption } from "@/types/quote";

/**
 * Type whose seat range includes the seats, among the types of a class with
 * several (same rule as the backend's /query-plate). Null when none fits: the
 * quoted type stays.
 */
export function typeIdForSeats(options: readonly SeatTypeOption[], seats: number): number | null {
  if (!Number.isInteger(seats) || seats < 1) return null;
  const match = options.find(
    (option) => (option.minSeats === undefined || seats >= option.minSeats) && (option.maxSeats === undefined || seats <= option.maxSeats),
  );
  return match?.id ?? null;
}
