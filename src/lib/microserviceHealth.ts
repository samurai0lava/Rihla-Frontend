import { API_BASE_URL, PROFILES_BASE_URL } from './api';

export type MicroserviceId =
  | 'auth'
  | 'profiles'
  | 'ai-places'
  | 'review-places'
  | 'fav-places'
  | 'planner'
  | 'friends';

export interface MicroserviceTarget {
  id: MicroserviceId;
  label: string;
  baseUrl: string;
}

export function getMicroserviceTargets(): MicroserviceTarget[] {
  return [
    { id: 'auth', label: 'auth-service', baseUrl: API_BASE_URL },
    { id: 'profiles', label: 'profiles-service', baseUrl: PROFILES_BASE_URL },
    {
      id: 'ai-places',
      label: 'ai-places-service',
      baseUrl:
        (import.meta.env.VITE_AI_PLACES_URL as string) || 'https://localhost',
    },
    {
      id: 'review-places',
      label: 'review-places',
      baseUrl:
        (import.meta.env.VITE_REVIEW_PLACES_URL as string) ||
        'https://localhost',
    },
    {
      id: 'fav-places',
      label: 'fav-places',
      baseUrl:
        (import.meta.env.VITE_FAV_PLACES_URL as string) ||
        'https://localhost',
    },
    {
      id: 'planner',
      label: 'planner-service',
      baseUrl:
        (import.meta.env.VITE_PLANNER_URL as string) || 'https://localhost',
    },
    {
      id: 'friends',
      label: 'friends-service',
      baseUrl:
        (import.meta.env.VITE_FRIENDS_URL as string) || 'https://localhost',
    },
  ];
}

export type HealthStatus = 'pending' | 'ok' | 'error';

export interface HealthCheckResult {
  id: MicroserviceId;
  label: string;
  url: string;
  status: HealthStatus;
  httpStatus?: number;
  latencyMs?: number;
  bodySnippet?: string;
  error?: string;
}

const HEALTH_PATH = '/health';
const TIMEOUT_MS = 12_000;

export async function checkOne(
  target: MicroserviceTarget,
): Promise<HealthCheckResult> {
  const url = `${target.baseUrl.replace(/\/$/, '')}${HEALTH_PATH}`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'include',
    });
    clearTimeout(tid);
    const latencyMs = Math.round(performance.now() - t0);
    const text = await res.text();
    let bodySnippet = text.slice(0, 480);
    if (text.length > 480) bodySnippet += '…';
    const ok = res.ok;
    return {
      id: target.id,
      label: target.label,
      url,
      status: ok ? 'ok' : 'error',
      httpStatus: res.status,
      latencyMs,
      bodySnippet: bodySnippet || undefined,
      error: ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (e) {
    clearTimeout(tid);
    const latencyMs = Math.round(performance.now() - t0);
    const err = e instanceof Error ? e.message : String(e);
    return {
      id: target.id,
      label: target.label,
      url,
      status: 'error',
      latencyMs,
      error: err,
    };
  }
}

export async function checkAllMicroservices(): Promise<HealthCheckResult[]> {
  const targets = getMicroserviceTargets();
  return Promise.all(targets.map(checkOne));
}
