"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FlaskConical, Plus, TestTube2 } from "lucide-react";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { statusTone } from "@/lib/constants";
import { formatDateTime, fullName, humanize } from "@/lib/format";
import type { LabOrder, LabOrderItem } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function LabOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const { hasRole } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultItem, setResultItem] = useState<LabOrderItem | null>(null);
  const [result, setResult] = useState({
    resultValue: "",
    resultUnit: "",
    referenceRange: "",
    isAbnormal: false,
    notes: "",
  });

  const { data: order, loading, error: loadError, refetch } = useAsync(
    () => apiGet<LabOrder>(`/laboratory/orders/${params.id}`),
    [params.id],
  );

  const canCollect = hasRole("LAB_TECHNICIAN", "NURSE");
  const canReport = hasRole("LAB_TECHNICIAN");

  const collect = async (item: LabOrderItem) => {
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/laboratory/orders/${order?.id}/items/${item.id}/collect`, {});
      toast.success("Sample marked collected");
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to collect sample");
    } finally {
      setSaving(false);
    }
  };

  const enterResult = async () => {
    if (!order || !resultItem) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { isAbnormal: result.isAbnormal };
      for (const [key, value] of Object.entries(result)) {
        if (key === "isAbnormal") continue;
        if (value !== "") payload[key] = value;
      }
      await apiPatch(`/laboratory/orders/${order.id}/items/${resultItem.id}/result`, payload);
      toast.success("Result saved");
      setResultItem(null);
      setResult({ resultValue: "", resultUnit: "", referenceRange: "", isAbnormal: false, notes: "" });
      refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save result");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock label="Loading order…" />;
  if (loadError || !order) return <Alert tone="danger">{loadError ?? "Order not found"}</Alert>;

  const doctor = order.doctor?.staff;

  return (
    <div className="space-y-6">
      <Link
        href="/laboratory"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to laboratory
      </Link>

      <PageHeader title={order.orderNo} description="Laboratory order">
        <Badge tone={statusTone(order.priority)}>{humanize(order.priority)}</Badge>
      </PageHeader>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Order details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Patient</p>
              <Link
                href={`/patients/${order.patientId}`}
                className="mt-0.5 block text-sm text-ink hover:text-brand-700"
              >
                {fullName(order.patient)}
              </Link>
              {order.patient?.patientId ? (
                <p className="font-mono text-xs text-ink-faint">{order.patient.patientId}</p>
              ) : null}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Ordering doctor
              </p>
              <p className="mt-0.5 text-sm text-ink">
                {doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Priority</p>
              <p className="mt-0.5 text-sm text-ink">{humanize(order.priority)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Ordered</p>
              <p className="mt-0.5 text-sm text-ink">{formatDateTime(order.createdAt)}</p>
            </div>
            {order.clinicalNotes ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Clinical notes
                </p>
                <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">{order.clinicalNotes}</p>
              </div>
            ) : null}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tests</CardTitle>
            <FlaskConical className="h-4 w-4 text-ink-faint" />
          </CardHeader>
          {order.items && order.items.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Test</TH>
                  <TH>Status</TH>
                  <TH>Result</TH>
                  <TH className="text-right">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {order.items.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className="font-medium text-ink">{item.labTest?.name ?? "Test"}</p>
                      {item.labTest?.code ? (
                        <p className="font-mono text-xs text-ink-faint">{item.labTest.code}</p>
                      ) : null}
                    </TD>
                    <TD>
                      <Badge tone={statusTone(item.status)}>{humanize(item.status)}</Badge>
                    </TD>
                    <TD>
                      {item.resultValue ? (
                        <span className="text-sm text-ink">
                          {item.resultValue}
                          {item.resultUnit ? ` ${item.resultUnit}` : ""}
                          {item.isAbnormal ? (
                            <Badge tone="danger" className="ml-2">
                              Abnormal
                            </Badge>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-faint">Pending</span>
                      )}
                    </TD>
                    <TD className="text-right">
                      {item.status === "ORDERED" && canCollect ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving}
                          onClick={() => collect(item)}
                        >
                          <Plus className="h-4 w-4" />
                          Collect
                        </Button>
                      ) : null}
                      {item.status !== "COMPLETED" && item.status !== "REJECTED" && canReport ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-2"
                          onClick={() => {
                            setResult({
                              resultValue: item.resultValue ?? "",
                              resultUnit: item.resultUnit ?? "",
                              referenceRange: item.referenceRange ?? item.labTest?.normalRange ?? "",
                              isAbnormal: item.isAbnormal ?? false,
                              notes: item.notes ?? "",
                            });
                            setResultItem(item);
                          }}
                        >
                          <TestTube2 className="h-4 w-4" />
                          Result
                        </Button>
                      ) : null}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={FlaskConical} title="No tests on this order" />
          )}
        </Card>
      </div>

      <Modal
        open={resultItem !== null}
        onClose={() => setResultItem(null)}
        title={`Enter result · ${resultItem?.labTest?.name ?? "Test"}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setResultItem(null)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={!result.resultValue} onClick={enterResult}>
              Save result
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Result value" required>
              <Input
                value={result.resultValue}
                onChange={(event) => setResult((c) => ({ ...c, resultValue: event.target.value }))}
              />
            </FormField>
            <FormField label="Unit">
              <Input
                value={result.resultUnit}
                onChange={(event) => setResult((c) => ({ ...c, resultUnit: event.target.value }))}
              />
            </FormField>
            <FormField label="Reference range" className="sm:col-span-2">
              <Input
                value={result.referenceRange}
                onChange={(event) =>
                  setResult((c) => ({ ...c, referenceRange: event.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Notes">
            <Textarea
              rows={2}
              value={result.notes}
              onChange={(event) => setResult((c) => ({ ...c, notes: event.target.value }))}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={result.isAbnormal}
              onChange={(event) => setResult((c) => ({ ...c, isAbnormal: event.target.checked }))}
              className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            Flag as abnormal
          </label>
        </div>
      </Modal>
    </div>
  );
}
