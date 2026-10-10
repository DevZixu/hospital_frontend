"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Admission } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  AdmissionForm,
  admissionPayload,
  type AdmissionFormValues,
} from "@/components/admissions/admission-form";

export default function NewAdmissionPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: AdmissionFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const admission = await apiPost<Admission>("/admissions", admissionPayload(values));
      toast.success("Patient admitted", admission.admissionNo);
      router.push(`/admissions/${admission.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to admit patient");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/admissions" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to admissions
      </Link>
      <PageHeader title="Admit patient" description="Create an inpatient admission." />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card>
        <CardBody>
          <AdmissionForm
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => router.push("/admissions")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
