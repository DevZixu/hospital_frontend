"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus } from "lucide-react";
import { apiList } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { formatDateTime, fullName } from "@/lib/format";
import type { MedicalRecord } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function MedicalRecordsPage() {
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () => apiList<MedicalRecord>("/medical-records", { page, limit: 15 }),
    [page],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Medical Records" description="Clinical encounters, diagnoses and notes.">
        <Link href="/medical-records/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          New record
        </Link>
      </PageHeader>

      <Card>
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
                  <TH>Record</TH>
                  <TH>Doctor</TH>
                  <TH>Diagnoses</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((record) => (
                  <TR key={record.id}>
                    <TD>
                      <Link
                        href={`/medical-records/${record.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={fullName(record.patient)} className="h-9 w-9" />
                        <span>
                          <span className="block font-medium text-ink group-hover:text-brand-700">
                            {fullName(record.patient)}
                          </span>
                          <span className="block text-xs text-ink-faint">
                            {record.patient?.patientId ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-ink-soft">{record.recordNo}</span>
                      <span className="block text-xs text-ink-faint">
                        {record.chiefComplaint ?? "Consultation"}
                      </span>
                    </TD>
                    <TD className="text-ink-soft">
                      {record.doctor?.staff
                        ? `Dr. ${record.doctor.staff.firstName} ${record.doctor.staff.lastName}`
                        : "—"}
                    </TD>
                    <TD>
                      {record.diagnoses && record.diagnoses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {record.diagnoses.slice(0, 2).map((diagnosis) => (
                            <Badge key={diagnosis.id} tone={diagnosis.isPrimary ? "brand" : "neutral"}>
                              {diagnosis.name}
                            </Badge>
                          ))}
                          {record.diagnoses.length > 2 ? (
                            <Badge tone="neutral">+{record.diagnoses.length - 2}</Badge>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">None</span>
                      )}
                    </TD>
                    <TD className="text-ink-soft">{formatDateTime(record.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No medical records"
            description="Clinical records created by doctors will appear here."
            action={
              <Link href="/medical-records/new" className={buttonClasses("outline", "sm")}>
                <Plus className="h-4 w-4" />
                New record
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
