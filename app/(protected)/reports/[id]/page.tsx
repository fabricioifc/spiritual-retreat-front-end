import { redirect } from 'next/navigation';

interface ReportByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportByIdPage({ params }: ReportByIdPageProps) {
  const { id } = await params;
  redirect(`/reports/${id}/all`);
}
