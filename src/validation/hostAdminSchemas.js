import { z } from "zod";

const trimmedRequiredString = (label) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(255, `${label} must be 255 characters or fewer`);

export const adminSignInSchema = z.object({
  password: trimmedRequiredString("Password")
});

export const adminOnboardingSchema = z.object({
  organizationName: trimmedRequiredString("Organization name"),
  adminPassword: trimmedRequiredString("Admin password"),
  locations: z
    .array(
      z.object({
        name: trimmedRequiredString("Location name")
      })
    )
    .min(1, "Add at least one location")
    .superRefine((locations, context) => {
      const seen = new Map();

      locations.forEach((location, index) => {
        const key = location.name.trim().toLowerCase();

        if (!key) {
          return;
        }

        if (seen.has(key)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Location names must be unique",
            path: [index, "name"]
          });
          return;
        }

        seen.set(key, index);
      });
    })
});

export const adminWebAccessApprovalSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR"]),
  friendlyName: z
    .string()
    .trim()
    .max(255, "Friendly name must be 255 characters or fewer")
});

export const adminMobilePairingCreateSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR"])
});

export const adminMobilePairingFinalizeSchema = z.object({
  friendlyName: trimmedRequiredString("Friendly name")
});

export const adminDeviceRoleUpdateSchema = z.object({
  role: z.enum(["ADMIN", "EDITOR"])
});
