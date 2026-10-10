import type { BloodGroup, Gender, Patient, Role, Staff } from "./types";

export function humanize(value?: string | null): string {
  if (!value) return "—";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function fullName(
  person?: Pick<Patient, "firstName" | "lastName" | "middleName"> | null,
): string {
  if (!person) return "Unknown";
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

export function staffName(staff?: Staff | null): string {
  if (!staff) return "Unknown";
  return [staff.firstName, staff.lastName].filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export function formatCurrency(value?: string | number | null): string {
  if (value === undefined || value === null || value === "") return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(num);
}

export function calculateAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const diff = Date.now() - dob.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return age >= 0 ? age : null;
}

export function roleLabel(role?: Role | null): string {
  if (!role) return "—";
  const overrides: Partial<Record<Role, string>> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Administrator",
    DOCTOR: "Doctor",
    NURSE: "Nurse",
    PHARMACIST: "Pharmacist",
    LAB_TECHNICIAN: "Lab Technician",
    RECEPTIONIST: "Receptionist",
    BILLING_STAFF: "Billing Staff",
    RADIOLOGIST: "Radiologist",
    PATIENT: "Patient",
  };
  return overrides[role] ?? humanize(role);
}

export function bloodGroupLabel(group?: BloodGroup | null): string {
  if (!group || group === "UNKNOWN") return "—";
  return group.replace("_POSITIVE", "+").replace("_NEGATIVE", "−");
}

export function genderLabel(gender?: Gender | null): string {
  if (!gender) return "—";
  return gender.charAt(0) + gender.slice(1).toLowerCase();
}

export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
