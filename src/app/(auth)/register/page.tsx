"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import { GENDER_OPTIONS } from "@/lib/constants";

export default function RegisterPage() {
  const { register, login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone.trim(),
      });
      await login(form.email.trim(), form.password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 lg:hidden">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Activity className="h-5 w-5" />
        </span>
        <span className="text-sm font-semibold text-ink">Aster Health</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Patient accounts are created instantly. Staff access is provisioned by an administrator.
        </p>
      </div>

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="First name" htmlFor="firstName" required>
            <Input
              id="firstName"
              autoComplete="given-name"
              value={form.firstName}
              onChange={set("firstName")}
              required
            />
          </FormField>
          <FormField label="Last name" htmlFor="lastName" required>
            <Input
              id="lastName"
              autoComplete="family-name"
              value={form.lastName}
              onChange={set("lastName")}
              required
            />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Gender" htmlFor="gender" required>
            <Select
              id="gender"
              value={form.gender}
              onChange={set("gender")}
              options={GENDER_OPTIONS}
              placeholder="Select gender"
              required
            />
          </FormField>
          <FormField label="Date of birth" htmlFor="dateOfBirth" required>
            <Input
              id="dateOfBirth"
              type="date"
              value={form.dateOfBirth}
              onChange={set("dateOfBirth")}
              required
            />
          </FormField>
        </div>
        <FormField label="Phone" htmlFor="phone" required>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={set("phone")}
            required
          />
        </FormField>
        <FormField label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={set("email")}
            required
          />
        </FormField>
        <FormField label="Password" htmlFor="password" required hint="At least 8 characters">
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={set("password")}
            required
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirm" required>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.confirm}
            onChange={set("confirm")}
            required
          />
        </FormField>
        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-ink-soft">
        Already registered?{" "}
        <Link href="/login" className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
