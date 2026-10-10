"use client";

import { useState } from "react";
import Link from "next/link";
import { Boxes, Package, Pill, Plus } from "lucide-react";
import { apiList, apiPatch, apiPost, ApiError } from "@/lib/api";
import { useAsync, useDebouncedValue } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import {
  MEDICATION_FORMS,
  PRESCRIPTION_STATUS_OPTIONS,
  statusTone,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime, fullName, humanize } from "@/lib/format";
import type { Medication, PharmacyStock, Prescription } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses, Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { SearchSelect } from "@/components/ui/search-select";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";

const FORM_OPTIONS = MEDICATION_FORMS.map((form) => ({ value: form, label: humanize(form) }));

async function loadMedicationOptions(query: string) {
  const { items } = await apiList<Medication>("/pharmacy/medications", { search: query, limit: 10 });
  return items.map((medication) => ({
    value: medication.id,
    label: medication.name,
    description: [medication.genericName, medication.strength].filter(Boolean).join(" · "),
  }));
}

export default function PharmacyPage() {
  const toast = useToast();
  const { hasRole } = useAuth();
  const [tab, setTab] = useState("prescriptions");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [medSearch, setMedSearch] = useState("");
  const debouncedMedSearch = useDebouncedValue(medSearch);
  const [medPage, setMedPage] = useState(1);
  const [medModal, setMedModal] = useState(false);
  const [medEditing, setMedEditing] = useState<Medication | null>(null);
  const [medForm, setMedForm] = useState({
    name: "",
    genericName: "",
    brand: "",
    category: "",
    form: "",
    strength: "",
    description: "",
    reorderLevel: "",
  });

  const [stockFilter, setStockFilter] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [stockModal, setStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    medicationId: "",
    batchNumber: "",
    quantity: "",
    sellingPrice: "",
    expiryDate: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prescriptions = useAsync(
    () => apiList<Prescription>("/pharmacy/prescriptions", { page, limit: 15, status }),
    [page, status],
  );
  const medications = useAsync(
    () => apiList<Medication>("/pharmacy/medications", { page: medPage, limit: 15, search: debouncedMedSearch }),
    [medPage, debouncedMedSearch],
  );
  const stock = useAsync(
    () =>
      apiList<PharmacyStock>("/pharmacy/stock", {
        page: stockPage,
        limit: 15,
        ...(stockFilter ? { [stockFilter]: "true" } : {}),
      }),
    [stockPage, stockFilter],
  );

  const canManage = hasRole("ADMIN", "PHARMACIST");

  const openMedication = (medication?: Medication) => {
    setMedEditing(medication ?? null);
    setMedForm({
      name: medication?.name ?? "",
      genericName: medication?.genericName ?? "",
      brand: medication?.brand ?? "",
      category: medication?.category ?? "",
      form: medication?.form ?? "",
      strength: medication?.strength ?? "",
      description: medication?.description ?? "",
      reorderLevel: medication?.reorderLevel ? String(medication.reorderLevel) : "",
    });
    setError(null);
    setMedModal(true);
  };

  const saveMedication = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(medForm)) {
        if (value === "") continue;
        payload[key] = key === "reorderLevel" ? Number(value) : value;
      }
      if (medEditing) {
        await apiPatch(`/pharmacy/medications/${medEditing.id}`, payload);
        toast.success("Medication updated");
      } else {
        await apiPost("/pharmacy/medications", payload);
        toast.success("Medication created");
      }
      setMedModal(false);
      medications.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save medication");
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiPost("/pharmacy/stock", {
        medicationId: stockForm.medicationId,
        batchNumber: stockForm.batchNumber || undefined,
        quantity: Number(stockForm.quantity),
        sellingPrice: stockForm.sellingPrice ? Number(stockForm.sellingPrice) : undefined,
        expiryDate: stockForm.expiryDate,
      });
      toast.success("Stock added");
      setStockModal(false);
      setStockForm({ medicationId: "", batchNumber: "", quantity: "", sellingPrice: "", expiryDate: "" });
      stock.refetch();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add stock");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Pharmacy" description="Medication catalogue, inventory and dispensing.">
        {hasRole("DOCTOR") ? (
          <Link href="/pharmacy/prescriptions/new" className={buttonClasses("primary", "md")}>
            <Plus className="h-4 w-4" />
            New prescription
          </Link>
        ) : null}
      </PageHeader>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "prescriptions", label: "Prescriptions" },
          { value: "medications", label: "Medications" },
          { value: "stock", label: "Stock" },
        ]}
      />

      {tab === "prescriptions" ? (
        <Card>
          <div className="flex items-center gap-3 border-b border-line p-4">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              options={PRESCRIPTION_STATUS_OPTIONS}
              placeholder="All statuses"
              className="sm:w-52"
            />
          </div>
          {prescriptions.loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : prescriptions.data && prescriptions.data.items.length > 0 ? (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Prescription</TH>
                    <TH>Patient</TH>
                    <TH>Items</TH>
                    <TH>Status</TH>
                    <TH>Issued</TH>
                  </TR>
                </THead>
                <TBody>
                  {prescriptions.data.items.map((prescription) => (
                    <TR key={prescription.id}>
                      <TD>
                        <Link
                          href={`/pharmacy/prescriptions/${prescription.id}`}
                          className="font-mono text-xs text-ink hover:text-brand-700"
                        >
                          {prescription.prescriptionNo}
                        </Link>
                      </TD>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName(prescription.patient)} className="h-8 w-8" />
                          <span className="font-medium text-ink">{fullName(prescription.patient)}</span>
                        </div>
                      </TD>
                      <TD className="text-ink-soft">{prescription.items?.length ?? 0}</TD>
                      <TD>
                        <Badge tone={statusTone(prescription.status)}>
                          {humanize(prescription.status)}
                        </Badge>
                      </TD>
                      <TD className="text-ink-soft">{formatDateTime(prescription.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination meta={prescriptions.data.meta} onPageChange={setPage} />
            </>
          ) : (
            <EmptyState icon={Pill} title="No prescriptions" />
          )}
        </Card>
      ) : null}

      {tab === "medications" ? (
        <Card>
          <CardHeader>
            <CardTitle>Medications</CardTitle>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search medications…"
                value={medSearch}
                onChange={(event) => {
                  setMedSearch(event.target.value);
                  setMedPage(1);
                }}
                className="w-52"
              />
              {canManage ? (
                <Button size="sm" variant="outline" onClick={() => openMedication()}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              ) : null}
            </div>
          </CardHeader>
          {medications.loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : medications.data && medications.data.items.length > 0 ? (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Medication</TH>
                    <TH>Form</TH>
                    <TH>Strength</TH>
                    <TH>Category</TH>
                    <TH>In stock</TH>
                    <TH className="text-right">{canManage ? "Actions" : ""}</TH>
                  </TR>
                </THead>
                <TBody>
                  {medications.data.items.map((medication) => {
                    const inStock =
                      medication.stockItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
                    const low =
                      medication.reorderLevel !== null &&
                      medication.reorderLevel !== undefined &&
                      inStock <= medication.reorderLevel;
                    return (
                      <TR key={medication.id}>
                        <TD>
                          <p className="font-medium text-ink">{medication.name}</p>
                          {medication.genericName ? (
                            <p className="text-xs text-ink-faint">{medication.genericName}</p>
                          ) : null}
                        </TD>
                        <TD className="text-ink-soft">{humanize(medication.form)}</TD>
                        <TD className="text-ink-soft">{medication.strength ?? "—"}</TD>
                        <TD className="text-ink-soft">{medication.category ?? "—"}</TD>
                        <TD>
                          <span className="text-sm text-ink">{inStock}</span>
                          {low ? (
                            <Badge tone="warning" className="ml-2">
                              Low
                            </Badge>
                          ) : null}
                        </TD>
                        <TD className="text-right">
                          {canManage ? (
                            <Button size="sm" variant="ghost" onClick={() => openMedication(medication)}>
                              Edit
                            </Button>
                          ) : null}
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
              <Pagination meta={medications.data.meta} onPageChange={setMedPage} />
            </>
          ) : (
            <EmptyState icon={Boxes} title="No medications" />
          )}
        </Card>
      ) : null}

      {tab === "stock" ? (
        <Card>
          <CardHeader>
            <CardTitle>Stock</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={stockFilter}
                onChange={(event) => {
                  setStockFilter(event.target.value);
                  setStockPage(1);
                }}
                placeholder="All stock"
                options={[
                  { value: "lowStock", label: "Low stock" },
                  { value: "expiringSoon", label: "Expiring soon" },
                ]}
                className="w-44"
              />
              {canManage ? (
                <Button size="sm" variant="outline" onClick={() => setStockModal(true)}>
                  <Plus className="h-4 w-4" />
                  Add stock
                </Button>
              ) : null}
            </div>
          </CardHeader>
          {stock.loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : stock.data && stock.data.items.length > 0 ? (
            <>
              <Table>
                <THead>
                  <TR>
                    <TH>Medication</TH>
                    <TH>Batch</TH>
                    <TH>Quantity</TH>
                    <TH>Price</TH>
                    <TH>Expiry</TH>
                  </TR>
                </THead>
                <TBody>
                  {stock.data.items.map((item) => (
                    <TR key={item.id}>
                      <TD>
                        <p className="font-medium text-ink">{item.medication?.name ?? "—"}</p>
                        {item.medication?.category ? (
                          <p className="text-xs text-ink-faint">{item.medication.category}</p>
                        ) : null}
                      </TD>
                      <TD className="font-mono text-xs text-ink-soft">{item.batchNumber ?? "—"}</TD>
                      <TD className="text-ink-soft">{item.quantity}</TD>
                      <TD className="text-ink-soft">{formatCurrency(item.sellingPrice)}</TD>
                      <TD className="text-ink-soft">{formatDate(item.expiryDate)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination meta={stock.data.meta} onPageChange={setStockPage} />
            </>
          ) : (
            <EmptyState icon={Package} title="No stock records" />
          )}
        </Card>
      ) : null}

      <Modal
        open={medModal}
        onClose={() => setMedModal(false)}
        title={medEditing ? "Edit medication" : "Add medication"}
        footer={
          <>
            <Button variant="outline" onClick={() => setMedModal(false)}>
              Cancel
            </Button>
            <Button loading={saving} disabled={!medForm.name} onClick={saveMedication}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" required>
              <Input value={medForm.name} onChange={(event) => setMedForm((c) => ({ ...c, name: event.target.value }))} />
            </FormField>
            <FormField label="Generic name">
              <Input value={medForm.genericName} onChange={(event) => setMedForm((c) => ({ ...c, genericName: event.target.value }))} />
            </FormField>
            <FormField label="Brand">
              <Input value={medForm.brand} onChange={(event) => setMedForm((c) => ({ ...c, brand: event.target.value }))} />
            </FormField>
            <FormField label="Category">
              <Input value={medForm.category} onChange={(event) => setMedForm((c) => ({ ...c, category: event.target.value }))} />
            </FormField>
            <FormField label="Form">
              <Select
                value={medForm.form}
                onChange={(event) => setMedForm((c) => ({ ...c, form: event.target.value }))}
                options={FORM_OPTIONS}
                placeholder="Select form"
              />
            </FormField>
            <FormField label="Strength">
              <Input value={medForm.strength} onChange={(event) => setMedForm((c) => ({ ...c, strength: event.target.value }))} />
            </FormField>
            <FormField label="Reorder level">
              <Input type="number" value={medForm.reorderLevel} onChange={(event) => setMedForm((c) => ({ ...c, reorderLevel: event.target.value }))} />
            </FormField>
          </div>
          <FormField label="Description">
            <Textarea rows={2} value={medForm.description} onChange={(event) => setMedForm((c) => ({ ...c, description: event.target.value }))} />
          </FormField>
        </div>
      </Modal>

      <Modal
        open={stockModal}
        onClose={() => setStockModal(false)}
        title="Add stock"
        footer={
          <>
            <Button variant="outline" onClick={() => setStockModal(false)}>
              Cancel
            </Button>
            <Button
              loading={saving}
              disabled={!stockForm.medicationId || !stockForm.quantity || !stockForm.expiryDate}
              onClick={saveStock}
            >
              Add stock
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? <Alert tone="danger">{error}</Alert> : null}
          <FormField label="Medication" required>
            <SearchSelect
              value={stockForm.medicationId}
              onChange={(value) => setStockForm((c) => ({ ...c, medicationId: value }))}
              loadOptions={loadMedicationOptions}
              placeholder="Search medications…"
              invalid={!stockForm.medicationId}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Batch number">
              <Input value={stockForm.batchNumber} onChange={(event) => setStockForm((c) => ({ ...c, batchNumber: event.target.value }))} />
            </FormField>
            <FormField label="Quantity" required>
              <Input type="number" value={stockForm.quantity} onChange={(event) => setStockForm((c) => ({ ...c, quantity: event.target.value }))} />
            </FormField>
            <FormField label="Selling price">
              <Input type="number" value={stockForm.sellingPrice} onChange={(event) => setStockForm((c) => ({ ...c, sellingPrice: event.target.value }))} />
            </FormField>
            <FormField label="Expiry date" required>
              <Input type="date" value={stockForm.expiryDate} onChange={(event) => setStockForm((c) => ({ ...c, expiryDate: event.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>
    </div>
  );
}
