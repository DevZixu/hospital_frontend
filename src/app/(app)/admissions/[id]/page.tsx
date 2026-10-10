"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BedDouble, LogOut, MoveRight } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { statusTone } from "@/lib/constants";
import { formatDate, formatDateTime, fullName, humanize } from "@/lib/format";
import type { Admission } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";

export default function AdmissionDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [dischargeOpen, setDischargeOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dischargeNotes, setDischargeNotes] = useState("");
  const [newBedId, setNewBedId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const { data: admission, loading, error: loadError, refetch } = useAsync(
    () => apiGet<Admission>(`/admissions/${params.id}`),
    [params.id],
  );

  const discharge = async () => {
    if (!admission) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/admissions/${admission.id}/discharge`, { dischargeNotes });
      toast.success("Patient discharged");
      setDischargeOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to discharge");
    } finally {
      setSaving(false);
    }
  };

  const transfer = async () => {
    if (!admission) return;
    setSaving(true);
    setError(null);
    try {
      await apiPost(`/admissions/${admission.id}/transfer`, { newBedId, transferNotes });
      toast.success("Patient transferred");
      setTransferOpen(false);
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to transfer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading admission…" />;
  if (loadError || !admission) return <Alert tone="danger">{loadError ?? "Admission not found"}</Alert>;

  const active = admission.status === "ADMITTED";

  return (
    <div className="space-y-6">
      <Link href="/admissions" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to admissions
      </Link>

      <PageHeader title={admission.admissionNo} description={humanize(admission.status)}>
        {active ? (
          <>
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <MoveRight className="h-4 w-4" />
              Transfer
            </Button>
            <Button onClick={() => setDischargeOpen(true)}>
              <LogOut className="h-4 w-4" />
              Discharge
            </Button>
          </>
        ) : null}
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Admission</CardTitle>
            <Badge tone={statusTone(admission.status)}>{humanize(admission.status)}</Badge>
          </CardHeader>
          <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Detail label="Admitted" value={formatDateTime(admission.admissionDate)} />
            <Detail label="Expected discharge" value={formatDate(admission.expectedDischarge)} />
            <Detail label="Discharged" value={admission.dischargeDate ? formatDateTime(admission.dischargeDate) : undefined} />
            <Detail label="Referral source" value={admission.referralSource} />
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Admission reason
              </p>
              <p className="mt-0.5 text-sm text-ink">{admission.admissionReason || "—"}</p>
            </div>
            {admission.dischargeNotes ? (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Discharge notes
                </p>
                <p className="mt-0.5 text-sm text-ink">{admission.dischargeNotes}</p>
              </div>
            ) : null}
          </CardBody>

          {admission.medicalRecords && admission.medicalRecords.length > 0 ? (
            <>
              <CardHeader className="border-t">
                <CardTitle>Medical records</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-line">
                {admission.medicalRecords.map((record) => (
                  <li key={record.id} className="flex items-center justify-between px-5 py-3">
                    <Link
                      href={`/medical-records/${record.id}`}
                      className="text-sm font-medium text-ink hover:text-brand-700"
                    >
                      {record.chiefComplaint ?? record.recordNo}
                    </Link>
                    <span className="text-xs text-ink-faint">{formatDate(record.createdAt)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient</CardTitle>
            </CardHeader>
            <CardBody className="flex items-center gap-3">
              <Avatar name={fullName(admission.patient)} className="h-11 w-11" />
              <div className="min-w-0">
                <Link
                  href={`/patients/${admission.patientId}`}
                  className="block truncate text-sm font-medium text-ink hover:text-brand-700"
                >
                  {fullName(admission.patient)}
                </Link>
                <p className="truncate font-mono text-xs text-ink-faint">
                  {admission.patient?.patientId}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bed assignment</CardTitle>
              <BedDouble className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody>
              {admission.bed ? (
                <>
                  <p className="text-sm font-medium text-ink">{admission.bed.bedNumber}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {admission.bed.ward?.name ?? "Ward"}
                    {admission.bed.ward?.wardCode ? ` · ${admission.bed.ward.wardCode}` : ""}
                  </p>
                </>
              ) : (
                <p className="text-sm text-ink-soft">No bed assigned</p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent vitals</CardTitle>
            </CardHeader>
            {admission.vitalSigns && admission.vitalSigns.length > 0 ? (
              <ul className="divide-y divide-line">
                {admission.vitalSigns.slice(0, 5).map((vital) => (
                  <li key={vital.id} className="px-5 py-3">
                    <p className="text-xs text-ink-faint">{formatDateTime(vital.recordedAt)}</p>
                    <p className="mt-0.5 text-sm text-ink">
                      {vital.bloodPressureSystolic && vital.bloodPressureDiastolic
                        ? `${vital.bloodPressureSystolic}/${vital.bloodPressureDiastolic} mmHg`
                        : "—"}
                      {vital.heartRate ? ` · ${vital.heartRate} bpm` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={BedDouble} title="No vitals recorded" />
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={dischargeOpen}
        onClose={() => setDischargeOpen(false)}
        title="Discharge patient"
        footer={
          <>
            <Button variant="outline" onClick={() => setDischargeOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={discharge}>
              Confirm discharge
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Discharge notes" required>
            <Textarea
              rows={3}
              value={dischargeNotes}
              onChange={(event) => setDischargeNotes(event.target.value)}
            />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer patient"
        footer={
          <>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              Cancel
            </Button>
            <Button loading={saving} onClick={transfer} disabled={!newBedId}>
              Transfer
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="New bed ID" required>
            <Input value={newBedId} onChange={(event) => setNewBedId(event.target.value)} />
          </FormField>
          <FormField label="Transfer notes">
            <Textarea
              rows={2}
              value={transferNotes}
              onChange={(event) => setTransferNotes(event.target.value)}
            />
          </FormField>
        </div>
      </Modal>
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
