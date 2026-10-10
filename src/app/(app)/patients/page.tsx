"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";
import { apiList } from "@/lib/api";
import { useAsync, useDebouncedValue } from "@/lib/hooks";
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from "@/lib/constants";
import { formatDate, fullName, genderLabel, bloodGroupLabel, calculateAge } from "@/lib/format";
import type { Patient } from "@/lib/types";
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

export default function PatientsPage() {
  const [search, setSearch] = useState("");
  const [gender, setGender] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const { data, loading, error } = useAsync(
    () =>
      apiList<Patient>("/patients", {
        page,
        limit: 15,
        search: debouncedSearch,
        gender,
        bloodGroup,
      }),
    [page, debouncedSearch, gender, bloodGroup],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Registry of all patients under care.">
        <Link href="/patients/new" className={buttonClasses("primary", "md")}>
          <Plus className="h-4 w-4" />
          New patient
        </Link>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center">
          <Input
            placeholder="Search by name, MRN, phone…"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="sm:max-w-xs"
          />
          <div className="flex gap-3">
            <Select
              value={gender}
              onChange={(event) => {
                setGender(event.target.value);
                setPage(1);
              }}
              options={GENDER_OPTIONS}
              placeholder="All genders"
              className="sm:w-40"
            />
            <Select
              value={bloodGroup}
              onChange={(event) => {
                setBloodGroup(event.target.value);
                setPage(1);
              }}
              options={BLOOD_GROUP_OPTIONS}
              placeholder="All blood groups"
              className="sm:w-44"
            />
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : error ? (
          <div className="px-5 py-10 text-center text-sm text-red-600">{error}</div>
        ) : data && data.items.length > 0 ? (
          <>
            <Table>
              <THead>
                <TR>
                  <TH>Patient</TH>
                  <TH>MRN</TH>
                  <TH>Gender</TH>
                  <TH>Age</TH>
                  <TH>Blood group</TH>
                  <TH>Registered</TH>
                </TR>
              </THead>
              <TBody>
                {data.items.map((patient) => (
                  <TR key={patient.id}>
                    <TD>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <Avatar name={fullName(patient)} className="h-9 w-9" />
                        <span>
                          <span className="block font-medium text-ink group-hover:text-brand-700">
                            {fullName(patient)}
                          </span>
                          <span className="block text-xs text-ink-faint">
                            {patient.phone ?? patient.email ?? "—"}
                          </span>
                        </span>
                      </Link>
                    </TD>
                    <TD>
                      <span className="font-mono text-xs text-ink-soft">{patient.patientId}</span>
                    </TD>
                    <TD>{genderLabel(patient.gender)}</TD>
                    <TD>{calculateAge(patient.dateOfBirth) ?? "—"}</TD>
                    <TD>
                      {patient.bloodGroup ? (
                        <Badge tone="danger">{bloodGroupLabel(patient.bloodGroup)}</Badge>
                      ) : (
                        "—"
                      )}
                    </TD>
                    <TD className="text-ink-soft">{formatDate(patient.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination meta={data.meta} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={UsersRound}
            title="No patients found"
            description="Try adjusting your search or register a new patient."
            action={
              <Link href="/patients/new" className={buttonClasses("outline", "sm")}>
                <Plus className="h-4 w-4" />
                New patient
              </Link>
            }
          />
        )}
      </Card>
    </div>
  );
}
