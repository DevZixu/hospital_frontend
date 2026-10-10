"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, RefreshCw, Stethoscope } from "lucide-react";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { APPOINTMENT_STATUS_OPTIONS, statusTone } from "@/lib/constants";
import { formatDateTime, fullName, humanize } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export default function AppointmentDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [statusOpen, setStatusOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("CONFIRMED");
  const [cancellationReason, setCancellationReason] = useState("");
  const [newTime, setNewTime] = useState("");
  const [duration, setDuration] = useState("30");

  const { data: appointment, loading, error: loadError, refetch } = useAsync(
    () => apiGet<Appointment>(`/appointments/${params.id}`),
    [params.id],
  );

  const updateStatus = async () => {
    if (!appointment) return;
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/appointments/${appointment.id}/status`, {
        status,
        cancellationReason: cancellationReason || undefined,
      });
      toast.success("Status updated");
      setStatusOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to update status");
    } finally {
      setSaving(false);
    }
  };

  const reschedule = async () => {
    if (!appointment) return;
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/appointments/${appointment.id}/reschedule`, {
        scheduledAt: new Date(newTime).toISOString(),
        duration: Number(duration),
      });
      toast.success("Appointment rescheduled");
      setRescheduleOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to reschedule");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading appointment…" />;
  if (loadError || !appointment) return <Alert tone="danger">{loadError ?? "Appointment not found"}</Alert>;

  const canChange = !["COMPLETED", "CANCELLED"].includes(appointment.status);

  return (
    <div className="space-y-6">
      <Link
        href="/appointments"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to appointments
      </Link>

      <PageHeader title={appointment.appointmentNo} description={humanize(appointment.type)}>
        {canChange ? (
          <>
            <Button variant="outline" onClick={() => setRescheduleOpen(true)}>
              <RefreshCw className="h-4 w-4" />
              Reschedule
            </Button>
            <Button onClick={() => setStatusOpen(true)}>Update status</Button>
          </>
        ) : null}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Appointment</CardTitle>
            <Badge tone={statusTone(appointment.status)}>{humanize(appointment.status)}</Badge>
          </CardHeader>
          <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Scheduled" value={formatDateTime(appointment.scheduledAt)} />
            <Detail label="Duration" value={`${appointment.duration} minutes`} />
            <Detail label="Type" value={humanize(appointment.type)} />
            <Detail label="Follow-up" value={appointment.isFollowUp ? "Yes" : "No"} />
            <Detail label="Department" value={appointment.department?.name} />
            <Detail label="Checked in" value={appointment.checkedInAt ? formatDateTime(appointment.checkedInAt) : undefined} />
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Chief complaint
              </p>
              <p className="mt-0.5 text-sm text-ink">{appointment.chiefComplaint || "—"}</p>
            </div>
            {appointment.notes ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Notes</p>
                <p className="mt-0.5 text-sm text-ink">{appointment.notes}</p>
              </div>
            ) : null}
            {appointment.cancellationReason ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Cancellation reason
                </p>
                <p className="mt-0.5 text-sm text-red-600">{appointment.cancellationReason}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardBody className="flex items-center gap-3">
              <Avatar name={fullName(appointment.patient)} className="h-11 w-11" />
              <div className="min-w-0">
                <Link
                  href={`/patients/${appointment.patientId}`}
                  className="block truncate text-sm font-medium text-ink hover:text-brand-700"
                >
                  {fullName(appointment.patient)}
                </Link>
                <p className="truncate font-mono text-xs text-ink-faint">
                  {appointment.patient?.patientId}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Doctor</CardTitle>
              <Stethoscope className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody>
              {appointment.doctor?.staff ? (
                <Link
                  href={`/staff/${appointment.doctor.staff.id}`}
                  className="text-sm font-medium text-ink hover:text-brand-700"
                >
                  Dr. {appointment.doctor.staff.firstName} {appointment.doctor.staff.lastName}
                </Link>
              ) : (
                <p className="text-sm text-ink-soft">Unassigned</p>
              )}
              {appointment.doctor?.specialization ? (
                <p className="mt-1 text-xs text-ink-faint">{appointment.doctor.specialization.name}</p>
              ) : null}
            </CardBody>
          </Card>

          {appointment.medicalRecord ? (
            <Card>
              <CardHeader>
                <CardTitle>Medical record</CardTitle>
              </CardHeader>
              <CardBody>
                <Link
                  href={`/medical-records/${appointment.medicalRecord.id}`}
                  className={buttonClasses("subtle", "sm", "w-full")}
                >
                  <CalendarClock className="h-4 w-4" />
                  {appointment.medicalRecord.recordNo}
                </Link>
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update status"
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={updateStatus}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Status" required>
            <Select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              options={APPOINTMENT_STATUS_OPTIONS}
            />
          </FormField>
          {status === "CANCELLED" ? (
            <FormField label="Cancellation reason">
              <Textarea
                rows={2}
                value={cancellationReason}
                onChange={(event) => setCancellationReason(event.target.value)}
              />
            </FormField>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        title="Reschedule appointment"
        footer={
          <>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={reschedule} disabled={!newTime}>
              Reschedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="New time" required>
            <Input
              type="datetime-local"
              value={newTime}
              onChange={(event) => setNewTime(event.target.value)}
            />
          </FormField>
          <FormField label="Duration (minutes)">
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
    </div>
  );
}
