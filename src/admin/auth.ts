const CREDENTIALS_KEY = 'dinsburgh-admin-credentials';
const SESSION_KEY = 'dinsburgh-admin-session';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 8;
const HASH_ITERATIONS = 120000;
const SALT_LENGTH = 16;

type AdminCredentials = {
  salt: string;
  hash: string;
  iterations: number;
};

type AdminSession = {
  token: string;
  expiresAt: number;
};

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
};

const deriveHash = async (
  password: string,
  salt: ArrayBuffer,
  iterations: number
) => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    256
  );

  return toBase64(derivedBits);
};

const generateSalt = () => {
  const salt = new Uint8Array(SALT_LENGTH);
  window.crypto.getRandomValues(salt);
  return salt.buffer;
};

const generateSessionToken = () => {
  const token = new Uint8Array(16);
  window.crypto.getRandomValues(token);
  return toBase64(token.buffer);
};

const readCredentials = (): AdminCredentials | null => {
  const raw = window.localStorage.getItem(CREDENTIALS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminCredentials;
  } catch {
    return null;
  }
};

const writeCredentials = (credentials: AdminCredentials) => {
  window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
};

const readSession = (): AdminSession | null => {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
};

const writeSession = (session: AdminSession) => {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
};

const clearSession = () => {
  window.sessionStorage.removeItem(SESSION_KEY);
};

export const isSetupRequired = () => !readCredentials();

export const isSessionValid = () => {
  const session = readSession();
  if (!session) return false;
  if (Date.now() > session.expiresAt) {
    clearSession();
    return false;
  }
  return true;
};

export const createCredentials = async (password: string) => {
  const salt = generateSalt();
  const hash = await deriveHash(password, salt, HASH_ITERATIONS);
  const credentials: AdminCredentials = {
    salt: toBase64(salt),
    hash,
    iterations: HASH_ITERATIONS,
  };
  writeCredentials(credentials);
};

export const verifyPassword = async (password: string) => {
  const credentials = readCredentials();
  if (!credentials) return false;
  const salt = fromBase64(credentials.salt);
  const hash = await deriveHash(password, salt, credentials.iterations);
  return hash === credentials.hash;
};

export const createSession = () => {
  const session: AdminSession = {
    token: generateSessionToken(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  };
  writeSession(session);
};

export const logout = () => {
  clearSession();
};
