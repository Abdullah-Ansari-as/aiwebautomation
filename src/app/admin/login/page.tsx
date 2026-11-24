import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/data/site";

export const metadata: Metadata = {
  title: `Admin sign in | ${siteConfig.name}`,
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main id="main-content" className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-soft sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Restricted area. Sign in with your admin email and password.</p>
          <div className="mt-6">
            <Suspense fallback={<div className="h-[9.5rem]" aria-hidden="true" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
