"use client";

import { useEffect, useState } from "react";
import { APPOINTMENT_TYPE_OPTIONS } from "@/lib/constants";
import { apiGet, apiList } from "@/lib/api";
import type { Doctor, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";

export interface AppointmentFormValues {
  patientId: string;
  doctorId: string;
  type: string;
  scheduledAt: string;
  duration: string;
  chiefComplaint: string;
  notes: string;
  isFollowUp: boolean;
}

export function appointmentPayload(values: AppointmentFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    patientId: values.patientId,
    doctorId: values.doctorId,
    type: values.type,
    scheduledAt: new Date(values.scheduledAt).toISOString(),
    duration: values.duration ? Number(values.duration) : 30,
    isFollowUp: values.isFollowUp,
  };
  if (values.chiefComplaint) payload.chiefComplaint = values.chiefComplaint;
  if (values.notes) payload.notes = values.notes;
  return payload;
}

async function loadPatients(query: string) {
  const { items } = await apiList<Patient>("/patients", { search: query, limit: 10 });
  return items.map((patient) => ({
    value: patient.id,
    label: `${patient.firstName} ${patient.lastName}`,
    description: `${patient.patientId}${patient.phone ? ` · ${patient.phone}` : ""}`,
  }));
}

async function loadDoctors(query: string) {
  const doctors = await apiList<Doctor>("/staff/doctors", { limit: 100 }).then((r) => r.items);
  const filtered = query
    ? doctors.filter((doctor) => {
        const name = `${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.toLowerCase();
        return name.includes(query.toLowerCase());
      })
    : doctors;
  return filtered.slice(0, 10).map((doctor) => ({
    value: doctor.id,
    label: `Dr. ${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.trim(),
    description: [doctor.specialization?.name, doctor.staff?.department?.name]
      .filter(Boolean)
      .join(" · "),
  }));
}

export function AppointmentForm({
  submitting,
  onSubmit,
  onCancel,
  defaultPatientId,
}: {
  submitting: boolean;
  onSubmit: (values: AppointmentFormValues) => void;
  onCancel?: () => void;
  defaultPatientId?: string;
}) {
  const [values, setValues] = useState<AppointmentFormValues>({
    patientId: defaultPatientId ?? "",
    doctorId: "",
    type: "CONSULTATION",
    scheduledAt: "",
    duration: "30",
    chiefComplaint: "",
    notes: "",
    isFollowUp: false,
  });
  const [patientLabel, setPatientLabel] = useState("");

  useEffect(() => {
    if (!defaultPatientId) return;
    apiGet<Patient>(`/patients/${defaultPatientId}`)
      .then((patient) => {
        setPatientLabel(`${patient.firstName} ${patient.lastName}`);
        setValues((current) => ({ ...current, patientId: patient.id }));
      })
      .catch(() => undefined);
  }, [defaultPatientId]);

  const set = (key: keyof AppointmentFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [key]: event.target.value }));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values);
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patient" required>
          <SearchSelect
            value={values.patientId}
            onChange={(value) => setValues((current) => ({ ...current, patientId: value }))}
            loadOptions={loadPatients}
            placeholder="Search patients…"
            initialLabel={patientLabel}
            invalid={!values.patientId}
          />
        </FormField>
        <FormField label="Doctor" required>
          <SearchSelect
            value={values.doctorId}
            onChange={(value) => setValues((current) => ({ ...current, doctorId: value }))}
            loadOptions={loadDoctors}
            placeholder="Search doctors…"
            invalid={!values.doctorId}
          />
        </FormField>
        <FormField label="Type" required>
          <Select value={values.type} onChange={set("type")} options={APPOINTMENT_TYPE_OPTIONS} />
        </FormField>
        <FormField label="Duration (minutes)">
          <Input type="number" min={5} step={5} value={values.duration} onChange={set("duration")} />
        </FormField>
        <FormField label="Scheduled at" required className="sm:col-span-2">
          <Input
            type="datetime-local"
            value={values.scheduledAt}
            onChange={set("scheduledAt")}
            required
          />
        </FormField>
        <FormField label="Chief complaint" className="sm:col-span-2">
          <Textarea rows={2} value={values.chiefComplaint} onChange={set("chiefComplaint")} />
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={values.notes} onChange={set("notes")} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={values.isFollowUp}
          onChange={(event) =>
            setValues((current) => ({ ...current, isFollowUp: event.target.checked }))
          }
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
        />
        This is a follow-up appointment
      </label>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting} disabled={!values.patientId || !values.doctorId}>
          Book appointment
        </Button>
      </div>
    </form>
  );
}
