import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Build new FormData to send to Pinata
    const pinataForm = new FormData();
    pinataForm.append("file", file, file.name || "upload");
    pinataForm.append(
      "pinataMetadata",
      JSON.stringify({ name: `ritual-collage-${Date.now()}` })
    );
    pinataForm.append(
      "pinataOptions",
      JSON.stringify({ cidVersion: 1 })
    );

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        // Keys stay server-side — never exposed to browser
        pinata_api_key: process.env.PINATA_API_KEY || "",
        pinata_secret_api_key: process.env.PINATA_SECRET_KEY || "",
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Pinata error:", err);
      return NextResponse.json({ error: "Pinata upload failed" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ ipfsHash: data.IpfsHash });

  } catch (err: any) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: err.message || "Upload failed" }, { status: 500 });
  }
}
