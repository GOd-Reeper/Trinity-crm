// 24-Live Encrypted Session Management
// Key: '24-live' | Encrypted with Base64 & XOR Cipher

import { Profile, UserRole } from './types';

export const SESSION_COOKIE_NAME = '24-live';
const SECRET_KEY = 'TRINITY_24H_SECURE_AUTH_KEY_2026_@!';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface SessionPayload {
  user: Profile;
  role: UserRole;
  createdAt: number;
  expiresAt: number;
}

/**
 * Encrypts session payload into a URL-safe Base64 string
 */
export function encryptSession(payload: SessionPayload): string {
  try {
    const jsonStr = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(jsonStr);
    const keyBytes = encoder.encode(SECRET_KEY);
    const encrypted = new Uint8Array(utf8Bytes.length);

    for (let i = 0; i < utf8Bytes.length; i++) {
      encrypted[i] = utf8Bytes[i] ^ keyBytes[i % keyBytes.length];
    }

    let binary = '';
    for (let i = 0; i < encrypted.length; i++) {
      binary += String.fromCharCode(encrypted[i]);
    }

    return btoa(binary);
  } catch (err) {
    console.error('Failed to encrypt session payload:', err);
    return '';
  }
}

/**
 * Decrypts a Base64-encoded encrypted session string
 */
export function decryptSession(base64Str: string): SessionPayload | null {
  try {
    if (!base64Str) return null;
    const binary = atob(base64Str);
    const encrypted = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      encrypted[i] = binary.charCodeAt(i);
    }

    const encoder = new TextEncoder();
    const keyBytes = encoder.encode(SECRET_KEY);
    const decrypted = new Uint8Array(encrypted.length);

    for (let i = 0; i < encrypted.length; i++) {
      decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
    }

    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(decrypted);
    return JSON.parse(jsonStr) as SessionPayload;
  } catch (err) {
    console.warn('Failed to decrypt session token:', err);
    return null;
  }
}

/**
 * Stores the encrypted session in both cookie '24-live' (24 hour max-age) and localStorage
 */
export function setLiveSession(user: Profile, role: UserRole): SessionPayload {
  const now = Date.now();
  const payload: SessionPayload = {
    user,
    role,
    createdAt: now,
    expiresAt: now + TWENTY_FOUR_HOURS_MS,
  };

  const encrypted = encryptSession(payload);

  if (typeof document !== 'undefined') {
    // 24 hour cookie (86400 seconds)
    document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(encrypted)}; path=/; max-age=86400; SameSite=Lax`;
    localStorage.setItem(SESSION_COOKIE_NAME, encrypted);
    localStorage.setItem('trinity_user', JSON.stringify(user));
  }

  return payload;
}

/**
 * Retrieves and validates the 24-hour live session
 */
export function getLiveSession(): SessionPayload | null {
  if (typeof window === 'undefined') return null;

  let encrypted = '';

  // 1. Check document.cookie for '24-live'
  if (typeof document !== 'undefined' && document.cookie) {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const parts = c.trim().split('=');
      if (parts[0] === SESSION_COOKIE_NAME && parts[1]) {
        encrypted = decodeURIComponent(parts[1]);
        break;
      }
    }
  }

  // 2. Fallback to localStorage '24-live'
  if (!encrypted) {
    encrypted = localStorage.getItem(SESSION_COOKIE_NAME) || '';
  }

  if (!encrypted) return null;

  const session = decryptSession(encrypted);
  if (!session || !session.expiresAt) {
    clearLiveSession();
    return null;
  }

  // Check 24-hour expiration
  if (Date.now() > session.expiresAt) {
    clearLiveSession();
    return null;
  }

  return session;
}

/**
 * Clears the '24-live' cookie and localStorage session
 */
export function clearLiveSession(): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    localStorage.removeItem(SESSION_COOKIE_NAME);
    localStorage.removeItem('trinity_user');
  }
}
