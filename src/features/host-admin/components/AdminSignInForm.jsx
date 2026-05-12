import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminSignInSchema } from "../../../validation/hostAdminSchemas";

export function AdminSignInForm({
  onSubmit,
  isPending,
  errorMessage,
  onSwitchToOnboarding
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminSignInSchema),
    defaultValues: {
      password: ""
    }
  });

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="panel-section">
        <h3>Admin password login</h3>
        <p>
          This uses the host-only admin session cookie exposed by the backend on
          <code> /api/admin/session/login </code>.
        </p>
      </div>

      {errorMessage ? (
        <div className="notice notice-danger">
          <strong>Sign-in failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <label className="field">
        <span className="field-label">Admin password</span>
        <input
          {...register("password")}
          className={`field-input ${errors.password ? "field-input-error" : ""}`}
          type="password"
          autoComplete="current-password"
          placeholder="Enter the host admin password"
        />
        {errors.password ? <span className="field-error">{errors.password.message}</span> : null}
      </label>

      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <button className="button button-ghost" type="button" onClick={onSwitchToOnboarding}>
        New installation? Open first-time setup
      </button>
    </form>
  );
}
