"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity, ArrowLeft, FlaskConical, PencilLine, Pill, Plus } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { statusTone } from "@/lib/constants";
import { formatDate, formatDateTime, fullName, humanize } from "@/lib/format";
import type { MedicalRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

interface NurseNote {
  id: string;
  note: string;
  noteType?: string | null;
  createdAt?: string;
}

interface ExtendedRecord extends MedicalRecord {
  nurseNotes?: NurseNote[];
  radiologyOrders?: { id: string; modality?: string; status?: string }[];
}

export default function MedicalRecordDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [tab, setTab] = useState("notes");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosisOpen, setDiagnosisOpen] = useState(false);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const [diagnosis, setDiagnosis] = useState({ name: "", icdCode: "", isPrimary: false });
  const [vitals, setVitals] = useState({
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    heartRate: "",
    temperature: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  });
  const [note, setNote] = useState({ note: "", noteType: "GENERAL" });

  const { data: record, loading, error: loadError, refetch } = useAsync(
    () => apiGet<ExtendedRecord>(`/medical-records/${params.id}`),
    [params.id],
  );

  const run = async (action: () => Promise<unknown>, success: string) => {
    setSaving(true);
    setError(null);
    try {
      await action();
      toast.success(success);
      refetch();
      return true;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading record…" />;
  if (loadError || !record) return <Alert tone="danger">{loadError ?? "Record not found"}</Alert>;

  const doctor = record.doctor?.staff;
  const sections: { label: string; value?: string | null }[] = [
    { label: "Chief complaint", value: record.chiefComplaint },
    { label: "History of present illness", value: record.historyOfPresentIllness },
    { label: "Past medical history", value: record.pastMedicalHistory },
    { label: "Family history", value: record.familyHistory },
    { label: "Social history", value: record.socialHistory },
    { label: "Review of systems", value: record.reviewOfSystems },
    { label: "Physical examination", value: record.physicalExamination },
    { label: "Assessment", value: record.assessment },
    { label: "Plan", value: record.plan },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/medical-records"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to records
      </Link>

      <PageHeader title={record.recordNo} description={record.chiefComplaint ?? "Clinical encounter"}>
        {record.patient ? (
          <Link href={`/patients/${record.patientId}`} className={buttonClasses("outline", "md")}>
            View patient
          </Link>
        ) : null}
      </PageHeader>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "notes", label: "Clinical notes" },
          { value: "diagnoses", label: "Diagnoses", count: record.diagnoses?.length ?? 0 },
          { value: "vitals", label: "Vitals", count: record.vitalSigns?.length ?? 0 },
          { value: "orders", label: "Prescriptions & lab" },
          { value: "nurse", label: "Nurse notes", count: record.nurseNotes?.length ?? 0 },
        ]}
      />

      {tab === "notes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Encounter summary</CardTitle>
            <div className="flex items-center gap-2">
              {record.isConfidential ? <Badge tone="warning">Confidential</Badge> : null}
              <span className="text-xs text-ink-faint">{formatDateTime(record.createdAt)}</span>
            </div>
          </CardHeader>
          <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Patient</p>
              <Link
                href={`/patients/${record.patientId}`}
                className="mt-0.5 block text-sm text-ink hover:text-brand-700"
              >
                {fullName(record.patient)}
              </Link>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Clinician</p>
              <p className="mt-0.5 text-sm text-ink">
                {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"}
              </p>
            </div>
            {sections.map((section) => (
              <div key={section.label} className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  {section.label}
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
                  {section.value || "—"}
                </p>
              </div>
            ))}
            {record.followUpDate ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Follow-up
                </p>
                <p className="mt-0.5 text-sm text-ink">
                  {formatDate(record.followUpDate)}
                  {record.followUpNotes ? ` · ${record.followUpNotes}` : ""}
                </p>
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {tab === "diagnoses" ? (
        <Card>
          <CardHeader>
            <CardTitle>Diagnoses</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setDiagnosisOpen(true)}>
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </CardHeader>
          {record.diagnoses && record.diagnoses.length > 0 ? (
            <ul className="divide-y divide-line">
              {record.diagnoses.map((item) => (
                <li key={item.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.name}</p>
                    {item.description ? (
                      <p className="text-xs text-ink-faint">{item.description}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.icdCode ? <Badge tone="neutral">{item.icdCode}</Badge> : null}
                    {item.isPrimary ? <Badge tone="brand">Primary</Badge> : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={PencilLine} title="No diagnoses recorded" />
          )}
        </Card>
      ) : null}

      {tab === "vitals" ? (
        <Card>
          <CardHeader>
            <CardTitle>Vital signs</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setVitalsOpen(true)}>
              <Plus className="h-4 w-4" />
              Record vitals
            </Button>
          </CardHeader>
          {record.vitalSigns && record.vitalSigns.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Recorded</TH>
                  <TH>BP</TH>
                  <TH>Pulse</TH>
                  <TH>Temp</TH>
                  <TH>SpO₂</TH>
                  <TH>Weight</TH>
                </TR>
              </THead>
              <TBody>
                {record.vitalSigns.map((vital) => (
                  <TR key={vital.id}>
                    <TD className="text-ink-soft">{formatDateTime(vital.recordedAt)}</TD>
                    <TD>
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                        ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic}`
                        : "—"}
                    </TD>
                    <TD>{vital.heartRate ?? "—"}</TD>
                    <TD>{vital.temperature ?? "—"}</TD>
                    <TD>{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "—"}</TD>
                    <TD>{vital.weight ? `${vital.weight} kg` : "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={Activity} title="No vitals recorded" />
          )}
        </Card>
      ) : null}

      {tab === "orders" ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            {record.prescriptions && record.prescriptions.length > 0 ? (
              <ul className="divide-y divide-line">
                {record.prescriptions.map((prescription) => (
                  <li key={prescription.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <Link
                        href={`/pharmacy/prescriptions/${prescription.id}`}
                        className="text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {prescription.prescriptionNo}
                      </Link>
                      <p className="text-xs text-ink-faint">
                        {prescription.items?.length ?? 0} item(s)
                      </p>
                    </div>
                    <Badge tone={statusTone(prescription.status)}>
                      {humanize(prescription.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Pill} title="No prescriptions" />
            )}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Laboratory orders</CardTitle>
              <FlaskConical className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            {record.labOrders && record.labOrders.length > 0 ? (
              <ul className="divide-y divide-line">
                {record.labOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <Link
                        href={`/laboratory/orders/${order.id}`}
                        className="text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {order.orderNo}
                      </Link>
                      <p className="text-xs text-ink-faint">{order.items?.length ?? 0} test(s)</p>
                    </div>
                    <Badge tone={statusTone(order.priority)}>{humanize(order.priority)}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={FlaskConical} title="No lab orders" />
            )}
          </Card>
        </div>
      ) : null}

      {tab === "nurse" ? (
        <Card>
          <CardHeader>
            <CardTitle>Nurse notes</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setNoteOpen(true)}>
              <Plus className="h-4 w-4" />
              Add note
            </Button>
          </CardHeader>
          {record.nurseNotes && record.nurseNotes.length > 0 ? (
            <ul className="divide-y divide-line">
              {record.nurseNotes.map((item) => (
                <li key={item.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between">
                    <Badge tone="neutral">{humanize(item.noteType ?? "GENERAL")}</Badge>
                    <span className="text-xs text-ink-faint">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink">{item.note}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={PencilLine} title="No nurse notes" />
          )}
        </Card>
      ) : null}

      <Modal
        open={diagnosisOpen}
        onClose={() => setDiagnosisOpen(false)}
        title="Add diagnosis"
        footer={
          <>
            <Button variant="outline" onClick={() => setDiagnosisOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!diagnosis.name}
              onClick={async () => {
                const ok = await run(
                  () => apiPost(`/medical-records/${record.id}/diagnoses`, diagnosis),
                  "Diagnosis added",
                );
                if (ok) {
                  setDiagnosisOpen(false);
                  setDiagnosis({ name: "", icdCode: "", isPrimary: false });
                }
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Diagnosis name" required>
            <Input
              value={diagnosis.name}
              onChange={(event) => setDiagnosis((c) => ({ ...c, name: event.target.value }))}
            />
          </FormField>
          <FormField label="ICD code">
            <Input
              value={diagnosis.icdCode}
              onChange={(event) => setDiagnosis((c) => ({ ...c, icdCode: event.target.value }))}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={diagnosis.isPrimary}
              onChange={(event) => setDiagnosis((c) => ({ ...c, isPrimary: event.target.checked }))}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Primary diagnosis
          </label>
        </div>
      </Modal>

      <Modal
        open={vitalsOpen}
        onClose={() => setVitalsOpen(false)}
        title="Record vitals"
        footer={
          <>
            <Button variant="outline" onClick={() => setVitalsOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={async () => {
                const payload: Record<string, unknown> = {};
                for (const [key, value] of Object.entries(vitals)) {
                  if (value !== "") payload[key] = Number(value);
                }
                const ok = await run(
                  () => apiPost(`/medical-records/${record.id}/vitals`, payload),
                  "Vitals recorded",
                );
                if (ok) {
                  setVitalsOpen(false);
                  setVitals({
                    bloodPressureSystolic: "",
                    bloodPressureDiastolic: "",
                    heartRate: "",
                    temperature: "",
                    respiratoryRate: "",
                    oxygenSaturation: "",
                    weight: "",
                    height: "",
                  });
                }
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {error ? (
            <div className="sm:col-span-2">
              <Alert tone="danger">{error}</Alert>
            </div>
          ) : null}
          {(
            [
              ["bloodPressureSystolic", "Systolic BP"],
              ["bloodPressureDiastolic", "Diastolic BP"],
              ["heartRate", "Heart rate (bpm)"],
              ["temperature", "Temperature (°C)"],
              ["respiratoryRate", "Respiratory rate"],
              ["oxygenSaturation", "Oxygen saturation (%)"],
              ["weight", "Weight (kg)"],
              ["height", "Height (cm)"],
            ] as const
          ).map(([key, label]) => (
            <FormField key={key} label={label}>
              <Input
                type="number"
                value={vitals[key]}
                onChange={(event) => setVitals((c) => ({ ...c, [key]: event.target.value }))}
              />
            </FormField>
          ))}
        </div>
      </Modal>

      <Modal
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Add nurse note"
        footer={
          <>
            <Button variant="outline" onClick={() => setNoteOpen(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!note.note}
              onClick={async () => {
                const ok = await run(
                  () => apiPost(`/medical-records/${record.id}/nurse-notes`, note),
                  "Note added",
                );
                if (ok) {
                  setNoteOpen(false);
                  setNote({ note: "", noteType: "GENERAL" });
                }
              }}
            >
              Add note
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Note" required>
            <Textarea
              rows={4}
              value={note.note}
              onChange={(event) => setNote((c) => ({ ...c, note: event.target.value }))}
            />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
