import { redirect } from 'next/navigation';

export default async function LegacyBookingDetailPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  redirect(`/app/schedule/${bookingId}`);
}
