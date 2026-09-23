import { redirect } from 'next/navigation';

export default function LegacyBookingRequestsPage() {
  redirect('/app/schedule');
}
