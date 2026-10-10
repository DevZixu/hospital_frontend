"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiPost, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";
import type { Staff } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { StaffForm, staffPayload, type StaffFormValues } from "@/components/staff/staff-form";

export default function NewStaffPage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (values: StaffFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const staff = await apiPost<Staff>("/staff", staffPayload(values, false));
      toast.success("Staff added", `${staff.firstName} ${staff.lastName} was created.`);
      router.push(`/staff/${staff.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to add staff");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/staff" className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        Back to staff
      </Link>
      <PageHeader title="Add staff" description="Provision a new staff account." />
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Card>
        <CardBody>
          <StaffForm
            submitting={submitting}
            onSubmit={onSubmit}
            onCancel={() => router.push("/staff")}
          />
        </CardBody>
      </Card>
    </div>
  );
}
