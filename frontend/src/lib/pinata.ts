// All uploads go through our own API route — keeps keys server-side
// and avoids CORS issues with calling Pinata directly from browser

export async function uploadToIPFS(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file, filename || "upload");

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.ipfsHash as string;
}

export function ipfsUrl(hash: string): string {
  if (!hash) return "";
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}
