import crypto from "crypto";
import { db } from "@/lib/db";

// Google Drive + Sheets integration implemented with direct REST calls.
// We deliberately avoid the `googleapis` SDK: it pulls in hundreds of generated
// API clients (tens of MB), which bloats the bundle/standalone output and slows
// builds. The handful of endpoints we need are simple HTTPS calls.

export const GOOGLE_DRIVE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

function redirectUri() {
  return `${appUrl()}/api/google-drive/callback`;
}

const GOOGLE_DRIVE_OAUTH_SETTING_KEY = "google_drive_oauth";

interface StoredGoogleDriveOAuth {
  clientId: string;
  encryptedClientSecret: string;
}

export interface GoogleDriveOAuthConfig {
  clientId: string;
  clientSecret: string;
  source: "admin" | "environment";
}

export async function getGoogleDriveOAuthConfig(): Promise<GoogleDriveOAuthConfig | null> {
  const stored = await db.systemSetting.findUnique({
    where: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY },
  });
  if (stored) {
    try {
      const parsed = JSON.parse(stored.value) as StoredGoogleDriveOAuth;
      if (parsed.clientId && parsed.encryptedClientSecret) {
        return {
          clientId: parsed.clientId,
          clientSecret: decryptGoogleToken(parsed.encryptedClientSecret),
          source: "admin",
        };
      }
    } catch {
      // Ignore invalid stored credentials and fall back to environment values.
    }
  }

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      source: "environment",
    };
  }
  return null;
}

export async function saveGoogleDriveOAuthConfig(clientId: string, clientSecret?: string) {
  const current = await getGoogleDriveOAuthConfig();
  const secret = clientSecret || current?.clientSecret;
  if (!secret) throw new Error("Google Client Secret is required.");

  const value = JSON.stringify({
    clientId,
    encryptedClientSecret: encryptGoogleToken(secret),
  } satisfies StoredGoogleDriveOAuth);

  await db.systemSetting.upsert({
    where: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY },
    create: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY, value },
    update: { value },
  });
}

export async function clearGoogleDriveOAuthConfig() {
  await db.systemSetting.deleteMany({ where: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY } });
}

export async function googleDriveConfigured() {
  return Boolean(await getGoogleDriveOAuthConfig());
}

async function requireConfig(): Promise<GoogleDriveOAuthConfig> {
  const config = await getGoogleDriveOAuthConfig();
  if (!config) throw new Error("Google Drive OAuth is not configured.");
  return config;
}

// ---------------------------------------------------------------------------
// Token encryption (AES-256-GCM). Also used by src/lib/secrets.ts. The key is
// derived from a dedicated secret, falling back to SESSION_SECRET — keep these
// stable across environments or previously-stored secrets won't decrypt.
// ---------------------------------------------------------------------------

function encryptionKey() {
  const secret =
    process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "sellercrew-google-drive-dev-key";
  if (process.env.NODE_ENV === "production" && secret.length < 32) {
    throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY must be at least 32 characters.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptGoogleToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptGoogleToken(value: string) {
  const [iv, tag, encrypted] = value.split(".");
  if (!iv || !tag || !encrypted) throw new Error("Stored Google token is invalid.");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, "base64url")), decipher.final()]).toString("utf8");
}

// ---------------------------------------------------------------------------
// OAuth state (signed, short-lived) — CSRF protection for the connect flow.
// ---------------------------------------------------------------------------

function stateSecret() {
  return process.env.SESSION_SECRET || "sellercrew-insecure-dev-secret-change-me";
}

export function createGoogleOAuthState(userId: string) {
  const body = Buffer.from(JSON.stringify({
    uid: userId,
    nonce: crypto.randomBytes(18).toString("base64url"),
    exp: Date.now() + 10 * 60 * 1000,
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyGoogleOAuthState(state: string | null | undefined, userId: string) {
  if (!state) return false;
  const [body, signature] = state.split(".");
  if (!body || !signature) return false;
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { uid: string; exp: number };
    return payload.uid === userId && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// OAuth: build consent URL, exchange code, fetch profile, refresh access token.
// ---------------------------------------------------------------------------

export async function buildGoogleAuthUrl(state: string, loginHint?: string) {
  const config = await requireConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_DRIVE_SCOPES.join(" "),
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${AUTH_URL}?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  scope?: string;
  expires_in?: number;
  token_type?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const config = await requireConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri(),
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error("Google token exchange failed.");
  return (await res.json()) as GoogleTokenResponse;
}

export async function getGoogleUserInfo(accessToken: string): Promise<{ email?: string }> {
  const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return {};
  return (await res.json()) as { email?: string };
}

// Thrown when Google rejects the refresh token (revoked/expired) so callers can
// clean up the stored connection instead of failing every request forever.
const INVALID_REFRESH = "GOOGLE_REFRESH_INVALID";

async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresInMs: number }> {
  const config = await requireConfig();
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    // 400/401 from the token endpoint means the refresh token itself is bad.
    throw new Error(res.status === 400 || res.status === 401 ? INVALID_REFRESH : "Could not refresh the Google access token.");
  }
  const data = (await res.json()) as GoogleTokenResponse;
  if (!data.access_token) throw new Error(INVALID_REFRESH);
  return { accessToken: data.access_token, expiresInMs: (Number(data.expires_in) || 3600) * 1000 };
}

// Short-lived access-token cache (per user). Google tokens last ~1h; caching
// avoids a token round-trip on every Drive/Sheets call (a sync makes many).
const accessTokenCache = new Map<string, { token: string; exp: number }>();

async function getAccessToken(userId: string) {
  const connection = await db.googleDriveConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error("Google Drive is not connected.");

  const cached = accessTokenCache.get(userId);
  if (cached && cached.exp > Date.now() + 60_000) {
    return { accessToken: cached.token, connection };
  }

  try {
    const { accessToken, expiresInMs } = await refreshAccessToken(decryptGoogleToken(connection.encryptedRefreshToken));
    accessTokenCache.set(userId, { token: accessToken, exp: Date.now() + expiresInMs });
    return { accessToken, connection };
  } catch (error) {
    if (error instanceof Error && error.message === INVALID_REFRESH) {
      // Drop the dead connection so the UI reflects "not connected" and stops retrying.
      accessTokenCache.delete(userId);
      await db.googleDriveConnection.delete({ where: { userId } }).catch(() => {});
      throw new Error("Google Drive access was revoked. Please reconnect.");
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Thin REST helper. Throws a compact error; callers genericize before returning.
// ---------------------------------------------------------------------------

async function googleFetch(url: string, accessToken: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...(init.headers || {}) },
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Google API ${res.status}: ${detail.slice(0, 300)}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export interface DriveFile {
  id?: string;
  name?: string;
  webViewLink?: string;
  modifiedTime?: string;
  parents?: string[];
}

async function listAllFiles(accessToken: string, mimeType: string, fields: string): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `mimeType='${mimeType}' and trashed=false`,
      orderBy: "modifiedTime desc",
      pageSize: "100",
      fields: `nextPageToken,files(${fields})`,
    });
    if (pageToken) params.set("pageToken", pageToken);
    const data = await googleFetch(`${DRIVE_FILES_URL}?${params.toString()}`, accessToken);
    files.push(...((data?.files ?? []) as DriveFile[]));
    pageToken = data?.nextPageToken ?? undefined;
  } while (pageToken && files.length < 500);
  return files;
}

export async function listDriveFolders(userId: string): Promise<DriveFile[]> {
  const { accessToken } = await getAccessToken(userId);
  return listAllFiles(accessToken, "application/vnd.google-apps.folder", "id,name,modifiedTime,webViewLink,parents");
}

export async function listSpreadsheets(userId: string): Promise<DriveFile[]> {
  const { accessToken } = await getAccessToken(userId);
  return listAllFiles(
    accessToken,
    "application/vnd.google-apps.spreadsheet",
    "id,name,modifiedTime,webViewLink,owners(displayName,emailAddress)"
  );
}

async function findFolder(accessToken: string, name: string, parentId?: string | null): Promise<DriveFile | null> {
  const escapedName = name.replace(/'/g, "\\'");
  const parentQuery = parentId ? ` and '${parentId}' in parents` : "";
  const params = new URLSearchParams({
    q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentQuery}`,
    fields: "files(id,name,webViewLink)",
    pageSize: "10",
  });
  const data = await googleFetch(`${DRIVE_FILES_URL}?${params.toString()}`, accessToken);
  return (data?.files?.[0] as DriveFile) ?? null;
}

async function ensureFolder(accessToken: string, name: string, parentId?: string | null): Promise<DriveFile> {
  const existing = await findFolder(accessToken, name, parentId);
  if (existing?.id) return existing;
  const params = new URLSearchParams({ fields: "id,name,webViewLink" });
  const created = (await googleFetch(`${DRIVE_FILES_URL}?${params.toString()}`, accessToken, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  })) as DriveFile;
  if (!created?.id) throw new Error(`Could not create the ${name} folder.`);
  return created;
}

async function ensureSpreadsheet(accessToken: string, title: string, existingId?: string | null): Promise<string> {
  if (existingId) return existingId;
  const escapedTitle = title.replace(/'/g, "\\'");
  const params = new URLSearchParams({
    q: `name='${escapedTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id,name)",
    pageSize: "10",
  });
  const existing = await googleFetch(`${DRIVE_FILES_URL}?${params.toString()}`, accessToken);
  if (existing?.files?.[0]?.id) return existing.files[0].id as string;
  const created = await googleFetch(`${SHEETS_URL}?fields=spreadsheetId,spreadsheetUrl`, accessToken, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ properties: { title } }),
  });
  if (!created?.spreadsheetId) throw new Error("Could not create the Google Sheet.");
  return created.spreadsheetId as string;
}

async function ensureSheetHeader(accessToken: string, spreadsheetId: string) {
  const header = [
    "Synced at", "Workspace", "Product", "Brand", "Marketplace", "Category", "Status",
    "Title", "Bullet points", "Description", "Keywords", "Compliance score", "Images folder",
  ];
  const current = await googleFetch(`${SHEETS_URL}/${spreadsheetId}/values/A1:M1`, accessToken);
  if (current?.values?.length) return;
  await googleFetch(`${SHEETS_URL}/${spreadsheetId}/values/A1:M1?valueInputOption=RAW`, accessToken, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ values: [header] }),
  });
}

function dataUrlParts(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("An image could not be prepared for Google Drive.");
  return { mimeType: match[1], bytes: Buffer.from(match[2], "base64") };
}

export interface UploadedImageLink {
  name: string;
  fileId: string;
  webViewLink: string;
}

async function uploadImage(
  accessToken: string,
  folderId: string,
  image: { name: string; dataUrl: string }
): Promise<UploadedImageLink> {
  const { mimeType, bytes } = dataUrlParts(image.dataUrl);
  const boundary = `scrw${crypto.randomBytes(12).toString("hex")}`;
  const metadata = JSON.stringify({ name: image.name, parents: [folderId] });
  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n` +
      `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    "utf8"
  );
  const epilogue = Buffer.from(`\r\n--${boundary}--\r\n`, "utf8");
  const body = Buffer.concat([preamble, bytes, epilogue]);

  const params = new URLSearchParams({ uploadType: "multipart", fields: "id,name,webViewLink" });
  const created = (await googleFetch(`${DRIVE_UPLOAD_URL}?${params.toString()}`, accessToken, {
    method: "POST",
    headers: { "content-type": `multipart/related; boundary=${boundary}` },
    body,
  })) as DriveFile;

  const fileId = created?.id ?? "";
  return {
    name: created?.name ?? image.name,
    fileId,
    webViewLink: created?.webViewLink ?? (fileId ? `https://drive.google.com/file/d/${fileId}/view` : ""),
  };
}

export interface GoogleProductSyncPayload {
  workspaceId: string;
  projectId: string;
  workspaceName: string;
  productName: string;
  brandName: string;
  marketplace: string;
  category: string;
  status: string;
  title: string;
  bullets: string[];
  description: string;
  keywords: string[];
  complianceScore: number;
  customerImages: { name: string; dataUrl: string }[];
  generatedImages: { name: string; dataUrl: string }[];
}

export async function syncProductToGoogle(userId: string, payload: GoogleProductSyncPayload) {
  const { accessToken } = await getAccessToken(userId);
  const settings = await db.googleDriveSettings.upsert({
    where: { organizationId: payload.workspaceId },
    create: { organizationId: payload.workspaceId },
    update: {},
  });
  if (!settings.autoSync) return { skipped: true };

  const root = settings.selectedFolderId
    ? { id: settings.selectedFolderId }
    : settings.rootFolderId
    ? { id: settings.rootFolderId }
    : await ensureFolder(accessToken, "SellerCrew");
  if (!root.id) throw new Error("Google Drive root folder is unavailable.");

  let productParentId = root.id;
  let workspaceFolderId = settings.workspaceFolderId;
  if (settings.imageFolderMode === "workspace") {
    const workspaceFolder = workspaceFolderId
      ? { id: workspaceFolderId }
      : await ensureFolder(accessToken, payload.workspaceName, root.id);
    workspaceFolderId = workspaceFolder.id ?? null;
    if (!workspaceFolderId) throw new Error("Workspace folder is unavailable.");
    productParentId = workspaceFolderId;
  }

  const productsFolder = await ensureFolder(accessToken, "Products", productParentId);
  const productFolder = await ensureFolder(accessToken, payload.productName, productsFolder.id);
  if (!productFolder.id) throw new Error("Product folder is unavailable.");
  const customerFolder = await ensureFolder(accessToken, "Customer uploads", productFolder.id);
  const generatedFolder = await ensureFolder(accessToken, "SellerCrew generated", productFolder.id);
  if (!customerFolder.id || !generatedFolder.id) throw new Error("Product image folders are unavailable.");

  // Upload resiliently: one bad/transient image must not fail the whole sync or
  // leave the run half-synced. Collect what succeeded; report the rest.
  const uploadAll = async (folderId: string, images: { name: string; dataUrl: string }[]) => {
    const settled = await Promise.allSettled(images.map((image) => uploadImage(accessToken, folderId, image)));
    const ok = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
    return { ok, failed: settled.length - ok.length };
  };
  const [customer, generated] = await Promise.all([
    uploadAll(customerFolder.id!, payload.customerImages),
    uploadAll(generatedFolder.id!, payload.generatedImages),
  ]);
  const customerUploads = customer.ok;
  const generatedUploads = generated.ok;
  const failedUploads = customer.failed + generated.failed;

  const sheetId = await ensureSpreadsheet(
    accessToken,
    settings.sheetMode === "workspace"
      ? `${payload.workspaceName} - SellerCrew Products`
      : "SellerCrew Products",
    settings.selectedSpreadsheetId || settings.workspaceSheetId
  );
  await ensureSheetHeader(accessToken, sheetId);
  await googleFetch(
    `${SHEETS_URL}/${sheetId}/values/A:M:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    accessToken,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        values: [[
          new Date().toISOString(),
          payload.workspaceName,
          payload.productName,
          payload.brandName,
          payload.marketplace,
          payload.category,
          payload.status,
          payload.title,
          payload.bullets.join("\n"),
          payload.description,
          payload.keywords.join(", "),
          payload.complianceScore,
          `https://drive.google.com/drive/folders/${productFolder.id}`,
        ]],
      }),
    }
  );

  await db.googleDriveSettings.update({
    where: { organizationId: payload.workspaceId },
    data: {
      rootFolderId: settings.selectedFolderId ? settings.rootFolderId : root.id,
      workspaceFolderId,
      workspaceSheetId: settings.sheetMode === "workspace" ? sheetId : settings.workspaceSheetId,
    },
  });

  return {
    skipped: false,
    spreadsheetId: sheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
    productFolderUrl: `https://drive.google.com/drive/folders/${productFolder.id}`,
    customerImages: customerUploads,
    generatedImages: generatedUploads,
    failedUploads,
  };
}
