import { NextResponse } from 'next/server';
import { pinata } from "../../../../utils/config"

export const dynamic = "force-dynamic";

export async function GET() {
  // If you're going to use auth you'll want to verify here
  try {
    // Debug: Check if JWT is available
    if (!process.env.PINATA_JWT) {
      console.error('PINATA_JWT environment variable is not set');
      return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
    }

    const url = await pinata.upload.public.createSignedURL({
      expires: 30, // The only required param
    })
    return NextResponse.json({ url: url }, { status: 200 }); // Returns the signed upload URL
  } catch (error) {
    console.error('Pinata error:', error);
    return NextResponse.json({ error: "Error creating signed URL", details: error }, { status: 500 });
  }
} 