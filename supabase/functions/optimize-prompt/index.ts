import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    // Verify user authentication and premium status
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");

    // Check if user is premium
    const { data: subscription } = await supabaseClient
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

    if (!subscription || subscription.tier !== "premium") {
      throw new Error("Premium subscription required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert at creating detailed, structured prompts for children's coloring page generation.

Your task is to transform simple user inputs into rich, detailed descriptions that will produce high-quality coloring pages.

TRANSFORMATION GUIDELINES:

1. EXPAND THE SUBJECT:
   - If user says "a cat", specify: "a cute cartoon cat with big round eyes, fluffy tail, and playful expression"
   - Add personality and character details
   - Specify pose and action (sitting, playing, jumping, etc.)

2. ADD ENVIRONMENT & CONTEXT:
   - Never leave subjects floating in empty space
   - Add relevant setting details: "in a sunny garden with butterflies"
   - Include 3-5 background elements that complement the subject
   - Make scenes feel complete and story-like

3. SPECIFY STYLE & COMPOSITION:
   - Clarify artistic style if ambiguous (cartoon, realistic, cute, etc.)
   - Mention composition: centered, close-up, full scene, etc.
   - Note any special elements: patterns, decorations, etc.

4. ENSURE COLORING-FRIENDLY DETAILS:
   - Mention clear outlines and distinct sections
   - Add elements that create interesting coloring areas
   - Include varied shapes and sizes for visual interest

5. KEEP IT CHILD-APPROPRIATE:
   - Use positive, friendly language
   - Avoid scary or inappropriate themes
   - Focus on fun, engaging subjects

EXAMPLE TRANSFORMATIONS:

User: "a dog"
Output: "A friendly cartoon dog with floppy ears and a wagging tail, sitting happily in a backyard with a bone, doghouse, flowers, and a butterfly nearby. The dog has big expressive eyes and is wearing a collar with a heart tag. Clear outlines with distinct sections for easy coloring."

User: "unicorn"
Output: "A magical unicorn with a flowing mane, spiraling horn, and gentle expression, prancing through a meadow filled with stars, clouds, and flowers. The unicorn has detailed flowing hair, decorative patterns on its body, and is surrounded by sparkles and butterflies. Whimsical style with clear sections perfect for coloring."

User: "princess in castle"
Output: "A kind princess with a crown and flowing dress, standing in front of her fairy tale castle with tall towers, flags, and arched windows. She's in a courtyard with a fountain, rose bushes, and a friendly bluebird. The princess has a warm smile and her dress has decorative patterns. Medieval fantasy style with distinct areas for coloring."

IMPORTANT:
- Transform vague inputs into specific, vivid descriptions
- Add 5-10 details that weren't in the original
- Keep the core idea but make it much richer
- Ensure the output is a single, clear descriptive paragraph
- Don't use bullet points or structure in your output - just flowing descriptive text
- Output should be 3-5 sentences maximum
- Make it sound natural, not like a list of requirements`
          },
          {
            role: "user",
            content: `Transform this simple coloring page idea into a detailed, rich prompt: "${prompt}"`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const optimizedPrompt = data.choices[0].message.content;

    return new Response(JSON.stringify({ optimizedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error in optimize-prompt:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorMessage.includes("Premium") ? 403 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
