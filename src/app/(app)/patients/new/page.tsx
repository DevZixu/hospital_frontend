"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Patient } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { PatientForm, patientPayload, type PatientFormValues } from "@/components/patients/patient-form";

export default function NewPatientPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: PatientFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const patient = await apiPost<Patient>("/patients", patientPayload(values));
      toast.success("Patient registered", `${patient.firstName} ${patient.lastName} was added.`);
      router.push(`/patients/${patient.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to register patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>
      <PageHeader title="Register patient" description="Create a new patient record." />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card>
        <CardBody>
          <PatientForm
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => router.push("/patients")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
