"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Pill } from "lucide-react";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { statusTone } from "@/lib/constants";
import { formatDate, formatDateTime, fullName, humanize } from "@/lib/format";
import type { Prescription } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function PrescriptionDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { hasRole } = useAuth();
  const [dispensing, setDispensing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: prescription, loading, error: loadError, refetch } = useAsync(
    () => apiGet<Prescription>(`/pharmacy/prescriptions/${params.id}`),
    [params.id],
  );

  const dispense = async () => {
    if (!prescription) return;
    setDispensing(true);
    setError(null);
    try {
      await apiPost(`/pharmacy/prescriptions/${prescription.id}/dispense`, {});
      toast.success("Prescription dispensed");
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to dispense");
    } finally {
      setDispensing(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading prescription…" />;
  if (loadError || !prescription)
    return <Alert tone="danger">{loadError ?? "Prescription not found"}</Alert>;

  const doctor = prescription.doctor?.staff;
  const canDispense =
    hasRole("PHARMACIST") &&
    prescription.status !== "DISPENSED" &&
    prescription.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <Link
        href="/pharmacy"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to pharmacy
      </Link>

      <PageHeader title={prescription.prescriptionNo} description="Prescription">
        <div className="flex items-center gap-2">
          <Badge tone={statusTone(prescription.status)}>{humanize(prescription.status)}</Badge>
          {canDispense ? (
            <Button loading={dispensing} onClick={dispense}>
              Dispense
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Patient</p>
              <Link
                href={`/patients/${prescription.patientId}`}
                className="mt-0.5 block text-sm text-ink hover:text-brand-700"
              >
                {fullName(prescription.patient)}
              </Link>
              {prescription.patient?.patientId ? (
                <p className="font-mono text-xs text-ink-faint">{prescription.patient.patientId}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Prescriber</p>
              <p className="mt-0.5 text-sm text-ink">
                {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Issued</p>
              <p className="mt-0.5 text-sm text-ink">{formatDateTime(prescription.createdAt)}</p>
            </div>
            {prescription.validUntil ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Valid until
                </p>
                <p className="mt-0.5 text-sm text-ink">{formatDate(prescription.validUntil)}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Refillable</p>
              <p className="mt-0.5 text-sm text-ink">{prescription.isRefillable ? "Yes" : "No"}</p>
            </div>
            {prescription.notes ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Notes</p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{prescription.notes}</p>
              </div>
            ) : null}
            {prescription.medicalRecordId ? (
              <Link
                href={`/medical-records/${prescription.medicalRecordId}`}
                className={buttonClasses("outline", "sm")}
              >
                View medical record
              </Link>
            ) : null}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Medications</CardTitle>
            <Pill className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          {prescription.items && prescription.items.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Medication</TH>
                  <TH>Dosage</TH>
                  <TH>Frequency</TH>
                  <TH>Duration</TH>
                  <TH>Qty</TH>
                </TR>
              </THead>
              <TBody>
                {prescription.items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-medium text-ink">{item.medication?.name ?? "—"}</p>
                      {item.medication?.genericName ? (
                        <p className="text-xs text-ink-faint">{item.medication.genericName}</p>
                      ) : null}
                      {item.instructions ? (
                        <p className="text-xs text-ink-faint">{item.instructions}</p>
                      ) : null}
                    </TD>
                    <TD className="text-ink-soft">{item.dosage}</TD>
                    <TD className="text-ink-soft">
                      {humanize(item.frequency)}
                      {item.route ? ` · ${humanize(item.route)}` : ""}
                    </TD>
                    <TD className="text-ink-soft">
                      {item.duration ? `${item.duration} ${humanize(item.durationUnit)}` : "—"}
                    </TD>
                    <TD className="text-ink-soft">{item.quantity}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={Pill} title="No medications" />
          )}
        </Card>
      </div>
    </div>
  );
}
