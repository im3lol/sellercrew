"use client";

import { useDashboardStore, type DashboardAsset } from "@/lib/dashboard-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, FileText, FolderOpen, ImagePlus, Trash2, Upload, WandSparkles } from "lucide-react";
import { toast } from "sonner";

async function imagePreview(file: File) {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  image.src = source;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Could not prepare ${file.name}.`));
  });
  const scale = Math.min(1, 720 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.78);
}

function AssetFolder({
  title,
  description,
  assets,
  generated,
  projectName,
  onDelete,
}: {
  title: string;
  description: string;
  assets: DashboardAsset[];
  generated: boolean;
  projectName: (projectId: string | null) => string;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${generated ? "bg-[#7E44E6]/10" : "bg-[#035EF9]/10"}`}>
              {generated
                ? <WandSparkles className="size-5 text-[#7E44E6]" />
                : <FolderOpen className="size-5 text-[#035EF9]" />}
            </div>
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <Badge variant="outline">{assets.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {assets.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <div key={asset.id} className="group relative overflow-hidden rounded-xl border bg-white">
                {asset.driveUrl ? (
                  <a
                    href={asset.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open the full-resolution file in Google Drive"
                    className="absolute right-2 top-2 z-10 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <ExternalLink className="size-3" />
                    Drive
                  </a>
                ) : null}
                {asset.type === "image" && asset.dataUrl ? (
                  <img src={asset.dataUrl} alt={asset.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className={`flex aspect-square items-center justify-center ${generated ? "bg-[#7E44E6]/5" : "bg-[#035EF9]/5"}`}>
                    {asset.type === "image"
                      ? <ImagePlus className={`size-8 ${generated ? "text-[#7E44E6]" : "text-[#035EF9]"}`} />
                      : <FileText className="size-8 text-gray-400" />}
                  </div>
                )}
                <div className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-400">
                      {projectName(asset.projectId)} · {(asset.size / 1024).toFixed(1)} KB
                      {asset.driveUrl ? " · backed up" : ""}
                    </p>
                  </div>
                  {asset.driveUrl ? (
                    <Button size="icon" variant="ghost" asChild title="Open in Google Drive">
                      <a href={asset.driveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-4 text-[#035EF9]" />
                      </a>
                    </Button>
                  ) : null}
                  <Button size="icon" variant="ghost" onClick={() => onDelete(asset.id)}>
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-10 text-center text-sm text-gray-400">
            {generated
              ? "Generated listing images will appear here after Adam completes production."
              : "No customer product images saved yet."}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductAssets() {
  const { assets, projects, selectedProjectId, addAssets, deleteAsset } = useDashboardStore();
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const visibleAssets = selectedProjectId
    ? assets.filter((asset) => asset.projectId === selectedProjectId)
    : assets;
  const projectName = (projectId: string | null) =>
    projects.find((project) => project.id === projectId)?.name ?? "General";

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#0B0F1A]">{selectedProject ? `${selectedProject.name} assets` : "Assets"}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Each product project keeps customer source images separate from SellerCrew generated assets.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl py-8 text-center hover:bg-gray-50">
            <Upload className="size-8 text-[#035EF9]" />
            <span className="text-sm font-medium">Add customer source files</span>
            <span className="text-xs text-gray-400">
              {selectedProject ? `Files will be saved inside ${selectedProject.name}.` : "Select a product project first to keep files organized."}
            </span>
            <input
              multiple
              type="file"
              className="hidden"
              disabled={!selectedProjectId}
              onChange={async (event) => {
                const files = Array.from(event.target.files ?? []);
                if (!files.length || !selectedProjectId) return;
                const prepared = await Promise.all(files.map(async (file) => ({
                  projectId: selectedProjectId,
                  name: file.name,
                  type: file.type.startsWith("image/") ? "image" as const : "document" as const,
                  source: "customer" as const,
                  dataUrl: file.type.startsWith("image/") ? await imagePreview(file) : undefined,
                  size: file.size,
                })));
                addAssets(prepared);
                toast.success(`${files.length} customer asset${files.length === 1 ? "" : "s"} added.`);
                event.target.value = "";
              }}
            />
          </label>
        </CardContent>
      </Card>

      <AssetFolder
        title="Customer uploads"
        description="Original product photos and files supplied by the seller."
        assets={visibleAssets.filter((asset) => asset.source === "customer")}
        generated={false}
        projectName={projectName}
        onDelete={deleteAsset}
      />
      <AssetFolder
        title="SellerCrew generated"
        description="Professional listing images created from the approved visual plan."
        assets={visibleAssets.filter((asset) => asset.source === "generated")}
        generated
        projectName={projectName}
        onDelete={deleteAsset}
      />
    </div>
  );
}
