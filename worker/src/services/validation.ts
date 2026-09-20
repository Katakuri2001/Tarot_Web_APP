export interface ValidationResult<T> {
  value: T;
  errors: Record<string, string>;
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

export function requireString(value: unknown, min = 1, max = 10000): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) return null;
  return trimmed;
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const ARCANA = ["major", "wands", "cups", "swords", "pentacles"] as const;
const READING_TYPES = ["daily", "love", "career", "general"] as const;
const ORIENTATIONS = ["upright", "reversed"] as const;

export interface CardInput {
  name: string;
  slug: string;
  arcana: typeof ARCANA[number];
  suit: string;
  number: number;
  keywords: string[];
  symbolism: string;
  uprightMeaning: string;
  reversedMeaning: string;
  loveUpright: string;
  loveReversed: string;
  careerUpright: string;
  careerReversed: string;
  generalUpright: string;
  generalReversed: string;
  advice: string;
  isActive: boolean;
}

export function validateCard(body: any): { value?: CardInput; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const value: any = {};

  const name = requireString(body?.name, 1, 120);
  if (!name) errors.name = "Name is required (1-120 characters).";
  else value.name = name;

  let slug = requireString(body?.slug, 1, 160);
  if (!slug) {
    if (name) slug = slugify(name);
  }
  if (!slug || !isValidSlug(slug)) errors.slug = "Slug must be lowercase letters, numbers and hyphens.";
  else value.slug = slug;

  if (!ARCANA.includes(body?.arcana)) errors.arcana = "Arcana must be major, wands, cups, swords or pentacles.";
  else value.arcana = body.arcana;

  value.suit = typeof body?.suit === "string" ? body.suit.trim().slice(0, 60) : "";

  const number = Number(body?.number);
  if (!Number.isInteger(number) || number < 0 || number > 99) errors.number = "Number must be between 0 and 99.";
  else value.number = number;

  const interpretationFields: Array<[string, string]> = [
    ["symbolism", "Symbolism"], ["uprightMeaning", "Upright meaning"], ["reversedMeaning", "Reversed meaning"],
    ["loveUpright", "Love upright"], ["loveReversed", "Love reversed"],
    ["careerUpright", "Career upright"], ["careerReversed", "Career reversed"],
    ["generalUpright", "General upright"], ["generalReversed", "General reversed"],
    ["advice", "Advice"],
  ];
  for (const [field, label] of interpretationFields) {
    const v = requireString(body?.[field], 1, 4000);
    if (!v) errors[field] = `${label} is required (max 4000 characters).`;
    else value[field] = v;
  }

  if (body?.keywords !== undefined) {
    if (!Array.isArray(body.keywords) || body.keywords.some((k: unknown) => typeof k !== "string" || k.length > 60)) {
      errors.keywords = "Keywords must be an array of short strings.";
    } else {
      value.keywords = body.keywords.map((k: string) => k.trim()).filter(Boolean).slice(0, 12);
    }
  } else {
    value.keywords = [];
  }

  if (body?.isActive !== undefined) {
    value.isActive = body.isActive === true || body.isActive === 1;
  } else {
    value.isActive = true;
  }

  return { value: errors && Object.keys(errors).length ? undefined : value, errors };
}

export function parseIntParam(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

export { ARCANA, READING_TYPES, ORIENTATIONS };
