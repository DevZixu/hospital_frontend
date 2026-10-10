"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";
import { apiList, apiPost, ApiError } from "@/lib/api";
import { useAsync, useDebouncedValue } from "@/lib/hooks";
import { useToast } from "@/components/ui/toast";
import { LAB_PRIORITY_OPTIONS } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import type { Doctor, LabOrder, LabTest, Patient } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/field";
import { SearchSelect } from "@/components/ui/search-select";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/cn";

async function loadPatients(query: string) {
  const { items } = await apiList<Patient>("/patients", { search: query, limit: 10 });
  return items.map((patient) => ({
    value: patient.id,
    label: `${patient.firstName} ${patient.lastName}`,
    description: `${patient.patientId}${patient.phone ? ` · ${patient.phone}` : ""}`,
  }));
}

async function loadDoctors(query: string) {
  const { items: doctors } = await apiList<Doctor>("/staff/doctors", { limit: 100 });
  const filtered = query
    ? doctors.filter((doctor) =>
        `${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : doctors;
  return filtered.slice(0, 10).map((doctor) => ({
    value: doctor.id,
    label: `Dr. ${doctor.staff?.firstName ?? ""} ${doctor.staff?.lastName ?? ""}`.trim(),
    description: doctor.specialization?.name ?? "",
  }));
}

export default function NewLabOrderPage() {
  const router = useRouter();
  const toast = useToast();
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [priority, setPriority] = useState("ROUTINE");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tests = useAsync(() => apiList<LabTest>("/laboratory/tests", { search: debounced }), [debounced]);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const order = await apiPost<LabOrder>("/laboratory/orders", {
        patientId,
        doctorId,
        priority,
        clinicalNotes: clinicalNotes || undefined,
        testIds: selected,
      });
      toast.success("Lab order created", order.orderNo);
      router.push(`/laboratory/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/laboratory"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to laboratory
      </Link>
      <PageHeader title="New lab order" description="Request diagnostic tests for a patient." />
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Patient" required>
                <SearchSelect
                  value={patientId}
                  onChange={setPatientId}
                  loadOptions={loadPatients}
                  placeholder="Search patients…"
                  invalid={!patientId}
                />
              </FormField>
              <FormField label="Ordering doctor" required>
                <SearchSelect
                  value={doctorId}
                  onChange={setDoctorId}
                  loadOptions={loadDoctors}
                  placeholder="Search doctors…"
                  invalid={!doctorId}
                />
              </FormField>
              <FormField label="Priority">
                <Select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  options={LAB_PRIORITY_OPTIONS}
                />
              </FormField>
            </div>
            <FormField label="Clinical notes">
              <Textarea
                rows={3}
                value={clinicalNotes}
                onChange={(event) => setClinicalNotes(event.target.value)}
              />
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Selected tests ({selected.length})</h2>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {selected.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-ink-faint">
                No tests selected yet.
              </p>
            ) : (
              selected.map((id) => {
                const test = tests.data?.items.find((item) => item.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  >
                    <span className="text-ink">{test?.name ?? id}</span>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      className="text-xs text-ink-faint hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                );
              })
            )}
          </div>
          <div className="border-t border-line p-4">
            <Button
              className="w-full"
              loading={saving}
              disabled={!patientId || !doctorId || selected.length === 0}
              onClick={submit}
            >
              Create order
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input
              placeholder="Search test catalogue…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        {tests.loading ? (
          <LoadingBlock label="Loading tests…" />
        ) : tests.data && tests.data.items.length > 0 ? (
          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            {tests.data.items.map((test) => {
              const active = selected.includes(test.id);
              return (
                <button
                  key={test.id}
                  type="button"
                  onClick={() => toggle(test.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3.5 py-3 text-left transition focus-ring",
                    active
                      ? "border-brand-400 bg-brand-50"
                      : "border-line bg-white hover:border-brand-200",
                  )}
                >
                  <span>
                    <span className="block text-sm font-medium text-ink">{test.name}</span>
                    <span className="block text-xs text-ink-faint">
                      {test.category ?? "General"}
                      {test.sampleType ? ` · ${test.sampleType}` : ""}
                    </span>
                  </span>
                  <span className="text-xs text-ink-soft">{formatCurrency(test.price)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="px-5 py-10 text-center text-sm text-ink-faint">No tests found.</p>
        )}
      </Card>
    </div>
  );
}
