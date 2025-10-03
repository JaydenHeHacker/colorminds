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

    console.log('Uploading to R2:', { fileName, bucket: R2_BUCKET_NAME });

    // Convert base64 to Uint8Array
    const base64Data = imageData.split(',')[1];
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

    // Upload to R2
    await s3Client.putObject(fileName, bytes, {
      bucketName: R2_BUCKET_NAME,
      metadata: {
        'Content-Type': 'image/png',
      },
    });

    // Construct public URL
    const publicUrl = `https://pub-${R2_ACCOUNT_ID}.r2.dev/${fileName}`;

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
