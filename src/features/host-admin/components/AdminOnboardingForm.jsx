import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminOnboardingSchema } from "../../../validation/hostAdminSchemas";

export function AdminOnboardingForm({
  onSubmit,
  isPending,
  errorMessage,
  onSwitchToLogin
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(adminOnboardingSchema),
    defaultValues: {
      organizationName: "",
      adminPassword: "",
      locations: [{ name: "" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "locations"
  });

  async function submitForm(values) {
    await onSubmit({
      organizationName: values.organizationName,
      adminPassword: values.adminPassword,
      locations: values.locations.map((location) => location.name)
    });
  }

  return (
    <form className="form-stack" onSubmit={handleSubmit(submitForm)} noValidate>
      <div className="panel-section">
        <h3>First-time installation setup</h3>
        <p>
          This form creates the organization settings and the initial location list through
          <code> /api/admin/onboarding </code>.
        </p>
      </div>

      {errorMessage ? (
        <div className="notice notice-danger">
          <strong>Setup failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <label className="field">
        <span className="field-label">Organization name</span>
        <input
          {...register("organizationName")}
          className={`field-input ${errors.organizationName ? "field-input-error" : ""}`}
          type="text"
          autoComplete="organization"
          placeholder="Museum of Memory"
        />
        {errors.organizationName ? (
          <span className="field-error">{errors.organizationName.message}</span>
        ) : null}
      </label>

      <label className="field">
        <span className="field-label">Admin password</span>
        <input
          {...register("adminPassword")}
          className={`field-input ${errors.adminPassword ? "field-input-error" : ""}`}
          type="password"
          autoComplete="new-password"
          placeholder="Create the host admin password"
        />
        {errors.adminPassword ? (
          <span className="field-error">{errors.adminPassword.message}</span>
        ) : null}
      </label>

      <div className="field">
        <div className="field-row">
          <span className="field-label">Initial locations</span>
          <button
            className="button button-ghost button-inline"
            type="button"
            onClick={() => append({ name: "" })}
          >
            Add location
          </button>
        </div>

        <div className="array-stack">
          {fields.map((field, index) => {
            const locationError = errors.locations?.[index]?.name?.message;

            return (
              <div className="array-row" key={field.id}>
                <input
                  {...register(`locations.${index}.name`)}
                  className={`field-input ${locationError ? "field-input-error" : ""}`}
                  type="text"
                  placeholder={index === 0 ? "Main Gallery" : "Storage Room"}
                />
                <button
                  className="button button-secondary button-inline"
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  Remove
                </button>
                {locationError ? <span className="field-error">{locationError}</span> : null}
              </div>
            );
          })}
        </div>

        {errors.locations?.message ? (
          <span className="field-error">{errors.locations.message}</span>
        ) : null}
      </div>

      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Saving setup..." : "Create installation"}
      </button>

      <button className="button button-ghost" type="button" onClick={onSwitchToLogin}>
        Existing installation? Return to sign-in
      </button>
    </form>
  );
}
