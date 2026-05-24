export async function uploadToPinata(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("pinataMetadata", JSON.stringify({ name: `ritual-mosaic-pfp-${Date.now()}` }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY || "",
      pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_KEY || "",
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Pinata upload failed: ${err}`);
  }

  const data = await res.json();
  return data.IpfsHash as string;
}

export function ipfsUrl(hash: string): string {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
}
