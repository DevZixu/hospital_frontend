"use client";

import { useState } from "react";
import { GENDER_OPTIONS, STAFF_ROLE_OPTIONS } from "@/lib/constants";
import { toDateInput } from "@/lib/format";
import type { Staff } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";

export interface StaffFormValues {
  email: string;
  password: string;
  role: string;
  firstName: string;
  lastName: string;
  middleName: string;
  gender: string;
  dateOfBirth: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  departmentId: string;
  position: string;
  hireDate: string;
  salary: string;
  licenseNumber: string;
  specializationId: string;
  qualification: string;
  experience: string;
  consultationFee: string;
  bio: string;
  nurseType: string;
  wardId: string;
}

function toValues(staff?: Staff | null): StaffFormValues {
  return {
    email: staff?.user?.email ?? "",
    password: "",
    role: staff?.user?.role ?? "DOCTOR",
    firstName: staff?.firstName ?? "",
    lastName: staff?.lastName ?? "",
    middleName: staff?.middleName ?? "",
    gender: staff?.gender ?? "",
    dateOfBirth: toDateInput(staff?.dateOfBirth),
    phone: staff?.phone ?? "",
    address: staff?.address ?? "",
    city: staff?.city ?? "",
    state: staff?.state ?? "",
    country: staff?.country ?? "",
    departmentId: staff?.departmentId ?? "",
    position: staff?.position ?? "",
    hireDate: toDateInput(staff?.hireDate),
    salary: staff?.salary != null ? String(staff.salary) : "",
    licenseNumber: staff?.doctor?.licenseNumber ?? staff?.nurse?.licenseNumber ?? "",
    specializationId: staff?.doctor?.specializationId ?? "",
    qualification: staff?.doctor?.qualification ?? "",
    experience: staff?.doctor?.experience != null ? String(staff.doctor.experience) : "",
    consultationFee:
      staff?.doctor?.consultationFee != null ? String(staff.doctor.consultationFee) : "",
    bio: staff?.doctor?.bio ?? "",
    nurseType: staff?.nurse?.nurseType ?? "",
    wardId: staff?.nurse?.wardId ?? "",
  };
}

const NUMERIC_KEYS = new Set(["experience", "consultationFee", "salary"]);

export function staffPayload(values: StaffFormValues, isEdit: boolean): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  const role = values.role;
  const isDoctor = role === "DOCTOR";
  const isNurse = role === "NURSE";

  for (const [key, value] of Object.entries(values)) {
    if (value === "") continue;
    if (key === "password" && isEdit) continue;
    if (!isDoctor && ["specializationId", "qualification", "experience", "consultationFee", "bio"].includes(key)) continue;
    if (!isNurse && ["nurseType", "wardId"].includes(key)) continue;
    payload[key] = NUMERIC_KEYS.has(key) ? Number(value) : value;
  }
  return payload;
}

export function StaffForm({
  staff,
  submitting,
  onSubmit,
  onCancel,
}: {
  staff?: Staff | null;
  submitting: boolean;
  onSubmit: (values: StaffFormValues) => void;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState<StaffFormValues>(() => toValues(staff));
  const isEdit = Boolean(staff);
  const isDoctor = values.role === "DOCTOR";
  const isNurse = values.role === "NURSE";

  const set = (key: keyof StaffFormValues) => (
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
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Work email" required>
            <Input type="email" value={values.email} onChange={set("email")} required disabled={isEdit} />
          </FormField>
          <FormField
            label="Role"
            required
            hint={isEdit ? "Role cannot be changed after creation" : undefined}
          >
            <Select value={values.role} onChange={set("role")} options={STAFF_ROLE_OPTIONS} disabled={isEdit} />
          </FormField>
          {!isEdit ? (
            <FormField label="Temporary password" hint="Leave blank to auto-generate">
              <Input type="text" value={values.password} onChange={set("password")} />
            </FormField>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Personal</h2>
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
            <Select value={values.gender} onChange={set("gender")} options={GENDER_OPTIONS} placeholder="Select gender" />
          </FormField>
          <FormField label="Date of birth">
            <Input type="date" value={values.dateOfBirth} onChange={set("dateOfBirth")} />
          </FormField>
          <FormField label="Phone">
            <Input value={values.phone} onChange={set("phone")} />
          </FormField>
          <FormField label="Address" className="sm:col-span-3">
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-ink">Employment</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Position">
            <Input value={values.position} onChange={set("position")} />
          </FormField>
          <FormField label="Department ID" hint="Optional reference">
            <Input value={values.departmentId} onChange={set("departmentId")} />
          </FormField>
          <FormField label="Hire date">
            <Input type="date" value={values.hireDate} onChange={set("hireDate")} />
          </FormField>
          <FormField label="Annual salary">
            <Input type="number" value={values.salary} onChange={set("salary")} />
          </FormField>
        </div>
      </section>

      {isDoctor ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Doctor details</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="License number" required>
              <Input value={values.licenseNumber} onChange={set("licenseNumber")} />
            </FormField>
            <FormField label="Specialization ID" hint="Optional reference">
              <Input value={values.specializationId} onChange={set("specializationId")} />
            </FormField>
            <FormField label="Qualification">
              <Input value={values.qualification} onChange={set("qualification")} placeholder="MBBS, MD" />
            </FormField>
            <FormField label="Years of experience">
              <Input type="number" value={values.experience} onChange={set("experience")} />
            </FormField>
            <FormField label="Consultation fee">
              <Input type="number" value={values.consultationFee} onChange={set("consultationFee")} />
            </FormField>
            <FormField label="Bio" className="sm:col-span-3">
              <Textarea rows={2} value={values.bio} onChange={set("bio")} />
            </FormField>
          </div>
        </section>
      ) : null}

      {isNurse ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-ink">Nurse details</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="License number" required>
              <Input value={values.licenseNumber} onChange={set("licenseNumber")} />
            </FormField>
            <FormField label="Nurse type">
              <Input value={values.nurseType} onChange={set("nurseType")} placeholder="Registered, Auxiliary" />
            </FormField>
            <FormField label="Ward ID" hint="Optional reference">
              <Input value={values.wardId} onChange={set("wardId")} />
            </FormField>
          </div>
        </section>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-5">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={submitting}>
          {isEdit ? "Save changes" : "Add staff"}
        </Button>
      </div>
    </form>
  );
}
