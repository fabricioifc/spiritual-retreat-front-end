import ReportPage2 from '@/src/components/reports/ReportPage2';

interface ReportsAllPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportsAllPage({ params }: ReportsAllPageProps) {
  const { id } = await params;
  return <ReportPage2 routeCategory="all" retreatId={id} />;
}
