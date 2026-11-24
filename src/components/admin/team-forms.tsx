"use client";

import { UserPlus } from "lucide-react";
import { useEffect, useRef } from "react";
import { changeOwnPasswordAction, createTeamMemberAction, updateTeamMemberAction } from "@/lib/actions/team";
import { TEAM_ROLES, type TeamRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { fieldClass } from "./admin-ui";
import { ActionFeedback, SecretBox, SubmitButton, useAdminAction } from "./controls";

export function AddMemberForm() {
  const { state, onSubmit, pending, errors } = useAdminAction(createTeamMemberAction);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="member-name" className="mb-1.5 block text-sm font-medium text-foreground">
            Name
          </label>
          <input id="member-name" name="name" maxLength={80} required className={cn(fieldClass, "h-10", errors.name && "border-danger")} />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="member-email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email (login)
          </label>
          <input id="member-email" name="email" type="email" maxLength={254} required className={cn(fieldClass, "h-10", errors.email && "border-danger")} />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="member-role" className="mb-1.5 block text-sm font-medium text-foreground">
            Role
          </label>
          <select id="member-role" name="role" defaultValue="admin" className={cn(fieldClass, "h-10")}>
            {TEAM_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label} — {r.description}
              </option>
            ))}
          </select>
        </div>
      </div>
      <SubmitButton pending={pending}>
        <UserPlus className="h-4 w-4" aria-hidden="true" /> Add team member
      </SubmitButton>
      <ActionFeedback state={state} />
      {state.secret && <SecretBox secret={state.secret} />}
    </form>
  );
}

export function MemberRoleForm({ id, role }: { id: string; role: TeamRole }) {
  const { state, onSubmit, pending } = useAdminAction(updateTeamMemberAction.bind(null, id));
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <label htmlFor={`role-${id}`} className="sr-only">
        Role
      </label>
      <select id={`role-${id}`} name="role" defaultValue={role} className={cn(fieldClass, "h-9 w-28 text-xs")}>
        {TEAM_ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      <SubmitButton pending={pending} variant="outline" className="h-9 px-3 text-xs">
        Save
      </SubmitButton>
      {state.error && <span className="text-xs text-danger">{state.error}</span>}
    </form>
  );
}

export function MemberActiveForm({ id, active }: { id: string; active: boolean }) {
  const { state, onSubmit, pending } = useAdminAction(updateTeamMemberAction.bind(null, id));
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="active" value={active ? "false" : "true"} />
      <SubmitButton pending={pending} variant={active ? "outline" : "success"} className="h-9 w-full px-3 text-xs">
        {active ? "Deactivate" : "Reactivate"}
      </SubmitButton>
      {state.error && <p className="mt-1 text-xs text-danger">{state.error}</p>}
    </form>
  );
}

export function ChangePasswordForm() {
  const { state, onSubmit, pending, errors } = useAdminAction(changeOwnPasswordAction);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);
  return (
    <form ref={formRef} onSubmit={onSubmit} className="max-w-md space-y-4">
      {(["current", "next", "confirm"] as const).map((name) => (
        <div key={name}>
          <label htmlFor={`pw-${name}`} className="mb-1.5 block text-sm font-medium text-foreground">
            {name === "current" ? "Current password" : name === "next" ? "New password (10+ characters)" : "Confirm new password"}
          </label>
          <input
            id={`pw-${name}`}
            name={name}
            type="password"
            autoComplete={name === "current" ? "current-password" : "new-password"}
            required
            maxLength={200}
            className={cn(fieldClass, "h-10", errors[name] && "border-danger")}
          />
          {errors[name] && <p className="mt-1 text-xs text-danger">{errors[name]}</p>}
        </div>
      ))}
      <SubmitButton pending={pending}>Change password</SubmitButton>
      <ActionFeedback state={state} />
    </form>
  );
}
