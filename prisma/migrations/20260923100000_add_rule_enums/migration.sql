CREATE TYPE "ImpactDirection" AS ENUM (
    'positive',
    'negative',
    'neutral',
    'mixed'
);

CREATE TYPE "RuleWeight" AS ENUM (
    'minimal',
    'low',
    'medium',
    'high',
    'critical',
    'extreme'
);

ALTER TABLE "Rule"
ALTER COLUMN "impactDirection" TYPE "ImpactDirection"
USING ("impactDirection"::"ImpactDirection");

ALTER TABLE "Rule"
ALTER COLUMN "weight" TYPE "RuleWeight"
USING ("weight"::"RuleWeight");
