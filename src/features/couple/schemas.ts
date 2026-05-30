import { z } from "zod";

export const activeCoupleUserIdSchema = z.string().uuid("A valid user id is required.");
export const activeCoupleIdSchema = z.string().uuid("A valid couple id is required.");
