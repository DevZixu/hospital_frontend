"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import type { Patient } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { LoadingBlock } from "@/components/ui/spinner";
import { PatientForm, patientPayload, type PatientFormValues } from "@/components/patients/patient-form";

export default function EditPatientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: patient, loading, error: loadError } = useAsync(
    () => apiGet<Patient>(`/patients/${params.id}`),
    [params.id],
  );

  const onSubmit = async (values: PatientFormValues) => {
    if (!patient) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiPatch<Patient>(`/patients/${patient.id}`, patientPayload(values));
      toast.success("Patient updated");
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/patients/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patient
      </Link>
      <PageHeader title="Edit patient" description="Update the patient record." />
      {loadError ? <Alert tone="danger">{loadError}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {loading ? (
        <LoadingBlock />
      ) : patient ? (
        <Card>
          <CardBody>
            <PatientForm
              patient={patient}
              submitting={submitting}
              onSubmit={onSubmit}
              onCancel={() => router.push(`/patients/${patient.id}`)}
            />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
