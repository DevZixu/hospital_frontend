"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, Plus } from "lucide-react";
import { apiList } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { APPOINTMENT_STATUS_OPTIONS, APPOINTMENT_TYPE_OPTIONS, statusTone } from "@/lib/constants";
import { formatDateTime, fullName, humanize } from "@/lib/format";
import type { Appointment } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/spinner";
import { Pagination } from "@/components/ui/pagination";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

export default function AppointmentsPage() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);

  const { data, loading, error } = useAsync(
    () =>
      apiList<Appointment>("/appointments", {
        page,
        limit: 15,
        status,
        type,
        date,
      }),
    [page, status, type, date],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Appointments" description="Schedule and track patient visits.">
        <Link href="/appointments/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Book appointment
        </Link>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-3">
            <Select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              options={APPOINTMENT_STATUS_OPTIONS}
              placeholder="All statuses"
              className="sm:w-44"
            />
            <Select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              options={APPOINTMENT_TYPE_OPTIONS}
              placeholder="All types"
              className="sm:w-48"
            />
          </div>
          <Input
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setPage(1);
            }}
            className="sm:w-44"
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
                  <TH>Doctor</TH>
                  <TH>Type</TH>
                  <TH>Scheduled</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((appointment) => (
                  <TR key={appointment.id}>
                    <TD>
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={fullName(appointment.patient)} className="h-9 w-9" />
                        <span>
                          <span className="block font-medium text-ink group-hover:text-brand-700">
                            {fullName(appointment.patient)}
                          </span>
                          <span className="block font-mono text-xs text-ink-faint">
                            {appointment.appointmentNo}
                          </span>
                        </span>
                      </Link>
                    </TD>
                    <TD className="text-ink-soft">
                      {appointment.doctor?.staff
                        ? `Dr. ${appointment.doctor.staff.firstName} ${appointment.doctor.staff.lastName}`
                        : "—"}
                    </TD>
                    <TD>{humanize(appointment.type)}</TD>
                    <TD className="text-ink-soft">{formatDateTime(appointment.scheduledAt)}</TD>
                    <TD>
                      <Badge tone={statusTone(appointment.status)}>{humanize(appointment.status)}</Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={CalendarClock}
            title="No appointments found"
            description="Adjust your filters or book a new appointment."
            action={
              <Link href="/appointments/new" className={buttonClasses("outline", "sm")}>
                <Plus className="h-4 w-4" />
                Book appointment
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
