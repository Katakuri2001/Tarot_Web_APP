export interface PageParams {
  page: number;
  limit: number;
  offset: number;
}

export function getPage(url: URL, maxLimit = 100): PageParams {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export function pageMeta(total: number, { page, limit }: PageParams) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthStartIso(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}
