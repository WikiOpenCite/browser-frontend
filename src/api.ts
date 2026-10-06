import type { ApiErrorDetail, CitationsResponse } from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly details: ApiErrorDetail[];

  constructor(message: string, status: number, details: ApiErrorDetail[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface ErrorBody {
  error?: string;
  details?: ApiErrorDetail[];
}

/**
 * URL that downloads *every* citation matching `filter` as CSV (not just one page).
 * Used as a plain link so the browser streams the file straight to disk.
 */
export function csvUrl(filter: string): string {
  return `/api/citations/export?${new URLSearchParams({ filter })}`;
}

export async function fetchCitations(
  filter: string,
  limit: number,
  offset: number,
  signal?: AbortSignal,
): Promise<CitationsResponse> {
  const params = new URLSearchParams({ filter, limit: String(limit), offset: String(offset) });

  let response: Response;
  try {
    response = await fetch(`/api/citations?${params}`, { signal });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError("Could not reach the server. Is the API running?", 0);
  }

  if (!response.ok) {
    let body: ErrorBody | null = null;
    try {
      body = (await response.json()) as ErrorBody;
    } catch {
      // Non-JSON error page (e.g. a 500 from the server); fall through to the generic message.
    }
    throw new ApiError(
      body?.error ?? `Request failed (HTTP ${response.status})`,
      response.status,
      body?.details ?? [],
    );
  }
  return (await response.json()) as CitationsResponse;
}
