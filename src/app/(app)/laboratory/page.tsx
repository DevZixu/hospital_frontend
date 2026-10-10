"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, Plus } from "lucide-react";
import { apiList, apiPatch, apiPost, ApiError } from "@/lib/api";
import { useAsync, useDebouncedValue } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { LAB_PRIORITY_OPTIONS, LAB_STATUS_OPTIONS, statusTone } from "@/lib/constants";
import { formatCurrency, formatDateTime, fullName, humanize } from "@/lib/format";
import type { LabOrder, LabTest } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormField } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";

export default function LaboratoryPage() {
  const toast = useToast();
  const [tab, setTab] = useState("orders");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [page, setPage] = useState(1);
  const [testSearch, setTestSearch] = useState("");
  const debouncedTestSearch = useDebouncedValue(testSearch);
  const [testModal, setTestModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [test, setTest] = useState({
    name: "",
    code: "",
    category: "",
    sampleType: "",
    unit: "",
    normalRange: "",
    price: "",
  });

  const orders = useAsync(
    () => apiList<LabOrder>("/laboratory/orders", { page, limit: 15, status, priority }),
    [page, status, priority],
  );

  const tests = useAsync(
    () => apiList<LabTest>("/laboratory/tests", { search: debouncedTestSearch }),
    [debouncedTestSearch],
  );

  const createTest = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(test)) {
        if (value === "") continue;
        payload[key] = key === "price" ? Number(value) : value;
      }
      await apiPost("/laboratory/tests", payload);
      toast.success("Lab test created");
      setTestModal(false);
      setTest({ name: "", code: "", category: "", sampleType: "", unit: "", normalRange: "", price: "" });
      tests.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create test");
    } finally {
      setSaving(false);
    }
  };

  const toggleTest = async (labTest: LabTest) => {
    try {
      await apiPatch(`/laboratory/tests/${labTest.id}`, { isActive: !labTest.isActive });
      toast.success("Test updated");
      tests.refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to update test");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Laboratory" description="Diagnostic test catalogue and patient orders.">
        <Link href="/laboratory/orders/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          New lab order
        </Link>
      </PageHeader>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "orders", label: "Orders" },
          { value: "tests", label: "Test catalogue" },
        ]}
      />

      {tab === "orders" ? (
        <Card>
          <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <Select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                options={LAB_STATUS_OPTIONS}
                placeholder="All statuses"
                className="sm:w-48"
              />
              <Select
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value);
                  setPage(1);
                }}
                options={LAB_PRIORITY_OPTIONS}
                placeholder="All priorities"
                className="sm:w-40"
              />
            </div>
          </div>

          {orders.loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : orders.error ? (
            <div className="px-5 py-10 text-center text-sm text-red-600">{orders.error}</div>
          ) : orders.data && orders.data.items.length > 0 ? (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Order</TH>
                    <TH>Patient</TH>
                    <TH>Tests</TH>
                    <TH>Priority</TH>
                    <TH>Created</TH>
                  </TR>
                </THead>
                <TBody>
                  {orders.data.items.map((order) => (
                    <TR key={order.id}>
                      <TD>
                        <Link
                          href={`/laboratory/orders/${order.id}`}
                          className="font-mono text-xs text-ink hover:text-brand-700"
                        >
                          {order.orderNo}
                        </Link>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName(order.patient)} className="h-8 w-8" />
                          <span className="font-medium text-ink">{fullName(order.patient)}</span>
                        </div>
                      </TD>
                      <TD className="text-ink-soft">{order.items?.length ?? 0}</TD>
                      <TD>
                        <Badge tone={statusTone(order.priority)}>{humanize(order.priority)}</Badge>
                      </TD>
                      <TD className="text-ink-soft">{formatDateTime(order.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination meta={orders.data.meta} onPageChange={setPage} />
            </>
          ) : (
            <EmptyState
              icon={FlaskConical}
              title="No lab orders"
              description="Create an order to request diagnostic tests."
              action={
                <Link href="/laboratory/orders/new" className={buttonClasses("outline", "sm")}>
                  <Plus className="h-4 w-4" />
                  New lab order
                </Link>
              }
            />
          )}
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Test catalogue</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search tests…"
                value={testSearch}
                onChange={(event) => setTestSearch(event.target.value)}
                className="w-48"
              />
              <Button size="sm" variant="outline" onClick={() => setTestModal(true)}>
                <Plus className="h-4 w-4" />
                Add test
              </Button>
            </div>
          </CardHeader>

          {tests.loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : tests.data && tests.data.items.length > 0 ? (
            <Table>
              <THead>
                <TR>
                  <TH>Test</TH>
                  <TH>Category</TH>
                  <TH>Sample</TH>
                  <TH>Reference</TH>
                  <TH>Price</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {tests.data.items.map((labTest) => (
                  <TR key={labTest.id}>
                    <TD>
                      <p className="font-medium text-ink">{labTest.name}</p>
                      {labTest.code ? (
                        <p className="font-mono text-xs text-ink-faint">{labTest.code}</p>
                      ) : null}
                    </TD>
                    <TD className="text-ink-soft">{labTest.category ?? "—"}</TD>
                    <TD className="text-ink-soft">{labTest.sampleType ?? "—"}</TD>
                    <TD className="text-ink-soft">
                      {labTest.normalRange ?? "—"}
                      {labTest.unit ? ` ${labTest.unit}` : ""}
                    </TD>
                    <TD className="text-ink-soft">{formatCurrency(labTest.price)}</TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() => toggleTest(labTest)}
                        className="focus-ring rounded"
                        title="Toggle active"
                      >
                        <Badge tone={labTest.isActive ? "success" : "neutral"} dot>
                          {labTest.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState icon={FlaskConical} title="No tests in catalogue" />
          )}
        </Card>
      )}

      <Modal
        open={testModal}
        onClose={() => setTestModal(false)}
        title="Add lab test"
        footer={
          <>
            <Button variant="outline" onClick={() => setTestModal(false)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={!test.name} onClick={createTest}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Name" required>
            <Input value={test.name} onChange={(event) => setTest((c) => ({ ...c, name: event.target.value }))} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Code">
              <Input value={test.code} onChange={(event) => setTest((c) => ({ ...c, code: event.target.value }))} />
            </FormField>
            <FormField label="Category">
              <Input value={test.category} onChange={(event) => setTest((c) => ({ ...c, category: event.target.value }))} />
            </FormField>
            <FormField label="Sample type">
              <Input value={test.sampleType} onChange={(event) => setTest((c) => ({ ...c, sampleType: event.target.value }))} />
            </FormField>
            <FormField label="Unit">
              <Input value={test.unit} onChange={(event) => setTest((c) => ({ ...c, unit: event.target.value }))} />
            </FormField>
            <FormField label="Normal range">
              <Input value={test.normalRange} onChange={(event) => setTest((c) => ({ ...c, normalRange: event.target.value }))} />
            </FormField>
            <FormField label="Price">
              <Input type="number" value={test.price} onChange={(event) => setTest((c) => ({ ...c, price: event.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
