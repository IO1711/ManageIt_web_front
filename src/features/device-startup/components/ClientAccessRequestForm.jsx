import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientAccessRequestSchema } from "../../../validation/clientDeviceSchemas";

export function ClientAccessRequestForm({
  browserMetadata,
  onSubmit,
  isPending,
  errorMessage
}) {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientAccessRequestSchema),
    defaultValues: {
      suggestedName: browserMetadata.suggestedName
    }
  });

  return (
    <form className="form-stack" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="panel-section">
        <h3>Request browser access</h3>
        <p>
          This browser sends its detected platform metadata to
          <code> /api/web/access-requests </code>
          and waits for a host-admin approval on <code>localhost</code>.
        </p>
      </div>

      {errorMessage ? (
        <div className="notice notice-danger">
          <strong>Access request failed</strong>
          <p>{errorMessage}</p>
        </div>
      ) : null}

      <label className="field">
        <span className="field-label">Suggested device name</span>
        <input
          {...register("suggestedName")}
          className={`field-input ${errors.suggestedName ? "field-input-error" : ""}`}
          type="text"
          autoComplete="off"
          placeholder="Front Desk Chrome"
        />
        {errors.suggestedName ? (
          <span className="field-error">{errors.suggestedName.message}</span>
        ) : null}
      </label>

      <div className="field">
        <span className="field-label">Detected browser details</span>
        <div className="detail-grid">
          <article className="detail-card">
            <span className="detail-label">Platform</span>
            <strong>{browserMetadata.platformName}</strong>
            <p>{browserMetadata.platformVersion}</p>
          </article>

          <article className="detail-card">
            <span className="detail-label">Browser</span>
            <strong>{browserMetadata.browserName}</strong>
            <p>{browserMetadata.browserVersion}</p>
          </article>
        </div>
      </div>

      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Sending request..." : "Request access"}
      </button>
    </form>
  );
}
