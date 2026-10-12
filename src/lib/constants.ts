import {
  BedDouble,
  Boxes,
  CalendarClock,
  ClipboardList,
  FlaskConical,
  LayoutDashboard,
  Stethoscope,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Allowed roles. Undefined = all staff roles (not PATIENT). */
  roles?: Role[];
}

/** Nav shown to staff (and super-admin/admin). PATIENT role uses PATIENT_NAV_ITEMS. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/patients",
    label: "Patients",
    icon: UsersRound,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST", "LAB_TECHNICIAN", "PHARMACIST", "BILLING_STAFF", "RADIOLOGIST"],
  },
  {
    href: "/appointments",
    label: "Appointments",
    icon: CalendarClock,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    href: "/admissions",
    label: "Admissions",
    icon: BedDouble,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "RECEPTIONIST"],
  },
  {
    href: "/medical-records",
    label: "Medical Records",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE"],
  },
  {
    href: "/laboratory",
    label: "Laboratory",
    icon: FlaskConical,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "NURSE", "LAB_TECHNICIAN"],
  },
  {
    href: "/pharmacy",
    label: "Pharmacy",
    icon: Boxes,
    roles: ["SUPER_ADMIN", "ADMIN", "DOCTOR", "PHARMACIST", "NURSE"],
  },
  {
    href: "/staff",
    label: "Staff",
    icon: Stethoscope,
    roles: ["SUPER_ADMIN", "ADMIN"],
  },
];

/** Nav shown to patients (limited view). */
export const PATIENT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/appointments", label: "My Appointments", icon: CalendarClock },
];

export function navForRole(role?: Role | null): NavItem[] {
  if (!role) return [];
  if (role === "PATIENT") return PATIENT_NAV_ITEMS;
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

const STATUS_TONES: Record<string, Tone> = {
  SCHEDULED: "info",
  CONFIRMED: "brand",
  CHECKED_IN: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
  RESCHEDULED: "warning",
  PENDING: "warning",
  ADMITTED: "info",
  TRANSFERRED: "warning",
  DISCHARGED: "success",
  DECEASED: "neutral",
  DISPENSED: "success",
  PARTIALLY_DISPENSED: "warning",
  EXPIRED: "danger",
  ORDERED: "info",
  SAMPLE_COLLECTED: "brand",
  REPORTED: "success",
  REJECTED: "danger",
  AVAILABLE: "success",
  OCCUPIED: "danger",
  MAINTENANCE: "warning",
  RESERVED: "info",
  ROUTINE: "neutral",
  URGENT: "warning",
  STAT: "danger",
  PAID: "success",
  PARTIAL: "warning",
  OVERDUE: "danger",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

export function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  return STATUS_TONES[status] ?? "neutral";
}

export const GENDER_OPTIONS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
];

export const BLOOD_GROUP_OPTIONS = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A−" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B−" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB−" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O−" },
  { value: "UNKNOWN", label: "Unknown" },
];

export const MARITAL_STATUS_OPTIONS = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

export const APPOINTMENT_TYPE_OPTIONS = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "FOLLOW_UP", label: "Follow Up" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "ROUTINE_CHECKUP", label: "Routine Checkup" },
  { value: "SURGERY_PRE_OP", label: "Surgery Pre-Op" },
  { value: "SURGERY_POST_OP", label: "Surgery Post-Op" },
  { value: "TELEMEDICINE", label: "Telemedicine" },
  { value: "LAB_REVIEW", label: "Lab Review" },
  { value: "VACCINATION", label: "Vaccination" },
  { value: "PHYSICAL_THERAPY", label: "Physical Therapy" },
];

export const APPOINTMENT_STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CHECKED_IN", label: "Checked In" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No Show" },
  { value: "RESCHEDULED", label: "Rescheduled" },
];

export const ADMISSION_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "ADMITTED", label: "Admitted" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "DISCHARGED", label: "Discharged" },
  { value: "DECEASED", label: "Deceased" },
];

export const LAB_PRIORITY_OPTIONS = [
  { value: "ROUTINE", label: "Routine" },
  { value: "URGENT", label: "Urgent" },
  { value: "STAT", label: "STAT" },
];

export const LAB_STATUS_OPTIONS = [
  { value: "ORDERED", label: "Ordered" },
  { value: "SAMPLE_COLLECTED", label: "Sample Collected" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REJECTED", label: "Rejected" },
];

export const PRESCRIPTION_STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "DISPENSED", label: "Dispensed" },
  { value: "PARTIALLY_DISPENSED", label: "Partially Dispensed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "EXPIRED", label: "Expired" },
];

export const STAFF_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrator" },
  { value: "DOCTOR", label: "Doctor" },
  { value: "NURSE", label: "Nurse" },
  { value: "PHARMACIST", label: "Pharmacist" },
  { value: "LAB_TECHNICIAN", label: "Lab Technician" },
  { value: "RECEPTIONIST", label: "Receptionist" },
  { value: "BILLING_STAFF", label: "Billing Staff" },
  { value: "RADIOLOGIST", label: "Radiologist" },
];

export const MEDICATION_FORMS = [
  "TABLET",
  "CAPSULE",
  "SYRUP",
  "SUSPENSION",
  "INJECTION",
  "INFUSION",
  "CREAM",
  "OINTMENT",
  "DROPS",
  "INHALER",
  "SUPPOSITORY",
];

export const ROUTES = [
  "ORAL",
  "INTRAVENOUS",
  "INTRAMUSCULAR",
  "SUBCUTANEOUS",
  "TOPICAL",
  "INHALATION",
  "RECTAL",
  "OPHTHALMIC",
];

export const FREQUENCIES = [
  "ONCE_DAILY",
  "TWICE_DAILY",
  "THREE_TIMES_DAILY",
  "FOUR_TIMES_DAILY",
  "EVERY_6_HOURS",
  "EVERY_8_HOURS",
  "EVERY_12_HOURS",
  "AS_NEEDED",
];

export const DURATION_UNITS = ["DAYS", "WEEKS", "MONTHS"];

/** Roles that can create/manage staff members */
export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];
