import type { FastifyRequest } from "fastify";
import { z } from "zod";

export const DEFAULT_DEV_USER_ID =
    "00000000-0000-4000-8000-000000000001";

const currentUserIdSchema = z.string().uuid();

/**
 * Reads the mocked current user from request headers.
 *
 * Day 35 keeps authentication deliberately simple: callers may provide
 * `x-user-id`, otherwise local development uses a seeded default user.
 */
export function getCurrentUserId(
    request: Pick<FastifyRequest, "headers">,
): string {
    const headerValue = request.headers["x-user-id"];

    if (headerValue === undefined) {
        return DEFAULT_DEV_USER_ID;
    }

    const userId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const result = currentUserIdSchema.safeParse(userId);

    if (!result.success) {
        throw new Error("x-user-id header must be a valid UUID.");
    }

    return result.data;
}
