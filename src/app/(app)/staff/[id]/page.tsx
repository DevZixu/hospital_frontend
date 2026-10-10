"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, Mail, Phone } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatDateTime, roleLabel, staffName } from "@/lib/format";
import type { Shift, Staff } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";

const SHIFT_TYPES = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "NIGHT", label: "Night" },
  { value: "ON_CALL", label: "On call" },
];

export default function StaffDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [shiftOpen, setShiftOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [shift, setShift] = useState({
    shiftType: "MORNING",
    startTime: "",
    endTime: "",
    notes: "",
  });

  const { data: staff, loading, error, refetch } = useAsync(
    () => apiGet<Staff>(`/staff/${params.id}`),
    [params.id],
  );

  const addShift = async () => {
    if (!staff) return;
    setSaving(true);
    setShiftError(null);
    try {
      await apiPost<Shift>(`/staff/${staff.id}/shifts`, shift);
      toast.success("Shift scheduled");
      setShiftOpen(false);
      setShift({ shiftType: "MORNING", startTime: "", endTime: "", notes: "" });
      refetch();
    } catch (err) {
      setShiftError(err instanceof ApiError ? err.message : "Unable to schedule shift");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading staff profile…" />;
  if (error || !staff) return <Alert tone="danger">{error ?? "Staff not found"}</Alert>;

  const shifts = staff.shifts ?? [];

  return (
    <div className="space-y-6">
      <Link href="/staff" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to staff
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={staffName(staff)} className="h-14 w-14 text-base" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {staffName(staff)}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="font-mono text-xs">{staff.staffId}</span>
              <Badge tone="brand">{roleLabel(staff.user?.role)}</Badge>
              <Badge tone={staff.isOnDuty ? "success" : "neutral"} dot>
                {staff.isOnDuty ? "On duty" : "Off duty"}
              </Badge>
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={() => setShiftOpen(true)}>
          <CalendarPlus className="h-4 w-4" />
          Schedule shift
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Email" value={staff.user?.email} />
            <Detail label="Phone" value={staff.phone} />
            <Detail label="Position" value={staff.position} />
            <Detail label="Department" value={staff.department?.name} />
            <Detail label="Gender" value={staff.gender} />
            <Detail label="Date of birth" value={formatDate(staff.dateOfBirth)} />
            <Detail label="Hire date" value={formatDate(staff.hireDate)} />
            <Detail label="Address" value={[staff.address, staff.city, staff.state, staff.country].filter(Boolean).join(", ")} />
          </CardBody>

          {staff.doctor ? (
            <>
              <CardHeader className="border-t">
                <CardTitle>Doctor credentials</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="License number" value={staff.doctor.licenseNumber} />
                <Detail label="Specialization" value={staff.doctor.specialization?.name} />
                <Detail label="Qualification" value={staff.doctor.qualification} />
                <Detail label="Experience" value={staff.doctor.experience ? `${staff.doctor.experience} yrs` : undefined} />
                <Detail label="Consultation fee" value={staff.doctor.consultationFee ? String(staff.doctor.consultationFee) : undefined} />
              </CardBody>
            </>
          ) : null}

          {staff.nurse ? (
            <>
              <CardHeader className="border-t">
                <CardTitle>Nurse credentials</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="License number" value={staff.nurse.licenseNumber} />
                <Detail label="Nurse type" value={staff.nurse.nurseType} />
                <Detail label="Ward" value={staff.nurse.ward?.name} />
              </CardBody>
            </>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <Mail className="h-4 w-4 text-ink-faint" />
                {staff.user?.email ?? "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-soft">
                <Phone className="h-4 w-4 text-ink-faint" />
                {staff.phone ?? "—"}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent shifts</CardTitle>
            </CardHeader>
            {shifts.length === 0 ? (
              <EmptyState icon={CalendarPlus} title="No shifts scheduled" />
            ) : (
              <ul className="divide-y divide-line">
                {shifts.slice(0, 6).map((shiftItem) => (
                  <li key={shiftItem.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink">{shiftItem.shiftType}</span>
                      <span className="text-xs text-ink-faint">{formatDate(shiftItem.startTime)}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-faint">
                      {formatDateTime(shiftItem.startTime)} → {formatDateTime(shiftItem.endTime)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={shiftOpen}
        onClose={() => setShiftOpen(false)}
        title="Schedule shift"
        description={`Assign a new shift for ${staffName(staff)}.`}
        footer={
          <>
            <Button variant="outline" onClick={() => setShiftOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={addShift} disabled={!shift.startTime || !shift.endTime}>
              Schedule
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {shiftError ? <Alert tone="danger">{shiftError}</Alert> : null}
          <FormField label="Shift type" required>
            <Select
              value={shift.shiftType}
              onChange={(event) => setShift((current) => ({ ...current, shiftType: event.target.value }))}
              options={SHIFT_TYPES}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start" required>
              <Input
                type="datetime-local"
                value={shift.startTime}
                onChange={(event) => setShift((current) => ({ ...current, startTime: event.target.value }))}
              />
            </FormField>
            <FormField label="End" required>
              <Input
                type="datetime-local"
                value={shift.endTime}
                onChange={(event) => setShift((current) => ({ ...current, endTime: event.target.value }))}
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              rows={2}
              value={shift.notes}
              onChange={(event) => setShift((current) => ({ ...current, notes: event.target.value }))}
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
      <p className="mt-0.5 text-sm capitalize text-ink">{value || "—"}</p>
    </div>
  );
}
