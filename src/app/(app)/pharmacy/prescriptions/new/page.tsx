"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiList, apiPost, ApiError } from "@/lib/api";
import { DURATION_UNITS, FREQUENCIES, ROUTES } from "@/lib/constants";
import { humanize } from "@/lib/format";
import { useToast } from "@/components/ui/toast";
import type { Doctor, Medication, Patient, Prescription } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { Alert } from "@/components/ui/alert";

const ROUTE_OPTIONS = ROUTES.map((route) => ({ value: route, label: humanize(route) }));
const FREQUENCY_OPTIONS = FREQUENCIES.map((frequency) => ({ value: frequency, label: humanize(frequency) }));
const DURATION_OPTIONS = DURATION_UNITS.map((unit) => ({ value: unit, label: humanize(unit) }));

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
    ? doctors.filter((doctor) =>
        `${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : doctors;
  return filtered.slice(0, 10).map((doctor) => ({
    value: doctor.id,
    label: `Dr. ${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.trim(),
    description: doctor.specialization?.name ?? "",
  }));
}

async function loadMedications(query: string) {
  const { items } = await apiList<Medication>("/pharmacy/medications", { search: query, limit: 10 });
  return items.map((medication) => ({
    value: medication.id,
    label: medication.name,
    description: [medication.genericName, medication.strength].filter(Boolean).join(" · "),
  }));
}

interface ItemDraft {
  medicationId: string;
  dosage: string;
  route: string;
  frequency: string;
  duration: string;
  durationUnit: string;
  quantity: string;
  instructions: string;
}

const emptyItem: ItemDraft = {
  medicationId: "",
  dosage: "",
  route: "ORAL",
  frequency: "ONCE_DAILY",
  duration: "",
  durationUnit: "DAYS",
  quantity: "1",
  instructions: "",
};

export default function NewPrescriptionPage() {
  const router = useRouter();
  const toast = useToast();
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [notes, setNotes] = useState("");
  const [isRefillable, setIsRefillable] = useState(false);
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateItem = (index: number, patch: Partial<ItemDraft>) =>
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const canSubmit = patientId && doctorId && items.every((item) => item.medicationId && item.dosage);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const prescription = await apiPost<Prescription>("/pharmacy/prescriptions", {
        patientId,
        doctorId,
        notes: notes || undefined,
        isRefillable,
        validUntil: validUntil || undefined,
        items: items.map((item) => ({
          medicationId: item.medicationId,
          dosage: item.dosage,
          route: item.route,
          frequency: item.frequency,
          duration: item.duration ? Number(item.duration) : undefined,
          durationUnit: item.durationUnit,
          quantity: Number(item.quantity) || 1,
          instructions: item.instructions || undefined,
        })),
      });
      toast.success("Prescription created", prescription.prescriptionNo);
      router.push(`/pharmacy/prescriptions/${prescription.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create prescription");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/pharmacy"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pharmacy
      </Link>
      <PageHeader title="New prescription" description="Prescribe medication for a patient." />
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Patient" required>
              <SearchSelect
                value={patientId}
                onChange={setPatientId}
                loadOptions={loadPatients}
                placeholder="Search patients…"
                invalid={!patientId}
              />
            </FormField>
            <FormField label="Prescribing doctor" required>
              <SearchSelect
                value={doctorId}
                onChange={setDoctorId}
                loadOptions={loadDoctors}
                placeholder="Search doctors…"
                invalid={!doctorId}
              />
            </FormField>
            <FormField label="Valid until">
              <Input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
            </FormField>
            <FormField label="Notes">
              <Input value={notes} onChange={(event) => setNotes(event.target.value)} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={isRefillable}
              onChange={(event) => setIsRefillable(event.target.checked)}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Refillable prescription
          </label>
        </CardBody>
      </Card>

      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Medications</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setItems((current) => [...current, { ...emptyItem }])}
          >
            <Plus className="h-4 w-4" />
            Add medication
          </Button>
        </div>
        <div className="space-y-4 p-5">
          {items.map((item, index) => (
            <div key={index} className="rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <FormField label="Medication" required>
                    <SearchSelect
                      value={item.medicationId}
                      onChange={(value) => updateItem(index, { medicationId: value })}
                      loadOptions={loadMedications}
                      placeholder="Search medications…"
                      invalid={!item.medicationId}
                    />
                  </FormField>
                </div>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                    className="mt-6 rounded-md p-2 text-ink-faint hover:bg-slate-100 hover:text-red-600"
                    aria-label="Remove medication"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField label="Dosage" required>
                  <Input
                    placeholder="e.g. 500 mg"
                    value={item.dosage}
                    onChange={(event) => updateItem(index, { dosage: event.target.value })}
                  />
                </FormField>
                <FormField label="Route">
                  <Select
                    value={item.route}
                    onChange={(event) => updateItem(index, { route: event.target.value })}
                    options={ROUTE_OPTIONS}
                  />
                </FormField>
                <FormField label="Frequency">
                  <Select
                    value={item.frequency}
                    onChange={(event) => updateItem(index, { frequency: event.target.value })}
                    options={FREQUENCY_OPTIONS}
                  />
                </FormField>
                <FormField label="Quantity">
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  />
                </FormField>
                <FormField label="Duration">
                  <Input
                    type="number"
                    value={item.duration}
                    onChange={(event) => updateItem(index, { duration: event.target.value })}
                  />
                </FormField>
                <FormField label="Duration unit">
                  <Select
                    value={item.durationUnit}
                    onChange={(event) => updateItem(index, { durationUnit: event.target.value })}
                    options={DURATION_OPTIONS}
                  />
                </FormField>
                <FormField label="Instructions" className="sm:col-span-2 lg:col-span-2">
                  <Input
                    value={item.instructions}
                    onChange={(event) => updateItem(index, { instructions: event.target.value })}
                  />
                </FormField>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-line p-5">
          <Button variant="outline" onClick={() => router.push("/pharmacy")}>
            Cancel
          </Button>
          <Button loading={saving} disabled={!canSubmit} onClick={submit}>
            Create prescription
          </Button>
        </div>
      </Card>
    </div>
  );
}
