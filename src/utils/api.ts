import { useEffect, useState } from 'react';

const TOKEN_KEY = 'aether_access_token';
export const BUDGET_EVENT = 'aether:budget-refresh';

function readToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

function writeToken(token: string) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable: token lives only for this call */
  }
}

/**
 * fetch() wrapper for our /api routes:
 *  - sends the access token (x-access-token) when one is stored
 *  - on 401 asks the user for the token once and retries
 *  - tells the budget badge to refresh after generation calls
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string) => {
    const headers = new Headers(init.headers || {});
    if (token) headers.set('x-access-token', token);
    return fetch(path, { ...init, headers });
  };

  let res = await send(readToken());

  if (res.status === 401 && typeof window !== 'undefined') {
    const entered = window.prompt('رمز الوصول مطلوب / Access token required:');
    if (entered) {
      writeToken(entered.trim());
      res = await send(entered.trim());
      if (res.status === 401) writeToken('');
    }
  }

  if (path.startsWith('/api/generate-') && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(BUDGET_EVENT));
  }
  return res;
}

export interface BudgetStatus {
  perIpLimit: number;
  perIpUsed: number;
  globalLimit: number;
  globalUsed: number;
}

/** Remaining units for this user today (min of personal and global budget), or null if unknown. */
export function useRemainingBudget(): number | null {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch('/api/config');
        if (!res.ok) return;
        const data = await res.json();
        const b: BudgetStatus | undefined = data.budget;
        if (alive && b) {
          setRemaining(Math.max(0, Math.min(b.perIpLimit - b.perIpUsed, b.globalLimit - b.globalUsed)));
        }
      } catch {
        /* offline: leave unknown */
      }
    };
    load();
    window.addEventListener(BUDGET_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(BUDGET_EVENT, load);
    };
  }, []);

  return remaining;
}
