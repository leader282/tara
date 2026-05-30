import { z } from "zod";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INVITE_CODE_PATTERN = /^[A-Za-z0-9_-]+$/;

function isValidDateOnly(value: string): boolean {
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime())) {
    return false;
  }

  return parsedDate.toISOString().slice(0, 10) === value;
}

export const inviteCoupleIdSchema = z.string().uuid("A valid couple id is required.");

export const createCoupleSchema = z.object({
  anniversaryDate: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || DATE_ONLY_PATTERN.test(value),
      "Anniversary must use YYYY-MM-DD format."
    )
    .refine(
      (value) => value === undefined || isValidDateOnly(value),
      "Anniversary must be a valid calendar date."
    ),
});

export const acceptInviteSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(1, "Invite code is required.")
    .transform((value) => value.replace(/\s+/g, ""))
    .refine((value) => value.length >= 16, "Invite code looks too short.")
    .refine((value) => !/\s/.test(value), "Invite code cannot contain spaces.")
    .refine((value) => INVITE_CODE_PATTERN.test(value), "Invite code format looks incorrect."),
});

export const createCoupleWithInviteResultSchema = z.object({
  couple_id: z.string().uuid(),
  invite_id: z.string().uuid(),
  invite_code: z.string().min(1),
  expires_at: z.string().min(1),
});

export const acceptCoupleInviteResultSchema = z.object({
  couple_id: z.string().uuid(),
});

export const activeInviteSchema = z.object({
  id: z.string().uuid(),
  couple_id: z.string().uuid(),
  invite_code: z.string().min(1),
  status: z.string().min(1),
  expires_at: z.string().min(1),
  created_at: z.string().min(1),
});

export type CreateCoupleInputSchema = z.infer<typeof createCoupleSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
