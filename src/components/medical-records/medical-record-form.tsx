"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { apiList } from "@/lib/api";
import type { Doctor, Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";

interface DiagnosisDraft {
  name: string;
  icdCode: string;
  isPrimary: boolean;
}

export interface MedicalRecordFormValues {
  patientId: string;
  doctorId: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastMedicalHistory: string;
  familyHistory: string;
  socialHistory: string;
  reviewOfSystems: string;
  physicalExamination: string;
  assessment: string;
  plan: string;
  followUpDate: string;
  followUpNotes: string;
  isConfidential: boolean;
  diagnoses: DiagnosisDraft[];
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

export function recordPayload(values: MedicalRecordFormValues): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    patientId: values.patientId,
    doctorId: values.doctorId,
    isConfidential: values.isConfidential,
  };
  const textKeys: (keyof MedicalRecordFormValues)[] = [
    "chiefComplaint",
    "historyOfPresentIllness",
    "pastMedicalHistory",
    "familyHistory",
    "socialHistory",
    "reviewOfSystems",
    "physicalExamination",
    "assessment",
    "plan",
    "followUpNotes",
  ];
  for (const key of textKeys) {
    const value = values[key];
    if (typeof value === "string" && value) payload[key] = value;
  }
  if (values.followUpDate) payload.followUpDate = values.followUpDate;
  const diagnoses = values.diagnoses
    .filter((diagnosis) => diagnosis.name.trim())
    .map((diagnosis) => ({
      name: diagnosis.name,
      icdCode: diagnosis.icdCode || undefined,
      isPrimary: diagnosis.isPrimary,
    }));
  if (diagnoses.length) payload.diagnoses = diagnoses;
  return payload;
}

export function MedicalRecordForm({
  submitting,
  onSubmit,
  onCancel,
}: {
  submitting: boolean;
  onSubmit: (values: MedicalRecordFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<MedicalRecordFormValues>({
    patientId: "",
    doctorId: "",
    chiefComplaint: "",
    historyOfPresentIllness: "",
    pastMedicalHistory: "",
    familyHistory: "",
    socialHistory: "",
    reviewOfSystems: "",
    physicalExamination: "",
    assessment: "",
    plan: "",
    followUpDate: "",
    followUpNotes: "",
    isConfidential: false,
    diagnoses: [{ name: "", icdCode: "", isPrimary: true }],
  });

  const set = (key: keyof MedicalRecordFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const updateDiagnosis = (index: number, patch: Partial<DiagnosisDraft>) =>
    setValues((current) => ({
      ...current,
      diagnoses: current.diagnoses.map((diagnosis, i) =>
        i === index ? { ...diagnosis, ...patch } : diagnosis,
      ),
    }));

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
        <FormField label="Doctor" required>
          <SearchSelect
            value={values.doctorId}
            onChange={(value) => setValues((current) => ({ ...current, doctorId: value }))}
            loadOptions={loadDoctors}
            placeholder="Search doctors…"
            invalid={!values.doctorId}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Chief complaint" className="sm:col-span-2">
          <Textarea rows={2} value={values.chiefComplaint} onChange={set("chiefComplaint")} />
        </FormField>
        <FormField label="History of present illness">
          <Textarea rows={3} value={values.historyOfPresentIllness} onChange={set("historyOfPresentIllness")} />
        </FormField>
        <FormField label="Past medical history">
          <Textarea rows={3} value={values.pastMedicalHistory} onChange={set("pastMedicalHistory")} />
        </FormField>
        <FormField label="Family history">
          <Textarea rows={3} value={values.familyHistory} onChange={set("familyHistory")} />
        </FormField>
        <FormField label="Social history">
          <Textarea rows={3} value={values.socialHistory} onChange={set("socialHistory")} />
        </FormField>
        <FormField label="Review of systems">
          <Textarea rows={3} value={values.reviewOfSystems} onChange={set("reviewOfSystems")} />
        </FormField>
        <FormField label="Physical examination">
          <Textarea rows={3} value={values.physicalExamination} onChange={set("physicalExamination")} />
        </FormField>
        <FormField label="Assessment">
          <Textarea rows={3} value={values.assessment} onChange={set("assessment")} />
        </FormField>
        <FormField label="Plan">
          <Textarea rows={3} value={values.plan} onChange={set("plan")} />
        </FormField>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Diagnoses</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setValues((current) => ({
                ...current,
                diagnoses: [...current.diagnoses, { name: "", icdCode: "", isPrimary: false }],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Add diagnosis
          </Button>
        </div>
        <div className="space-y-2">
          {values.diagnoses.map((diagnosis, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder="Diagnosis name"
                value={diagnosis.name}
                onChange={(event) => updateDiagnosis(index, { name: event.target.value })}
              />
              <Input
                placeholder="ICD code"
                value={diagnosis.icdCode}
                onChange={(event) => updateDiagnosis(index, { icdCode: event.target.value })}
                className="w-32"
              />
              <label className="flex shrink-0 items-center gap-1.5 text-xs text-ink-soft">
                <input
                  type="radio"
                  name="primaryDiagnosis"
                  checked={diagnosis.isPrimary}
                  onChange={() =>
                    setValues((current) => ({
                      ...current,
                      diagnoses: current.diagnoses.map((item, i) => ({
                        ...item,
                        isPrimary: i === index,
                      })),
                    }))
                  }
                  className="h-3.5 w-3.5 text-brand-600 focus:ring-brand-500"
                />
                Primary
              </label>
              <button
                type="button"
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    diagnoses: current.diagnoses.filter((_, i) => i !== index),
                  }))
                }
                className="rounded-md p-2 text-ink-faint hover:bg-slate-100 hover:text-red-600"
                aria-label="Remove diagnosis"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Follow-up date">
          <Input type="date" value={values.followUpDate} onChange={set("followUpDate")} />
        </FormField>
        <FormField label="Follow-up notes" className="sm:col-span-2">
          <Textarea rows={2} value={values.followUpNotes} onChange={set("followUpNotes")} />
        </FormField>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={values.isConfidential}
          onChange={(event) =>
            setValues((current) => ({ ...current, isConfidential: event.target.checked }))
          }
          className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
        />
        Mark this record as confidential
      </label>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting} disabled={!values.patientId || !values.doctorId}>
          Create record
        </Button>
      </div>
    </form>
  );
}
