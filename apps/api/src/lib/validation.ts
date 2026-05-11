export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
}

export function normalizeTags(value: unknown): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value === "string") {
    const parsed = JSON.parse(value) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    throw new Error("tags_jsonb must be an object");
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  throw new Error("tags_jsonb must be an object");
}

export function normalizeStake(value: unknown): number[] | null {
  if (value === undefined || value === null || value === "") return null;
  let parsed = value;
  if (typeof value === "string") {
    parsed = JSON.parse(value) as unknown;
  }
  if (!Array.isArray(parsed)) {
    throw new Error("stake_usd must be an array");
  }
  if (parsed.length < 2 || parsed.length > 3) {
    throw new Error("stake_usd must contain 2 or 3 numbers");
  }
  const numbers = parsed.map((entry) => Number(entry));
  if (numbers.some((entry) => !Number.isFinite(entry) || entry < 0)) {
    throw new Error("stake_usd values must be positive numbers");
  }
  return numbers;
}
