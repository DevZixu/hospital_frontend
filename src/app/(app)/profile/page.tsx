"use client";

import { useState } from "react";
import { KeyRound, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";
import {
  calculateAge,
  formatDate,
  formatDateTime,
  genderLabel,
  roleLabel,
} from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/field";
import { Avatar } from "@/components/ui/avatar";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (loading) return <LoadingBlock label="Loading profile…" />;
  if (!user) return <Alert tone="danger">You are not signed in.</Alert>;

  const staff = user.staff;
  const patient = user.patient;
  const displayName = staff
    ? `${staff.firstName} ${staff.lastName}`
    : patient
      ? `${patient.firstName} ${patient.lastName}`
      : user.email;

  const changePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiPost("/auth/change-password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      toast.success("Password changed", "You will be signed out shortly");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to change password");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="Account details and security settings.">
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center py-8 text-center">
            <Avatar name={displayName} className="h-20 w-20 text-2xl" />
            <h2 className="mt-4 text-lg font-semibold text-ink">{displayName}</h2>
            <Badge tone="brand" className="mt-2">
              {roleLabel(user.role)}
            </Badge>
            <div className="mt-6 w-full space-y-3 text-left">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-ink-faint" />
                <span className="truncate text-ink-soft">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="h-4 w-4 text-ink-faint" />
                <span className="text-ink-soft">
                  {user.isActive === false ? "Inactive" : "Active"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <UserRound className="h-4 w-4 text-ink-faint" />
                <span className="text-ink-soft">
                  Last login {formatDateTime(user.lastLoginAt)}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          {staff ? (
            <Card>
              <CardHeader>
                <CardTitle>Staff details</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  ["Staff ID", staff.staffId],
                  ["Position", staff.position],
                  ["Department", staff.department?.name],
                  ["Phone", staff.phone],
                  ["Gender", genderLabel(staff.gender)],
                  ["Hired", formatDate(staff.hireDate)],
                  ["Licence", staff.doctor?.licenseNumber ?? staff.nurse?.licenseNumber],
                  [
                    "Specialization",
                    staff.doctor?.specialization?.name,
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {patient ? (
            <Card>
              <CardHeader>
                <CardTitle>Patient details</CardTitle>
              </CardHeader>
              <CardBody className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {[
                  ["Patient ID", patient.patientId],
                  ["Gender", genderLabel(patient.gender)],
                  ["Age", calculateAge(patient.dateOfBirth)?.toString()],
                  ["Phone", patient.phone],
                  ["Blood group", patient.bloodGroup],
                  ["City", patient.city],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                      {label}
                    </p>
                    <p className="mt-0.5 text-sm text-ink">{value || "—"}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Change password</CardTitle>
              <KeyRound className="h-4 w-4 text-ink-faint" />
            </CardHeader>
            <CardBody className="space-y-4">
              {error ? <Alert tone="danger">{error}</Alert> : null}
              <FormField label="Current password" required>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) =>
                    setPasswords((c) => ({ ...c, currentPassword: event.target.value }))
                  }
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="New password" required>
                  <Input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(event) =>
                      setPasswords((c) => ({ ...c, newPassword: event.target.value }))
                    }
                  />
                </FormField>
                <FormField label="Confirm new password" required>
                  <Input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(event) =>
                      setPasswords((c) => ({ ...c, confirmPassword: event.target.value }))
                    }
                  />
                </FormField>
              </div>
              <div className="flex justify-end">
                <Button
                  loading={saving}
                  disabled={
                    !passwords.currentPassword ||
                    !passwords.newPassword ||
                    !passwords.confirmPassword
                  }
                  onClick={changePassword}
                >
                  Update password
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
