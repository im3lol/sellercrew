"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  CreditCard,
  ExternalLink,
  FolderTree,
  LockKeyhole,
  Mail,
  RefreshCw,
  Receipt,
  Save,
  Sheet,
  ShieldCheck,
  Unplug,
  UserRound,
  Zap,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useDashboardStore } from "@/lib/dashboard-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ClerkUserButton } from "@/components/auth/clerk-user-button";

interface DriveSettings {
  sheetMode: "workspace" | "global";
  imageFolderMode: "workspace" | "global";
  selectedSpreadsheetId: string | null;
  selectedSpreadsheetName: string | null;
  selectedFolderId: string | null;
  selectedFolderName: string | null;
  autoSync: boolean;
}

interface DriveState {
  configured: boolean;
  connected: boolean;
  connection?: { googleEmail?: string | null; connectedAt?: string } | null;
  settings: DriveSettings;
}

interface DriveSpreadsheet {
  id?: string | null;
  name?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
}

interface DriveFolder {
  id?: string | null;
  name?: string | null;
  modifiedTime?: string | null;
  webViewLink?: string | null;
}

interface DrivePickerItem {
  id?: string | null;
  name?: string | null;
  modifiedTime?: string | null;
}

function DriveResourcePicker({
  type,
  items,
  value,
  selectedName,
  loading,
  onSelect,
}: {
  type: "sheet" | "folder";
  items: DrivePickerItem[];
  value: string | null;
  selectedName: string | null;
  loading: boolean;
  onSelect: (item: DrivePickerItem | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const isSheet = type === "sheet";
  const accent = isSheet ? "text-emerald-600 bg-emerald-50" : "text-[#7E44E6] bg-[#7E44E6]/8";
  const Icon = isSheet ? Sheet : FolderTree;
  const automaticTitle = isSheet ? "Create a new SellerCrew sheet" : "Create a SellerCrew folder";
  const automaticDescription = isSheet
    ? "SellerCrew creates and manages the product sheet automatically."
    : "SellerCrew creates the root folder and product structure automatically.";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-14 w-full justify-between rounded-xl border-gray-200 bg-white px-3 py-2.5 text-left shadow-sm hover:border-gray-300 hover:bg-white"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
              <Icon className="size-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#0B0F1A]">
                {value ? selectedName || (isSheet ? "Selected sheet" : "Selected folder") : automaticTitle}
              </span>
              <span className="block truncate text-xs font-normal text-gray-400">
                {value ? (isSheet ? "Existing Google Sheet" : "Existing Drive folder") : "Recommended automatic setup"}
              </span>
            </span>
          </span>
          <ChevronDown className={`ml-3 size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[320px] rounded-xl border-gray-200 p-0 shadow-xl">
        <Command>
          <CommandInput placeholder={isSheet ? "Search your Google Sheets..." : "Search your Drive folders..."} />
          <CommandList className="max-h-72 p-1.5">
            <CommandEmpty>{loading ? "Loading from Google..." : `No ${isSheet ? "sheets" : "folders"} found.`}</CommandEmpty>
            <CommandGroup heading={isSheet ? "Sheet destination" : "Folder destination"}>
              <CommandItem
                value={`${automaticTitle} automatic recommended`}
                onSelect={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="items-start rounded-lg px-2.5 py-2.5"
              >
                <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{automaticTitle}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-gray-400">{automaticDescription}</span>
                </span>
                {!value && <Check className="mt-1 size-4 text-[#035EF9]" />}
              </CommandItem>
            </CommandGroup>
            {items.length > 0 && (
              <CommandGroup heading={isSheet ? "Your Google Sheets" : "Your Drive folders"}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${item.name || "Untitled"} ${item.id}`}
                    onSelect={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    className="items-center rounded-lg px-2.5 py-2.5"
                  >
                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{item.name || "Untitled"}</span>
                      <span className="block text-xs text-gray-400">
                        {item.modifiedTime ? `Updated ${new Date(item.modifiedTime).toLocaleDateString()}` : "Available in your Google account"}
                      </span>
                    </span>
                    {value === item.id && <Check className="size-4 text-[#035EF9]" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function GoogleDriveSettings({ workspaceId }: { workspaceId: string }) {
  const [state, setState] = useState<DriveState | null>(null);
  const [spreadsheets, setSpreadsheets] = useState<DriveSpreadsheet[]>([]);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [readingSheets, setReadingSheets] = useState(false);
  const [readingFolders, setReadingFolders] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadState = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/google-drive?workspaceId=${encodeURIComponent(workspaceId)}`);
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not load Google Drive settings.");
      setState(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load Google Drive settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
    const status = new URLSearchParams(window.location.search).get("googleDrive");
    if (status === "connected") toast.success("Google Drive connected successfully.");
    if (status === "connection-failed") toast.error("Google Drive connection could not be completed.");
    if (status) window.history.replaceState({}, "", window.location.pathname);
  }, [workspaceId]);

  const loadSpreadsheets = async () => {
    setReadingSheets(true);
    try {
      const response = await fetch("/api/google-drive/spreadsheets");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not read your Google Sheets.");
      setSpreadsheets(data.spreadsheets ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read your Google Sheets.");
    } finally {
      setReadingSheets(false);
    }
  };

  const loadFolders = async () => {
    setReadingFolders(true);
    try {
      const response = await fetch("/api/google-drive/folders");
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not read your Google Drive folders.");
      setFolders(data.folders ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not read your Google Drive folders.");
    } finally {
      setReadingFolders(false);
    }
  };

  useEffect(() => {
    if (!state?.connected) return;
    void Promise.all([loadSpreadsheets(), loadFolders()]);
  }, [state?.connected]);

  const save = async () => {
    if (!state) return;
    setSaving(true);
    try {
      const response = await fetch("/api/google-drive", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, ...state.settings }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Could not save Google Drive settings.");
      setState((current) => current ? { ...current, settings: data.settings } : current);
      toast.success("Google Drive preferences saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Google Drive settings.");
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async () => {
    const response = await fetch("/api/google-drive", { method: "DELETE" });
    if (!response.ok) return toast.error("Could not disconnect Google Drive.");
    setSpreadsheets([]);
    setFolders([]);
    await loadState();
    toast.success("Google Drive disconnected.");
  };

  if (loading) {
    return <Card><CardContent className="flex items-center justify-center py-16"><RefreshCw className="size-5 animate-spin text-gray-400" /></CardContent></Card>;
  }
  if (!state) return null;

  return (
    <div className="space-y-4">
      <Card className={state.connected ? "border-green-200" : ""}>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <div className={`flex size-12 items-center justify-center rounded-xl ${state.connected ? "bg-green-50 text-green-700" : "bg-[#035EF9]/10 text-[#035EF9]"}`}>
            <Cloud className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">Google Drive</p>
              <Badge variant="outline" className={state.connected ? "border-green-200 bg-green-50 text-green-700" : ""}>
                {state.connected ? "Connected" : "Not connected"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {state.connected
                ? `Connected as ${state.connection?.googleEmail || "Google user"}`
                : "Store product images and listing data in the customer's own Google account."}
            </p>
          </div>
          {state.connected ? (
            <Button variant="outline" className="text-red-600" onClick={disconnect}><Unplug className="mr-2 size-4" /> Disconnect</Button>
          ) : (
            <Button asChild disabled={!state.configured}>
              <a href="/api/google-drive/connect"><Cloud className="mr-2 size-4" /> Connect Google Drive</a>
            </Button>
          )}
        </CardContent>
      </Card>

      {!state.configured && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="p-4 text-sm text-amber-800">
            Add the Google OAuth credentials to `.env` before users can connect Drive.
          </CardContent>
        </Card>
      )}

      {state.connected && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Sheet className="size-4 text-green-600" /> Product sheet structure</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["workspace", "Sheet per workspace", "Each workspace writes to its own product sheet."],
                  ["global", "One sheet for all products", "All products are appended to one selected or generated sheet."],
                ].map(([value, title, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setState({ ...state, settings: { ...state.settings, sheetMode: value as DriveSettings["sheetMode"] } })}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${state.settings.sheetMode === value ? "border-[#035EF9] bg-[#035EF9]/5" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderTree className="size-4 text-[#7E44E6]" /> Image folder structure</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  ["workspace", "Folder per workspace", "SellerCrew / Workspace / Products / Product / image groups"],
                  ["global", "One products folder", "SellerCrew / Products / Product / image groups"],
                ].map(([value, title, description]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setState({ ...state, settings: { ...state.settings, imageFolderMode: value as DriveSettings["imageFolderMode"] } })}
                    className={`w-full rounded-xl border p-4 text-left transition-colors ${state.settings.imageFolderMode === value ? "border-[#7E44E6] bg-[#7E44E6]/5" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs text-gray-500">{description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><CardTitle className="text-base">1. Choose the product data sheet</CardTitle><p className="mt-1 text-sm text-gray-500">Select any spreadsheet available in the connected Google account.</p></div>
                <Button variant="outline" onClick={loadSpreadsheets} disabled={readingSheets}>
                  <RefreshCw className={`mr-2 size-4 ${readingSheets ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Google Sheet</Label>
              <DriveResourcePicker
                type="sheet"
                items={spreadsheets}
                value={state.settings.selectedSpreadsheetId ?? ""}
                selectedName={state.settings.selectedSpreadsheetName}
                loading={readingSheets}
                onSelect={(selected) => {
                  setState({
                    ...state,
                    settings: {
                      ...state.settings,
                      selectedSpreadsheetId: selected?.id ?? null,
                      selectedSpreadsheetName: selected?.name ?? null,
                    },
                  });
                }}
              />
              {state.settings.selectedSpreadsheetId && (
                <a
                  href={`https://docs.google.com/spreadsheets/d/${state.settings.selectedSpreadsheetId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#035EF9] hover:underline"
                >
                  Open selected sheet <ExternalLink className="size-3.5" />
                </a>
              )}
              {!readingSheets && spreadsheets.length === 0 && (
                <p className="text-xs text-gray-400">No spreadsheets were found. SellerCrew can create one automatically.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><CardTitle className="text-base">2. Choose the images folder</CardTitle><p className="mt-1 text-sm text-gray-500">Choose where SellerCrew creates workspace and product folders.</p></div>
                <Button variant="outline" onClick={loadFolders} disabled={readingFolders}>
                  <RefreshCw className={`mr-2 size-4 ${readingFolders ? "animate-spin" : ""}`} /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Google Drive folder</Label>
              <DriveResourcePicker
                type="folder"
                items={folders}
                value={state.settings.selectedFolderId ?? ""}
                selectedName={state.settings.selectedFolderName}
                loading={readingFolders}
                onSelect={(selected) => {
                  setState({
                    ...state,
                    settings: {
                      ...state.settings,
                      selectedFolderId: selected?.id ?? null,
                      selectedFolderName: selected?.name ?? null,
                    },
                  });
                }}
              />
              {state.settings.selectedFolderId && (
                <a
                  href={`https://drive.google.com/drive/folders/${state.settings.selectedFolderId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#7E44E6] hover:underline"
                >
                  Open selected folder <ExternalLink className="size-3.5" />
                </a>
              )}
              {!readingFolders && folders.length === 0 && (
                <p className="text-xs text-gray-400">No folders were found. SellerCrew can create its own root folder.</p>
              )}
            </CardContent>
          </Card>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
                <div><p className="text-sm font-medium">Automatic sync</p><p className="text-xs text-gray-500">Upload images and append product data after a successful workflow.</p></div>
                <Switch checked={state.settings.autoSync} onCheckedChange={(autoSync) => setState({ ...state, settings: { ...state.settings, autoSync } })} />
              </div>
              <Button onClick={save} disabled={saving}><Save className="mr-2 size-4" /> {saving ? "Saving..." : "Save Drive preferences"}</Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export function AccountSettingsPage() {
  const { user, activeWorkspace, applyAccount, setDashboardPage } = useAppStore();
  const { plan, creditsBalance, creditsUsed } = useDashboardStore();
  const [name, setName] = useState(user?.name ?? "");
  const [workspaceName, setWorkspaceName] = useState(activeWorkspace?.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const totalCredits = creditsBalance + creditsUsed;

  useEffect(() => {
    setName(user?.name ?? "");
    setWorkspaceName(activeWorkspace?.name ?? "");
  }, [activeWorkspace?.name, user?.name]);

  const updateAccount = async (payload: Record<string, string>) => {
    const response = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Could not update your account.");
    applyAccount(data, false);
  };

  const saveProfile = async () => {
    if (name.trim().length < 2 || workspaceName.trim().length < 2) {
      return toast.error("Enter a valid name and workspace name.");
    }
    setSavingProfile(true);
    try {
      await updateAccount({ name: name.trim(), workspaceName: workspaceName.trim() });
      toast.success("Account details updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your account.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || newPassword.length < 8) {
      return toast.error("Enter your current password and a new password of at least 8 characters.");
    }
    if (newPassword !== confirmPassword) return toast.error("New passwords do not match.");
    setSavingPassword(true);
    try {
      await updateAccount({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">Account settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your identity, workspace, security, plan, and billing activity.</p>
      </div>

      <Card className="overflow-hidden border-gray-200">
        <div className="h-1 bg-gradient-to-r from-[#035EF9] via-[#7E44E6] to-[#FC7403]" />
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-16 border-4 border-white shadow-md">
            {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
            <AvatarFallback className="bg-[#0B0F1A] text-lg font-semibold text-white">
              {user?.name?.split(" ").map((part) => part[0]).join("").slice(0, 2) || "SC"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-semibold">{user?.name}</h3>
              <Badge className="border-0 bg-[#035EF9]/10 text-[#035EF9] capitalize">{plan} plan</Badge>
            </div>
            <p className="mt-1 truncate text-sm text-gray-500">{user?.email}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
              <CheckCircle2 className="size-3.5" /> Active account
            </p>
          </div>
          <Button variant="outline" onClick={() => setDashboardPage("plans")}>
            <CreditCard className="mr-2 size-4" /> Manage plan
          </Button>
          <ClerkUserButton />
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="gap-5">
        <TabsList className="h-auto w-full justify-start overflow-x-auto bg-white p-1 shadow-sm ring-1 ring-gray-200 sm:w-fit">
          <TabsTrigger value="profile" className="px-4"><UserRound /> Profile</TabsTrigger>
          <TabsTrigger value="security" className="px-4"><ShieldCheck /> Security</TabsTrigger>
          <TabsTrigger value="subscription" className="px-4"><CreditCard /> Subscription</TabsTrigger>
          <TabsTrigger value="google-drive" className="px-4"><Cloud /> Google Drive</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle className="text-base">Profile and workspace</CardTitle></CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="account-name">Full name</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 size-4 text-gray-400" />
                  <Input id="account-name" className="pl-9" value={name} onChange={(event) => setName(event.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 size-4 text-gray-400" />
                  <Input id="account-email" className="bg-gray-50 pl-9" value={user?.email ?? ""} disabled />
                </div>
                <p className="text-xs text-gray-400">Your sign-in email is protected. Contact support to change it.</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="workspace-name">Workspace name</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-3 size-4 text-gray-400" />
                  <Input id="workspace-name" className="pl-9" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <Button onClick={saveProfile} disabled={savingProfile}>
                  <Save className="mr-2 size-4" /> {savingProfile ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader><CardTitle className="text-base">Change password</CardTitle></CardHeader>
            {user?.hasPassword === false ? (
              <CardContent>
                <div className="rounded-xl border border-[#035EF9]/15 bg-[#035EF9]/5 p-4">
                  <p className="text-sm font-medium text-[#0B0F1A]">Password managed by Google</p>
                  <p className="mt-1 text-sm text-gray-500">This account uses Google sign-in. Password and recovery settings are managed in your Google Account.</p>
                </div>
              </CardContent>
            ) : (
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button onClick={changePassword} disabled={savingPassword}>
                  <LockKeyhole className="mr-2 size-4" /> {savingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>
            </CardContent>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card>
              <CardHeader><CardTitle className="text-base">Current subscription</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div><p className="text-2xl font-bold capitalize">{plan}</p><p className="text-sm text-gray-500">Active workspace plan</p></div>
                  <Badge className="bg-green-50 text-green-700 hover:bg-green-50">Active</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-sm"><span>Monthly credits</span><span>{creditsUsed.toLocaleString()} used</span></div>
                  <Progress className="mt-2" value={(creditsUsed / Math.max(totalCredits, 1)) * 100} />
                  <p className="mt-2 text-xs text-gray-500">{creditsBalance.toLocaleString()} credits remaining</p>
                </div>
                <Button onClick={() => setDashboardPage("plans")}><Zap className="mr-2 size-4" /> View plans and credits</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Billing shortcuts</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDashboardPage("usage")}><Activity className="mr-2 size-4" /> Usage details</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDashboardPage("invoices")}><Receipt className="mr-2 size-4" /> Invoices</Button>
                <Button variant="ghost" className="w-full justify-start" onClick={() => setDashboardPage("credits")}><Zap className="mr-2 size-4" /> Credit history</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="google-drive">
          {activeWorkspace?.id ? <GoogleDriveSettings workspaceId={activeWorkspace.id} /> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
