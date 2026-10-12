"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  BedDouble,
  CalendarClock,
  CalendarPlus,
  FlaskConical,
  Pill,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { apiList, apiGet } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { useAuth } from "@/lib/auth";
import { formatDate, formatTime, fullName, humanize, genderLabel, roleLabel } from "@/lib/format";
import type { Admission, Appointment, LabOrder, Patient } from "@/lib/types";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { statusTone } from "@/lib/constants";
import { Avatar } from "@/components/ui/avatar";

interface DashboardData {
  patientCount: number;
  recentPatients: Patient[];
  todayAppointments: Appointment[];
  admittedCount: number;
  pendingLabs: number;
  pendingPrescriptions: number;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

async function loadDashboard(): Promise<DashboardData> {
  const [patients, recentPatients, appointments, admissions, labs, prescriptions] =
    await Promise.all([
      apiList<Patient>("/patients", { page: 1, limit: 1 }),
      apiList<Patient>("/patients", { page: 1, limit: 5 }),
      apiList<Appointment>("/appointments", { date: todayIso(), limit: 6 }),
      apiList<Admission>("/admissions", { status: "ADMITTED", page: 1, limit: 1 }),
      apiList<LabOrder>("/laboratory/orders", { status: "ORDERED", page: 1, limit: 1 }),
      apiGet<unknown>("/pharmacy/prescriptions", { params: { status: "PENDING", limit: 1 } })
        .then(() => 0)
        .catch(() => 0),
    ]);

  return {
    patientCount: patients.meta.total,
    recentPatients: recentPatients.items,
    todayAppointments: appointments.items,
    admittedCount: admissions.meta.total,
    pendingLabs: labs.meta.total,
    pendingPrescriptions: prescriptions,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error, refetch } = useAsync(loadDashboard, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") refetch();
    };
    const onFocus = () => refetch();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refetch();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refetch]);

  const firstName = user?.staff?.firstName ?? user?.patient?.firstName ?? "";
  const greeting = firstName ? `Good day, ${firstName}` : "Good day";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <PageHeader title={greeting} description={`${today} · ${roleLabel(user?.role)} workspace`}>
        <Link href="/patients/new" className={buttonClasses("outline", "md")}>
          <UserPlus className="h-4 w-4" />
          New patient
        </Link>
        <Link href="/appointments/new" className={buttonClasses("primary", "md")}>
          <CalendarPlus className="h-4 w-4" />
          Book appointment
        </Link>
      </PageHeader>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-600">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total patients"
          value={loading ? "—" : (data?.patientCount ?? 0)}
          icon={UsersRound}
          tone="brand"
        />
        <StatCard
          label="Appointments today"
          value={loading ? "—" : (data?.todayAppointments.length ?? 0)}
          icon={CalendarClock}
          tone="sky"
        />
        <StatCard
          label="Currently admitted"
          value={loading ? "—" : (data?.admittedCount ?? 0)}
          icon={BedDouble}
          tone="amber"
        />
        <StatCard
          label="Pending lab orders"
          value={loading ? "—" : (data?.pendingLabs ?? 0)}
          icon={FlaskConical}
          tone="rose"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Today&apos;s appointments</CardTitle>
            <Link href="/appointments" className="text-sm font-medium text-brand-700 hover:underline">
              View all
            </Link>
          </CardHeader>
          {loading ? (
            <LoadingBlock label="Loading appointments…" />
          ) : data && data.todayAppointments.length > 0 ? (
            <ul className="divide-y divide-line">
              {data.todayAppointments.map((appointment) => (
                <li key={appointment.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-16 shrink-0 text-sm font-medium text-ink">
                    {formatTime(appointment.scheduledAt)}
                  </div>
                  <Avatar
                    name={fullName(appointment.patient)}
                    className="h-9 w-9"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/appointments/${appointment.id}`}
                      className="block truncate text-sm font-medium text-ink hover:text-brand-700"
                    >
                      {fullName(appointment.patient)}
                    </Link>
                    <p className="truncate text-xs text-ink-faint">
                      {humanize(appointment.type)}
                      {appointment.doctor?.staff
                        ? ` · Dr. ${appointment.doctor.staff.firstName} ${appointment.doctor.staff.lastName}`
                        : ""}
                    </p>
                  </div>
                  <Badge tone={statusTone(appointment.status)}>
                    {humanize(appointment.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarClock}
              title="No appointments today"
              description="Booked appointments for today will appear here."
            />
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent patients</CardTitle>
              <Link href="/patients" className="text-sm font-medium text-brand-700 hover:underline">
                View all
              </Link>
            </CardHeader>
            {loading ? (
              <LoadingBlock label="Loading patients…" />
            ) : data && data.recentPatients.length > 0 ? (
              <ul className="divide-y divide-line">
                {data.recentPatients.map((patient) => (
                  <li key={patient.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar name={fullName(patient)} className="h-9 w-9" />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/patients/${patient.id}`}
                        className="block truncate text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {fullName(patient)}
                      </Link>
                      <p className="truncate text-xs text-ink-faint">
                        {patient.patientId} · {genderLabel(patient.gender)}
                      </p>
                    </div>
                    <span className="text-xs text-ink-faint">{formatDate(patient.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={UsersRound} title="No patients yet" />
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending prescriptions</CardTitle>
              <Pill className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody>
              <p className="text-3xl font-semibold text-ink">
                {loading ? "—" : (data?.pendingPrescriptions ?? 0)}
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Prescriptions awaiting dispensing at the pharmacy.
              </p>
              <Link
                href="/pharmacy"
                className={buttonClasses("subtle", "sm", "mt-4 w-full")}
              >
                Open pharmacy
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
