/** Força download de arquivo via fetch + blob (funciona com Supabase Storage) */
export async function forceDownload(url: string, filename?: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename || url.split("/").pop() || "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback: abre em nova aba
    window.open(url, "_blank");
  }
}
