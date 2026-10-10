export type Role =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "LAB_TECHNICIAN"
  | "RECEPTIONIST"
  | "BILLING_STAFF"
  | "RADIOLOGIST"
  | "PATIENT";

export type Gender = "MALE" | "FEMALE" | "OTHER";

export type BloodGroup =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export type AppointmentStatus =
  | "SCHEDULED"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";

export type AppointmentType =
  | "CONSULTATION"
  | "FOLLOW_UP"
  | "EMERGENCY"
  | "ROUTINE_CHECKUP"
  | "SURGERY_PRE_OP"
  | "SURGERY_POST_OP"
  | "TELEMEDICINE"
  | "LAB_REVIEW"
  | "VACCINATION"
  | "PHYSICAL_THERAPY";

export type AdmissionStatus =
  | "PENDING"
  | "ADMITTED"
  | "TRANSFERRED"
  | "DISCHARGED"
  | "DECEASED";

export type BedStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";

export type PrescriptionStatus =
  | "PENDING"
  | "DISPENSED"
  | "PARTIALLY_DISPENSED"
  | "CANCELLED"
  | "EXPIRED";

export type LabTestStatus =
  | "ORDERED"
  | "SAMPLE_COLLECTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

export type LabPriority = "ROUTINE" | "URGENT" | "STAT";

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  errors?: unknown;
}

export interface Page<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive?: boolean;
  isEmailVerified?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  staff?: Staff | null;
  patient?: Patient | null;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export interface Specialization {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  staffId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender?: Gender;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  position?: string | null;
  salary?: string | number | null;
  hireDate?: string | null;
  isOnDuty?: boolean;
  profilePhoto?: string | null;
  departmentId?: string | null;
  department?: Department | null;
  user?: User | null;
  doctor?: Doctor | null;
  nurse?: Nurse | null;
  shifts?: Shift[];
}

export interface Doctor {
  id: string;
  licenseNumber: string;
  qualification?: string | null;
  experience?: number | null;
  consultationFee?: string | number | null;
  bio?: string | null;
  isAvailable?: boolean;
  specializationId?: string | null;
  specialization?: Specialization | null;
  staff?: Staff | null;
}

export interface Nurse {
  id: string;
  licenseNumber: string;
  nurseType?: string | null;
  wardId?: string | null;
  ward?: Ward | null;
  staff?: Staff | null;
}

export interface Shift {
  id: string;
  shiftType: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

export interface Ward {
  id: string;
  name: string;
  wardCode?: string;
  department?: Department | null;
}

export interface Patient {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  gender?: Gender;
  dateOfBirth?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  bloodGroup?: BloodGroup | null;
  genotype?: string | null;
  maritalStatus?: string | null;
  occupation?: string | null;
  nationality?: string | null;
  nextOfKinName?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinRelation?: string | null;
  allergies?: string[];
  chronicConditions?: string[];
  profilePhoto?: string | null;
  isDeceased?: boolean;
  createdAt?: string;
  emergencyContacts?: EmergencyContact[];
  insurances?: Insurance[];
  user?: User | null;
}

export interface EmergencyContact {
  id: string;
  contactName: string;
  relationship?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  isPrimary?: boolean;
}

export interface Insurance {
  id: string;
  providerName?: string | null;
  policyNumber?: string | null;
  memberId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive?: boolean;
}

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  doctorId: string;
  departmentId?: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  duration: number;
  chiefComplaint?: string | null;
  notes?: string | null;
  cancellationReason?: string | null;
  isFollowUp?: boolean;
  checkedInAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  patient?: Patient | null;
  doctor?: Doctor | null;
  department?: Department | null;
  medicalRecord?: MedicalRecord | null;
  followUps?: Appointment[];
}

export interface Bed {
  id: string;
  bedNumber: string;
  status: BedStatus;
  wardId?: string | null;
  ward?: Ward | null;
}

export interface Admission {
  id: string;
  admissionNo: string;
  patientId: string;
  bedId: string;
  admittingDoctorId: string;
  admissionReason?: string | null;
  expectedDischarge?: string | null;
  admissionDate: string;
  dischargeDate?: string | null;
  status: AdmissionStatus;
  dischargeNotes?: string | null;
  referralSource?: string | null;
  patient?: Patient | null;
  bed?: Bed | null;
  medicalRecords?: MedicalRecord[];
  vitalSigns?: VitalSign[];
}

export interface Diagnosis {
  id: string;
  name: string;
  icdCode?: string | null;
  description?: string | null;
  isPrimary?: boolean;
}

export interface MedicalRecord {
  id: string;
  recordNo: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string | null;
  admissionId?: string | null;
  chiefComplaint?: string | null;
  historyOfPresentIllness?: string | null;
  pastMedicalHistory?: string | null;
  familyHistory?: string | null;
  socialHistory?: string | null;
  reviewOfSystems?: string | null;
  physicalExamination?: string | null;
  assessment?: string | null;
  plan?: string | null;
  followUpDate?: string | null;
  followUpNotes?: string | null;
  isConfidential?: boolean;
  createdAt?: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
  diagnoses?: Diagnosis[];
  vitalSigns?: VitalSign[];
  prescriptions?: Prescription[];
  labOrders?: LabOrder[];
}

export interface VitalSign {
  id: string;
  bloodPressureSystolic?: number | null;
  bloodPressureDiastolic?: number | null;
  heartRate?: number | null;
  temperature?: number | null;
  temperatureUnit?: string | null;
  respiratoryRate?: number | null;
  oxygenSaturation?: number | null;
  weight?: number | null;
  weightUnit?: string | null;
  height?: number | null;
  heightUnit?: string | null;
  bmi?: number | null;
  bloodGlucose?: number | null;
  painScale?: number | null;
  notes?: string | null;
  recordedAt?: string;
  nurse?: Nurse | null;
}

export interface LabTest {
  id: string;
  name: string;
  code?: string | null;
  category?: string | null;
  normalRange?: string | null;
  unit?: string | null;
  sampleType?: string | null;
  price?: string | number | null;
  isActive?: boolean;
}

export interface LabOrderItem {
  id: string;
  labTestId: string;
  status: LabTestStatus;
  resultValue?: string | null;
  resultUnit?: string | null;
  referenceRange?: string | null;
  isAbnormal?: boolean;
  notes?: string | null;
  sampleCollectedAt?: string | null;
  reportedAt?: string | null;
  labTest?: LabTest | null;
}

export interface LabOrder {
  id: string;
  orderNo: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string | null;
  priority: LabPriority;
  status?: LabTestStatus;
  clinicalNotes?: string | null;
  createdAt?: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
  items?: LabOrderItem[];
}

export interface Medication {
  id: string;
  name: string;
  genericName?: string | null;
  brand?: string | null;
  category?: string | null;
  form?: string | null;
  strength?: string | null;
  description?: string | null;
  reorderLevel?: number | null;
  isActive?: boolean;
  stockItems?: PharmacyStock[];
}

export interface PharmacyStock {
  id: string;
  medicationId: string;
  batchNumber?: string | null;
  quantity: number;
  sellingPrice?: string | number | null;
  expiryDate?: string | null;
  medication?: Medication | null;
}

export interface PrescriptionItem {
  id: string;
  medicationId: string;
  dosage: string;
  route?: string | null;
  frequency: string;
  duration?: number | null;
  durationUnit?: string | null;
  quantity: number;
  instructions?: string | null;
  medication?: Medication | null;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string | null;
  status: PrescriptionStatus;
  notes?: string | null;
  isRefillable?: boolean;
  validUntil?: string | null;
  dispensedAt?: string | null;
  createdAt?: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
  items?: PrescriptionItem[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
