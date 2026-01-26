// src/services/tokenProvider.ts
// This module breaks the circular dependency between api.ts and authStore.ts

type TokenGetter = () => string | null;
type LogoutCallback = () => void;

let getToken: TokenGetter = () => null;
let onUnauthorized: LogoutCallback = () => {};

export function setTokenProvider(getter: TokenGetter) {
  getToken = getter;
}

export function setUnauthorizedCallback(callback: LogoutCallback) {
  onUnauthorized = callback;
}

export function getAuthToken(): string | null {
  return getToken();
}

export function handleUnauthorized(): void {
  onUnauthorized();
}
