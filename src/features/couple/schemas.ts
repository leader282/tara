import { z } from "zod";

export const activeCoupleUserIdSchema = z.string().uuid("A valid user id is required.");
export const activeCoupleIdSchema = z.string().uuid("A valid couple id is required.");

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseDateOnly(value: string): Date | null {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return null;
  }

  const [yearString, monthString, dayString] = value.split("-");
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);

  const parsedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
}

function isTodayOrFuture(value: string): boolean {
  const parsedDate = parseDateOnly(value);
  if (!parsedDate) {
    return false;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  return parsedDate.getTime() >= startOfToday.getTime();
}

const meetupDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine((value) => value === undefined || DATE_ONLY_PATTERN.test(value), {
    message: "Meetup date must use YYYY-MM-DD format.",
  })
  .refine((value) => value === undefined || parseDateOnly(value) !== null, {
    message: "Meetup date must be a valid calendar date.",
  })
  .refine((value) => value === undefined || isTodayOrFuture(value), {
    message: "Meetup date should be today or in the future.",
  });

const meetupTimeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))
  .refine((value) => value === undefined || HH_MM_PATTERN.test(value), {
    message: "Meetup time must use HH:mm format.",
  });

const meetupLocationSchema = z
  .string()
  .trim()
  .max(160, "Meetup location must be 160 characters or fewer.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

const nullableMeetupIsoSchema = z
  .string()
  .trim()
  .nullable()
  .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), {
    message: "Meetup time must be a valid ISO datetime string.",
  });

const nullableMeetupLocationSchema = z
  .string()
  .trim()
  .max(160, "Meetup location must be 160 characters or fewer.")
  .nullable()
  .transform((value) => (value && value.length > 0 ? value : null));

export const editMeetupSchema = z
  .object({
    clearMeetup: z.boolean().optional().default(false),
    meetupDate: meetupDateSchema,
    meetupTime: meetupTimeSchema,
    meetupLocation: meetupLocationSchema,
  })
  .superRefine((value, context) => {
    if (value.clearMeetup) {
      return;
    }

    if (!value.meetupDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meetupDate"],
        message: "Choose a meetup date or clear the current meetup.",
      });
    }
  });

export const updateNextMeetupSchema = z.object({
  coupleId: activeCoupleIdSchema,
  nextMeetupAt: nullableMeetupIsoSchema,
  nextMeetupLocation: nullableMeetupLocationSchema,
});
