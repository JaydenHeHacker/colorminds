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
    const { category, theme, difficulty = 'medium' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating coloring page:', { category, theme, difficulty });

    // Structured prompt template with difficulty-based settings
    const lineSettings: Record<string, any> = {
      easy: {
        weight: 'very thick (5-8px), bold outlines',
        complexity: '3-5 main shapes with large areas',
        age_group: '3-5 years old',
        detail_level: 'minimal details, simple clear shapes'
      },
      medium: {
        weight: 'medium (3-4px), balanced detail',
        complexity: '5-8 main shapes with moderate detail',
        age_group: '6-8 years old',
        detail_level: 'moderate complexity with clear sections'
      },
      hard: {
        weight: 'fine (1-2px), intricate patterns',
        complexity: '8+ shapes with fine details',
        age_group: '9+ years old',
        detail_level: 'detailed and intricate with complex patterns'
      }
    };

    const settings = lineSettings[difficulty] || lineSettings.medium;

    // Build structured prompt - explicitly request image generation
    const prompt = `GENERATE AN IMAGE: Create a black-and-white line art coloring page image with the following specifications:

SUBJECT & THEME:
- Main theme: ${theme}
- Category: ${category}
- Target age: ${settings.age_group}
- Composition: Centered, single focal point with ${settings.complexity}

LINE ART SPECIFICATIONS:
- Line weight: ${settings.weight}
- Line quality: Clean, continuous, no breaks or gaps
- Detail level: ${settings.detail_level}
- All shapes must be closed (no open paths) for easy coloring

STYLE REQUIREMENTS (CRITICAL):
- Pure black lines (#000000) on white background (#FFFFFF)
- Absolutely NO gradients, shading, or gray tones
- NO colors - only black outlines
- High contrast for clear printing
- Large clear spaces suitable for coloring
- Age-appropriate and child-friendly content

TECHNICAL SPECS:
- Square aspect ratio (1:1)
- High resolution for printing (300 DPI equivalent)
- Safe margins: 10% border space around the main subject
- Printable and suitable for coloring books

IMPORTANT: You must generate the actual coloring page IMAGE, not just text descriptions.

After generating the image, also provide:
- A clear, descriptive English title (e.g., "Happy Elephant Playing in the Garden")
- An engaging 1-2 sentence description for US/UK parents and children

NEGATIVE PROMPTS (DO NOT INCLUDE):
- No colors, shading, gradients, or gray tones
- No blurry, broken, or disconnected lines
- No photorealistic textures or details
- No small complex details that are hard to color
- No violent, scary, or inappropriate content
- No text, logos, or brand names within the image
- Avoid complexity beyond the ${settings.age_group} skill level

OUTPUT: A clean, professional coloring page ready for printing and use in a coloring book.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    // Debug: Log the response structure
    console.log('AI response structure:', JSON.stringify({
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      hasMessage: !!data.choices?.[0]?.message,
      hasImages: !!data.choices?.[0]?.message?.images,
      imagesLength: data.choices?.[0]?.message?.images?.length,
      hasImageUrl: !!data.choices?.[0]?.message?.images?.[0]?.image_url,
      fullResponse: data
    }, null, 2));

    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('No image in AI response. Full response:', JSON.stringify(data));
      throw new Error('No image generated - AI response missing image data');
    }

    // Extract English title from AI response
    const aiText = data.choices?.[0]?.message?.content || '';
    let suggestedTitle = theme;
    let suggestedDescription = '';
    
    // Try to extract title from AI response
    const titleMatch = aiText.match(/Title:\s*([^\n]+)/i);
    if (titleMatch) {
      suggestedTitle = titleMatch[1].trim().replace(/["""]/g, '');
    }
    
    // Try to extract description from AI response
    const descMatch = aiText.match(/Description:\s*([^\n]+)/i);
    if (descMatch) {
      suggestedDescription = descMatch[1].trim().replace(/["""]/g, '');
    }

    // Upload image to R2
    console.log('Uploading image to R2...');
    const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID');
    const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY');
    const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID');
    const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET_NAME');

    if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ACCOUNT_ID || !R2_BUCKET_NAME) {
      throw new Error('R2 credentials not configured');
    }

    // Fetch image from data URI
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `coloring-page-${category}-${timestamp}.png`;

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
    await s3Client.putObject(fileName, imageBytes, {
      bucketName: R2_BUCKET_NAME,
      metadata: {
        'Content-Type': 'image/png',
      },
    });

    // Construct public URL
    const publicUrl = `https://pub-c60d2f46067e4d25acda5bd5ac88504c.r2.dev/${fileName}`;
    console.log('Image uploaded to R2:', publicUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        imageUrl: publicUrl,
        category,
        theme,
        suggestedTitle,
        suggestedDescription
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error generating coloring page:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate coloring page' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});