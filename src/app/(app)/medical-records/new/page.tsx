"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { MedicalRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  MedicalRecordForm,
  recordPayload,
  type MedicalRecordFormValues,
} from "@/components/medical-records/medical-record-form";

export default function NewMedicalRecordPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: MedicalRecordFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const record = await apiPost<MedicalRecord>("/medical-records", recordPayload(values));
      toast.success("Medical record created", record.recordNo);
      router.push(`/medical-records/${record.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/medical-records"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to records
      </Link>
      <PageHeader title="New medical record" description="Document a clinical encounter." />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card>
        <CardBody>
          <MedicalRecordForm
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => router.push("/medical-records")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
