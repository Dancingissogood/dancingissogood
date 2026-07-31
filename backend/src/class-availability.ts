export type ClassAvailability = {
  availabilityStatus: "AVAILABLE" | "NO_VACANCY";
  spotsRemaining: number | null;
};

export function getClassAvailability(input: {
  bookingStatus: "OPEN" | "CLOSED";
  capacity: number | null;
  reservationCount: number;
}): ClassAvailability {
  const spotsRemaining = input.capacity === null
    ? null
    : Math.max(input.capacity - input.reservationCount, 0);
  const availabilityStatus = input.bookingStatus === "CLOSED" || spotsRemaining === 0
    ? "NO_VACANCY"
    : "AVAILABLE";

  return { availabilityStatus, spotsRemaining };
}
