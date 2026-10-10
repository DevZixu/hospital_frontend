"use client";

import { useState } from "react";
import { apiList } from "@/lib/api";
import type { Doctor, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";

export interface AdmissionFormValues {
  patientId: string;
  bedId: string;
  admittingDoctorId: string;
  admissionReason: string;
  expectedDischarge: string;
  referralSource: string;
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
  const { items: doctors } = await apiList<Doctor>("/staff/doctors", { limit: 100 });
  const filtered = query
    ? doctors.filter((doctor) => {
        const name = `${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.toLowerCase();
        return name.includes(query.toLowerCase());
      })
    : doctors;
  return filtered.slice(0, 10).map((doctor) => ({
    value: doctor.id,
    label: `Dr. ${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.trim(),
    description: doctor.specialization?.name ?? "",
  }));
}

export function admissionPayload(values: AdmissionFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    patientId: values.patientId,
    bedId: values.bedId,
    admittingDoctorId: values.admittingDoctorId,
  };
  if (values.admissionReason) payload.admissionReason = values.admissionReason;
  if (values.expectedDischarge) payload.expectedDischarge = new Date(values.expectedDischarge).toISOString();
  if (values.referralSource) payload.referralSource = values.referralSource;
  return payload;
}

export function AdmissionForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (values: AdmissionFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<AdmissionFormValues>({
    patientId: "",
    bedId: "",
    admittingDoctorId: "",
    admissionReason: "",
    expectedDischarge: "",
    referralSource: "",
  });

  const set = (key: keyof AdmissionFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
            invalid={!values.patientId}
          />
        </FormField>
        <FormField label="Admitting doctor" required>
          <SearchSelect
            value={values.admittingDoctorId}
            onChange={(value) => setValues((current) => ({ ...current, admittingDoctorId: value }))}
            loadOptions={loadDoctors}
            placeholder="Search doctors…"
            invalid={!values.admittingDoctorId}
          />
        </FormField>
        <FormField label="Bed ID" required hint="Identifier of the bed to assign">
          <Input value={values.bedId} onChange={set("bedId")} required />
        </FormField>
        <FormField label="Expected discharge">
          <Input type="datetime-local" value={values.expectedDischarge} onChange={set("expectedDischarge")} />
        </FormField>
        <FormField label="Referral source">
          <Input value={values.referralSource} onChange={set("referralSource")} placeholder="Emergency, OPD…" />
        </FormField>
        <FormField label="Admission reason" className="sm:col-span-2">
          <Textarea rows={3} value={values.admissionReason} onChange={set("admissionReason")} />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          type="submit"
          loading={submitting}
          disabled={!values.patientId || !values.bedId || !values.admittingDoctorId}
        >
          Admit patient
        </Button>
      </div>
    </form>
  );
}
