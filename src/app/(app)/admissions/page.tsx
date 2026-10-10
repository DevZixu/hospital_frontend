"use client";

import { useState } from "react";
import Link from "next/link";
import { BedDouble, Plus } from "lucide-react";
import { apiList } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { ADMISSION_STATUS_OPTIONS, statusTone } from "@/lib/constants";
import { formatDate, fullName, humanize } from "@/lib/format";
import type { Admission } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function AdmissionsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () => apiList<Admission>("/admissions", { page, limit: 15, status: statusFilter }),
    [page, statusFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Admissions" description="Inpatient admissions and bed assignments.">
        <Link href="/admissions/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Admit patient
        </Link>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            options={ADMISSION_STATUS_OPTIONS}
            placeholder="All statuses"
            className="sm:w-48"
          />
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : data && data.items.length > 0 ? (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Patient</TH>
                  <TH>Admission</TH>
                  <TH>Ward / Bed</TH>
                  <TH>Admitted</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((admission) => (
                  <TR key={admission.id}>
                    <TD>
                      <Link
                        href={`/admissions/${admission.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={fullName(admission.patient)} className="h-9 w-9" />
                        <span>
                          <span className="block font-medium text-ink group-hover:text-brand-700">
                            {fullName(admission.patient)}
                          </span>
                          <span className="block text-xs text-ink-faint">
                            {admission.patient?.patientId ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-ink-soft">{admission.admissionNo}</span>
                    </TD>
                    <TD className="text-ink-soft">
                      {admission.bed
                        ? `${admission.bed.ward?.name ?? "Ward"} · ${admission.bed.bedNumber}`
                        : "—"}
                    </TD>
                    <TD className="text-ink-soft">{formatDate(admission.admissionDate)}</TD>
                    <TD>
                      <Badge tone={statusTone(admission.status)}>{humanize(admission.status)}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={BedDouble}
            title="No admissions found"
            description="Adjust filters or admit a patient."
            action={
              <Link href="/admissions/new" className={buttonClasses("outline", "sm")}>
                <Plus className="h-4 w-4" />
                Admit patient
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
