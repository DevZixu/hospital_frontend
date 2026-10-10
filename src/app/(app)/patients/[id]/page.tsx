"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  FileText,
  HeartPulse,
  PencilLine,
  Pill,
  Phone,
  Plus,
} from "lucide-react";
import { apiGet, apiList } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import {
  bloodGroupLabel,
  calculateAge,
  formatDate,
  formatDateTime,
  fullName,
  genderLabel,
  humanize,
} from "@/lib/format";
import { statusTone } from "@/lib/constants";
import type { Admission, MedicalRecord, Patient, VitalSign } from "@/lib/types";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { buttonClasses } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface HistoryResponse {
  records?: MedicalRecord[];
}

interface PatientBundle {
  patient: Patient;
  history: MedicalRecord[];
  vitals: VitalSign[];
  admissions: Admission[];
}

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState("overview");

  const { data, loading, error } = useAsync<PatientBundle>(async () => {
    const [patient, history, vitals, admissions] = await Promise.all([
      apiGet<Patient>(`/patients/${id}`),
      apiGet<MedicalRecord[] | HistoryResponse>(`/patients/${id}/medical-history`),
      apiList<VitalSign>(`/patients/${id}/vitals`, { limit: 10 }),
      apiGet<Admission[]>(`/patients/${id}/admissions`),
    ]);
    return {
      patient,
      history: Array.isArray(history) ? history : (history.records ?? []),
      vitals: vitals.items,
      admissions: Array.isArray(admissions) ? admissions : [],
    };
  }, [id]);

  if (loading) return <LoadingBlock label="Loading patient record…" />;
  if (error || !data) {
    return <Alert tone="danger">{error ?? "Patient not found"}</Alert>;
  }

  const { patient, history, vitals, admissions } = data;
  const name = fullName(patient);

  return (
    <div className="space-y-6">
      <Link
        href="/patients"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to patients
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={name} className="h-14 w-14 text-base" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <span className="font-mono text-xs">{patient.patientId}</span>
              <span>·</span>
              <span>{genderLabel(patient.gender)}</span>
              {calculateAge(patient.dateOfBirth) !== null ? (
                <>
                  <span>·</span>
                  <span>{calculateAge(patient.dateOfBirth)} yrs</span>
                </>
              ) : null}
              {patient.bloodGroup ? (
                <Badge tone="danger">{bloodGroupLabel(patient.bloodGroup)}</Badge>
              ) : null}
              {patient.isDeceased ? <Badge tone="neutral">Deceased</Badge> : null}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/patients/${patient.id}/edit`} className={buttonClasses("outline", "md")}>
            <PencilLine className="h-4 w-4" />
            Edit
          </Link>
          <Link
            href={`/appointments/new?patientId=${patient.id}`}
            className={buttonClasses("primary", "md")}
          >
            <Plus className="h-4 w-4" />
            Book appointment
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: "overview", label: "Overview" },
              { value: "history", label: "Medical history", count: history.length },
              { value: "vitals", label: "Vitals", count: vitals.length },
              { value: "admissions", label: "Admissions", count: admissions.length },
            ]}
          />

          {tab === "overview" ? (
            <Card>
              <CardHeader>
                <CardTitle>Patient details</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <Detail label="Phone" value={patient.phone} />
                <Detail label="Email" value={patient.email} />
                <Detail label="Date of birth" value={formatDate(patient.dateOfBirth)} />
                <Detail label="Genotype" value={patient.genotype} />
                <Detail label="Marital status" value={humanize(patient.maritalStatus)} />
                <Detail label="Occupation" value={patient.occupation} />
                <Detail label="Nationality" value={patient.nationality} />
                <Detail label="Address" value={[patient.address, patient.city, patient.state, patient.country].filter(Boolean).join(", ")} />
                <Detail label="Next of kin" value={patient.nextOfKinName} />
                <Detail label="Next of kin phone" value={patient.nextOfKinPhone} />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Allergies
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((allergy) => (
                        <Badge key={allergy} tone="danger">
                          {allergy}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-ink-soft">None recorded</span>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Chronic conditions
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
                      patient.chronicConditions.map((condition) => (
                        <Badge key={condition} tone="warning">
                          {condition}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-ink-soft">None recorded</span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ) : null}

          {tab === "history" ? (
            <Card>
              {history.length === 0 ? (
                <EmptyState icon={FileText} title="No medical records" description="Visits and diagnoses will be listed here." />
              ) : (
                <ul className="divide-y divide-line">
                  {history.map((record) => (
                    <li key={record.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <Link
                            href={`/medical-records/${record.id}`}
                            className="text-sm font-medium text-ink hover:text-brand-700"
                          >
                            {record.chiefComplaint ?? "Consultation"}
                          </Link>
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {formatDateTime(record.createdAt)}
                            {record.doctor?.staff
                              ? ` · Dr. ${record.doctor.staff.firstName} ${record.doctor.staff.lastName}`
                              : ""}
                          </p>
                        </div>
                        <span className="font-mono text-xs text-ink-faint">{record.recordNo}</span>
                      </div>
                      {record.diagnoses && record.diagnoses.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {record.diagnoses.map((diagnosis) => (
                            <Badge key={diagnosis.id} tone={diagnosis.isPrimary ? "brand" : "neutral"}>
                              {diagnosis.name}
                              {diagnosis.icdCode ? ` · ${diagnosis.icdCode}` : ""}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}

          {tab === "vitals" ? (
            <Card>
              {vitals.length === 0 ? (
                <EmptyState icon={HeartPulse} title="No vitals recorded" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Recorded</TH>
                      <TH>BP</TH>
                      <TH>HR</TH>
                      <TH>Temp</TH>
                      <TH>SpO₂</TH>
                      <TH>BMI</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {vitals.map((vital) => (
                      <TR key={vital.id}>
                        <TD className="text-ink-soft">{formatDateTime(vital.recordedAt)}</TD>
                        <TD>
                          {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                            ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                            : "—"}
                        </TD>
                        <TD>{vital.heartRate ?? "—"}</TD>
                        <TD>
                          {vital.temperature ? `${vital.temperature}°${vital.temperatureUnit ?? "C"}` : "—"}
                        </TD>
                        <TD>{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "—"}</TD>
                        <TD>{vital.bmi ?? "—"}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </Card>
          ) : null}

          {tab === "admissions" ? (
            <Card>
              {admissions.length === 0 ? (
                <EmptyState icon={Activity} title="No admissions" />
              ) : (
                <ul className="divide-y divide-line">
                  {admissions.map((admission) => (
                    <li key={admission.id} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div>
                        <Link
                          href={`/admissions/${admission.id}`}
                          className="text-sm font-medium text-ink hover:text-brand-700"
                        >
                          {admission.admissionNo}
                        </Link>
                        <p className="mt-0.5 text-xs text-ink-faint">
                          Admitted {formatDate(admission.admissionDate)}
                          {admission.bed?.ward ? ` · ${admission.bed.ward.name}` : ""}
                        </p>
                      </div>
                      <Badge tone={statusTone(admission.status)}>{humanize(admission.status)}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency contacts</CardTitle>
              <Phone className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody className="space-y-3">
              {patient.emergencyContacts && patient.emergencyContacts.length > 0 ? (
                patient.emergencyContacts.map((contact) => (
                  <div key={contact.id} className="rounded-lg border border-line p-3">
                    <p className="text-sm font-medium text-ink">{contact.contactName}</p>
                    <p className="text-xs text-ink-faint">{contact.relationship ?? "Contact"}</p>
                    <p className="mt-1 text-sm text-ink-soft">{contact.phone}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-ink-soft">No emergency contacts recorded.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody className="space-y-3">
              {history.flatMap((record) => record.prescriptions ?? []).slice(0, 4).length > 0 ? (
                history
                  .flatMap((record) => record.prescriptions ?? [])
                  .slice(0, 4)
                  .map((prescription) => (
                    <Link
                      key={prescription.id}
                      href={`/pharmacy/prescriptions/${prescription.id}`}
                      className="block rounded-lg border border-line p-3 hover:border-brand-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-ink">{prescription.prescriptionNo}</span>
                        <Badge tone={statusTone(prescription.status)}>
                          {humanize(prescription.status)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-faint">{formatDate(prescription.createdAt)}</p>
                    </Link>
                  ))
              ) : (
                <p className="text-sm text-ink-soft">No prescriptions on record.</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Latest appointment</CardTitle>
              <CalendarClock className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody>
              <p className="text-sm text-ink-soft">Open the appointments module to view the full schedule.</p>
              <Link href="/appointments" className={buttonClasses("subtle", "sm", "mt-3 w-full")}>
                View appointments
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
    </div>
  );
}
