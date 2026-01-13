import React from 'react';

import PublicRetreatInfoServer from '@/src/components/public/retreats/PublicRetreatInfoServer';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PublicRetreatInfoServer retreatId={id} />;
}
