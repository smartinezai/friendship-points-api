import { describe, expect, it } from "vitest";
import {
    ImpactDirection as PrismaImpactDirection,
    RuleWeight as PrismaRuleWeight,
} from "../generated/prisma/enums.js";
import { IMPACT_DIRECTIONS, RULE_WEIGHTS } from "../domain/friendship.js";

describe("friendship domain values", () => {
    it("keeps impact directions aligned with the Prisma enum", () => {
        expect([...IMPACT_DIRECTIONS].sort()).toEqual(
            Object.values(PrismaImpactDirection).sort(),
        );
    });

    it("keeps rule weights aligned with the Prisma enum", () => {
        expect([...RULE_WEIGHTS].sort()).toEqual(
            Object.values(PrismaRuleWeight).sort(),
        );
    });
});
