import { OperationsPropertyForm } from '@/components/operations-pages';

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OperationsPropertyForm propertyId={id} />;
}
