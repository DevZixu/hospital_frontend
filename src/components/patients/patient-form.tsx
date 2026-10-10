"use client";

import { useState } from "react";
import {
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
} from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import type { Patient } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  bloodGroup: string;
  genotype: string;
  maritalStatus: string;
  occupation: string;
  nationality: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelation: string;
  allergies: string;
  chronicConditions: string;
}

function toValues(patient?: Patient | null): PatientFormValues {
  return {
    firstName: patient?.firstName ?? "",
    lastName: patient?.lastName ?? "",
    middleName: patient?.middleName ?? "",
    gender: patient?.gender ?? "",
    dateOfBirth: toDateInput(patient?.dateOfBirth),
    phone: patient?.phone ?? "",
    email: patient?.email ?? "",
    address: patient?.address ?? "",
    city: patient?.city ?? "",
    state: patient?.state ?? "",
    country: patient?.country ?? "Nigeria",
    bloodGroup: patient?.bloodGroup ?? "",
    genotype: patient?.genotype ?? "",
    maritalStatus: patient?.maritalStatus ?? "",
    occupation: patient?.occupation ?? "",
    nationality: patient?.nationality ?? "",
    nextOfKinName: patient?.nextOfKinName ?? "",
    nextOfKinPhone: patient?.nextOfKinPhone ?? "",
    nextOfKinRelation: patient?.nextOfKinRelation ?? "",
    allergies: (patient?.allergies ?? []).join(", "),
    chronicConditions: (patient?.chronicConditions ?? []).join(", "),
  };
}

export function patientPayload(values: PatientFormValues): Record<string, unknown> {
  const list = (input: string) =>
    input
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (key === "allergies" || key === "chronicConditions") continue;
    if (value === "") continue;
    payload[key] = value;
  }
  const allergies = list(values.allergies);
  const chronic = list(values.chronicConditions);
  if (allergies.length) payload.allergies = allergies;
  if (chronic.length) payload.chronicConditions = chronic;
  return payload;
}

export function PatientForm({
  patient,
  submitting,
  onSubmit,
  onCancel,
}: {
  patient?: Patient | null;
  submitting: boolean;
  onSubmit: (values: PatientFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<PatientFormValues>(() => toValues(patient));

  const set = (key: keyof PatientFormValues) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setValues((current) => ({ ...current, [key]: event.target.value }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="First name" required>
            <Input value={values.firstName} onChange={set("firstName")} required />
          </FormField>
          <FormField label="Middle name">
            <Input value={values.middleName} onChange={set("middleName")} />
          </FormField>
          <FormField label="Last name" required>
            <Input value={values.lastName} onChange={set("lastName")} required />
          </FormField>
          <FormField label="Gender">
            <Select
              value={values.gender}
              onChange={set("gender")}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
            />
          </FormField>
          <FormField label="Date of birth">
            <Input type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} />
          </FormField>
          <FormField label="Marital status">
            <Select
              value={values.maritalStatus}
              onChange={set("maritalStatus")}
              options={MARITAL_STATUS_OPTIONS}
              placeholder="Select status"
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone">
            <Input value={values.phone} onChange={set("phone")} placeholder="+234…" />
          </FormField>
          <FormField label="Email">
            <Input type="email" value={values.email} onChange={set("email")} />
          </FormField>
          <FormField label="Address" className="sm:col-span-2">
            <Textarea rows={2} value={values.address} onChange={set("address")} />
          </FormField>
          <FormField label="City">
            <Input value={values.city} onChange={set("city")} />
          </FormField>
          <FormField label="State">
            <Input value={values.state} onChange={set("state")} />
          </FormField>
          <FormField label="Country">
            <Input value={values.country} onChange={set("country")} />
          </FormField>
          <FormField label="Nationality">
            <Input value={values.nationality} onChange={set("nationality")} />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Clinical</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Blood group">
            <Select
              value={values.bloodGroup}
              onChange={set("bloodGroup")}
              options={BLOOD_GROUP_OPTIONS}
              placeholder="Select blood group"
            />
          </FormField>
          <FormField label="Genotype">
            <Input value={values.genotype} onChange={set("genotype")} placeholder="AA, AS, SS…" />
          </FormField>
          <FormField label="Occupation">
            <Input value={values.occupation} onChange={set("occupation")} />
          </FormField>
          <FormField label="Allergies" hint="Comma separated">
            <Input value={values.allergies} onChange={set("allergies")} placeholder="Penicillin, Peanuts" />
          </FormField>
          <FormField label="Chronic conditions" hint="Comma separated" className="sm:col-span-2">
            <Input
              value={values.chronicConditions}
              onChange={set("chronicConditions")}
              placeholder="Hypertension, Type 2 Diabetes"
            />
          </FormField>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Next of kin</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Name">
            <Input value={values.nextOfKinName} onChange={set("nextOfKinName")} />
          </FormField>
          <FormField label="Phone">
            <Input value={values.nextOfKinPhone} onChange={set("nextOfKinPhone")} />
          </FormField>
          <FormField label="Relationship">
            <Input value={values.nextOfKinRelation} onChange={set("nextOfKinRelation")} />
          </FormField>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting}>
          {patient ? "Save changes" : "Register patient"}
        </Button>
      </div>
    </form>
  );
}
