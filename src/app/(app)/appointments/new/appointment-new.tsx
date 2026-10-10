"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Appointment } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import {
  AppointmentForm,
  appointmentPayload,
  type AppointmentFormValues,
} from "@/components/appointments/appointment-form";

export function NewAppointmentClient({ defaultPatientId }: { defaultPatientId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: AppointmentFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const appointment = await apiPost<Appointment>("/appointments", appointmentPayload(values));
      toast.success("Appointment booked", appointment.appointmentNo);
      router.push(`/appointments/${appointment.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to book appointment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to appointments
      </Link>
      <PageHeader title="Book appointment" description="Schedule a visit for a patient." />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card>
        <CardBody>
          <AppointmentForm
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => router.push("/appointments")}
            defaultPatientId={defaultPatientId}
          />
        </CardBody>
      </Card>
    </div>
  );
}
