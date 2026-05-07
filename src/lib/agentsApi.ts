import { supabase } from "@/integrations/supabase/client";

const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!RAW_BASE_URL) {
  console.warn(
    "[agentsApi] VITE_API_BASE_URL is not set; defaulting to http://localhost:8000. " +
      "Add VITE_API_BASE_URL to your .env / Vercel env to point at the deployed agents service.",
  );
}

export const AGENTS_BASE_URL: string = (RAW_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

async function getAuthHeader(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(`Supabase session error: ${error.message}`);
  const token = data.session?.access_token;
  if (!token) {
    throw new Error("Not signed in: no Supabase session token available.");
  }
  return `Bearer ${token}`;
}

export interface AgentsRequestOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function agentsFetch(
  path: string,
  init: RequestInit = {},
  options: AgentsRequestOptions = {},
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${AGENTS_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const authHeader = await getAuthHeader();
  const headers = new Headers(init.headers);
  headers.set("Authorization", authHeader);
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.timeoutMs && options.timeoutMs > 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    if (options.signal) {
      if (options.signal.aborted) controller.abort();
      else options.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
    try {
      return await fetch(url, { ...init, headers, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  return fetch(url, { ...init, headers, signal: options.signal });
}

export async function agentsPostJson<T = unknown>(
  path: string,
  payload: unknown,
  options: AgentsRequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await agentsFetch(
      path,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      options,
    );
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        options.timeoutMs
          ? `Request timed out after ${Math.round(options.timeoutMs / 1000)}s`
          : "Request was aborted",
      );
    }
    throw err;
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agents API ${response.status}: ${text || response.statusText}`);
  }
  return (await response.json()) as T;
}

export async function agentsGetJson<T = unknown>(
  path: string,
  options: AgentsRequestOptions = {},
): Promise<T> {
  let response: Response;
  try {
    response = await agentsFetch(path, { method: "GET" }, options);
  } catch (err: any) {
    if (err?.name === "AbortError") {
      throw new Error(
        options.timeoutMs
          ? `Request timed out after ${Math.round(options.timeoutMs / 1000)}s`
          : "Request was aborted",
      );
    }
    throw err;
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Agents API ${response.status}: ${text || response.statusText}`);
  }
  return (await response.json()) as T;
}
