"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Stethoscope } from "lucide-react";
import { apiList } from "@/lib/api";
import { useAsync, useDebouncedValue } from "@/lib/hooks";
import { STAFF_ROLE_OPTIONS } from "@/lib/constants";
import { roleLabel, staffName } from "@/lib/format";
import type { Staff } from "@/lib/types";
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

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [onDuty, setOnDuty] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error } = useAsync(
    () =>
      apiList<Staff>("/staff", {
        page,
        limit: 15,
        search: debouncedSearch,
        role,
        isOnDuty: onDuty === "true" ? true : undefined,
      }),
    [page, debouncedSearch, role, onDuty],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" description="Doctors, nurses and administrative personnel.">
        <Link href="/staff/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          Add staff
        </Link>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name, staff ID…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />
          <div className="flex gap-3">
            <Select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
              options={STAFF_ROLE_OPTIONS}
              placeholder="All roles"
              className="sm:w-44"
            />
            <Select
              value={onDuty}
              onChange={(event) => {
                setOnDuty(event.target.value);
                setPage(1);
              }}
              options={[
                { value: "true", label: "On duty" },
                { value: "false", label: "Off duty" },
              ]}
              placeholder="Any duty"
              className="sm:w-40"
            />
          </div>
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
                  <TH>Staff</TH>
                  <TH>Staff ID</TH>
                  <TH>Role</TH>
                  <TH>Department</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((member) => (
                  <TR key={member.id}>
                    <TD>
                      <Link
                        href={`/staff/${member.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={staffName(member)} className="h-9 w-9" />
                        <span>
                          <span className="block font-medium text-ink group-hover:text-brand-700">
                            {staffName(member)}
                          </span>
                          <span className="block text-xs text-ink-faint">
                            {member.user?.email ?? member.position ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-ink-soft">{member.staffId}</span>
                    </TD>
                    <TD>
                      <Badge tone="brand">{roleLabel(member.user?.role)}</Badge>
                    </TD>
                    <TD className="text-ink-soft">{member.department?.name ?? "—"}</TD>
                    <TD>
                      <Badge tone={member.isOnDuty ? "success" : "neutral"} dot>
                        {member.isOnDuty ? "On duty" : "Off duty"}
                      </Badge>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={Stethoscope}
            title="No staff found"
            description="Try adjusting your filters or add a new staff member."
            action={
              <Link href="/staff/new" className={buttonClasses("outline", "sm")}>
                <Plus className="h-4 w-4" />
                Add staff
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
