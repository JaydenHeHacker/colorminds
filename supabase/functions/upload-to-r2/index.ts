import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { S3Client } from "https://deno.land/x/s3_lite_client@0.7.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, fileName } = await req.json();
    
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      throw new Error('R2 credentials not configured');
    }

    if (!imageData || !fileName) {
      throw new Error('imageData and fileName are required');
    }

    console.log('Uploading to R2:', { fileName, bucket: R2_BUCKET_NAME, imageDataLength: imageData.length });

    // Handle both data URL format and pure base64
    let base64Data: string;
    if (imageData.includes(',')) {
      // Data URL format: data:image/png;base64,xxxxx
      base64Data = imageData.split(',')[1];
    } else {
      // Already pure base64
      base64Data = imageData;
    }

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create S3 client for R2
    const s3Client = new S3Client({
      endPoint: `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      region: 'auto',
      accessKey: R2_ACCESS_KEY_ID,
      secretKey: R2_SECRET_ACCESS_KEY,
      useSSL: true,
      port: 443,
    });

    // Determine content type from filename
    const extension = fileName.split('.').pop()?.toLowerCase();
    const contentType = extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' : 'image/png';

    console.log('Uploading file with content type:', contentType);

    // Upload to R2
    await s3Client.putObject(fileName, bytes, {
      bucketName: R2_BUCKET_NAME,
      metadata: {
        'Content-Type': contentType,
      },
    });

    // Construct public URL
    const publicUrl = `https://pub-c60d2f46067e4d25acda5bd5ac88504c.r2.dev/${fileName}`;

    console.log('Upload successful:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        publicUrl 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error uploading to R2:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to upload to R2' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
