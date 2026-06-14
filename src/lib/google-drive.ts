import crypto from "crypto";
import { google, type drive_v3, type sheets_v4 } from "googleapis";
import { db } from "@/lib/db";

export const GOOGLE_DRIVE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.metadata.readonly",
  "https://www.googleapis.com/auth/spreadsheets",
];

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
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

  await db.systemSetting.upsert({
    where: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY },
    create: {
      key: GOOGLE_DRIVE_OAUTH_SETTING_KEY,
      value: JSON.stringify({
        clientId,
        encryptedClientSecret: encryptGoogleToken(secret),
      } satisfies StoredGoogleDriveOAuth),
    },
    update: {
      value: JSON.stringify({
        clientId,
        encryptedClientSecret: encryptGoogleToken(secret),
      } satisfies StoredGoogleDriveOAuth),
    },
  });
}

export async function clearGoogleDriveOAuthConfig() {
  await db.systemSetting.deleteMany({ where: { key: GOOGLE_DRIVE_OAUTH_SETTING_KEY } });
}

export async function googleDriveConfigured() {
  return Boolean(await getGoogleDriveOAuthConfig());
}

export async function createGoogleOAuthClient() {
  const config = await getGoogleDriveOAuthConfig();
  if (!config) throw new Error("Google Drive OAuth is not configured.");
  return new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    `${appUrl()}/api/google-drive/callback`
  );
}

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

export async function getGoogleServices(userId: string) {
  const connection = await db.googleDriveConnection.findUnique({ where: { userId } });
  if (!connection) throw new Error("Google Drive is not connected.");
  const auth = await createGoogleOAuthClient();
  auth.setCredentials({ refresh_token: decryptGoogleToken(connection.encryptedRefreshToken) });
  return {
    connection,
    drive: google.drive({ version: "v3", auth }),
    sheets: google.sheets({ version: "v4", auth }),
  };
}

async function findFolder(drive: drive_v3.Drive, name: string, parentId?: string | null) {
  const escapedName = name.replace(/'/g, "\\'");
  const parentQuery = parentId ? ` and '${parentId}' in parents` : "";
  const response = await drive.files.list({
    q: `name='${escapedName}' and mimeType='application/vnd.google-apps.folder' and trashed=false${parentQuery}`,
    fields: "files(id,name,webViewLink)",
    pageSize: 10,
  });
  return response.data.files?.[0] ?? null;
}

async function ensureFolder(drive: drive_v3.Drive, name: string, parentId?: string | null) {
  const existing = await findFolder(drive, name, parentId);
  if (existing?.id) return existing;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      ...(parentId ? { parents: [parentId] } : {}),
    },
    fields: "id,name,webViewLink",
  });
  if (!created.data.id) throw new Error(`Could not create the ${name} folder.`);
  return created.data;
}

async function ensureSpreadsheet(
  drive: drive_v3.Drive,
  sheets: sheets_v4.Sheets,
  title: string,
  existingId?: string | null
) {
  if (existingId) return existingId;
  const escapedTitle = title.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name='${escapedTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
    fields: "files(id,name)",
    pageSize: 10,
  });
  if (existing.data.files?.[0]?.id) return existing.data.files[0].id;
  const created = await sheets.spreadsheets.create({
    requestBody: { properties: { title } },
    fields: "spreadsheetId,spreadsheetUrl",
  });
  if (!created.data.spreadsheetId) throw new Error("Could not create the Google Sheet.");
  return created.data.spreadsheetId;
}

async function ensureSheetHeader(sheets: sheets_v4.Sheets, spreadsheetId: string) {
  const header = [
    "Synced at", "Workspace", "Product", "Brand", "Marketplace", "Category", "Status",
    "Title", "Bullet points", "Description", "Keywords", "Compliance score", "Images folder",
  ];
  const current = await sheets.spreadsheets.values.get({ spreadsheetId, range: "A1:M1" });
  if (current.data.values?.length) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "A1:M1",
    valueInputOption: "RAW",
    requestBody: { values: [header] },
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
  drive: drive_v3.Drive,
  folderId: string,
  image: { name: string; dataUrl: string }
): Promise<UploadedImageLink> {
  const { mimeType, bytes } = dataUrlParts(image.dataUrl);
  const { Readable } = await import("stream");
  const created = await drive.files.create({
    requestBody: { name: image.name, parents: [folderId] },
    media: { mimeType, body: Readable.from(bytes) },
    fields: "id,name,webViewLink",
  });
  const fileId = created.data.id ?? "";
  return {
    name: created.data.name ?? image.name,
    fileId,
    webViewLink: created.data.webViewLink ?? (fileId ? `https://drive.google.com/file/d/${fileId}/view` : ""),
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
  const { drive, sheets } = await getGoogleServices(userId);
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
    : await ensureFolder(drive, "SellerCrew");
  if (!root.id) throw new Error("Google Drive root folder is unavailable.");

  let productParentId = root.id;
  let workspaceFolderId = settings.workspaceFolderId;
  if (settings.imageFolderMode === "workspace") {
    const workspaceFolder = workspaceFolderId
      ? { id: workspaceFolderId }
      : await ensureFolder(drive, payload.workspaceName, root.id);
    workspaceFolderId = workspaceFolder.id ?? null;
    if (!workspaceFolderId) throw new Error("Workspace folder is unavailable.");
    productParentId = workspaceFolderId;
  }

  const productsFolder = await ensureFolder(drive, "Products", productParentId);
  const productFolder = await ensureFolder(drive, payload.productName, productsFolder.id);
  if (!productFolder.id) throw new Error("Product folder is unavailable.");
  const customerFolder = await ensureFolder(drive, "Customer uploads", productFolder.id);
  const generatedFolder = await ensureFolder(drive, "SellerCrew generated", productFolder.id);
  if (!customerFolder.id || !generatedFolder.id) throw new Error("Product image folders are unavailable.");

  const [customerUploads, generatedUploads] = await Promise.all([
    Promise.all(payload.customerImages.map((image) => uploadImage(drive, customerFolder.id!, image))),
    Promise.all(payload.generatedImages.map((image) => uploadImage(drive, generatedFolder.id!, image))),
  ]);

  const sheetId = await ensureSpreadsheet(
    drive,
    sheets,
    settings.sheetMode === "workspace"
      ? `${payload.workspaceName} - SellerCrew Products`
      : "SellerCrew Products",
    settings.selectedSpreadsheetId || settings.workspaceSheetId
  );
  await ensureSheetHeader(sheets, sheetId);
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "A:M",
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
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
    },
  });

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
  };
}
