import { describe, expect, it } from "vitest";
import {
    DEFAULT_DEV_USER_ID,
    getCurrentUserId,
} from "../services/currentUser.service.js";

describe("current user service", () => {
    it("returns the seeded development user when no header is present", () => {
        const userId = getCurrentUserId({ headers: {} });

        expect(userId).toBe(DEFAULT_DEV_USER_ID);
    });

    it("returns the x-user-id header when it is a valid UUID", () => {
        const userId = getCurrentUserId({
            headers: {
                "x-user-id": "11111111-1111-4111-8111-111111111111",
            },
        });

        expect(userId).toBe("11111111-1111-4111-8111-111111111111");
    });

    it("rejects an invalid x-user-id header", () => {
        expect(() =>
            getCurrentUserId({
                headers: {
                    "x-user-id": "not-a-user-id",
                },
            }),
        ).toThrow("x-user-id header must be a valid UUID.");
    });
});
