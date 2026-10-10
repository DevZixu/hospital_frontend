import { NewAppointmentClient } from "./appointment-new";

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patientId?: string }>;
}) {
  const params = await searchParams;
  return <NewAppointmentClient defaultPatientId={params.patientId} />;
}
