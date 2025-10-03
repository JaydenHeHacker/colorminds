import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting auto-generate-drafts job...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 检查是否启用了自动生成
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', 'auto_generate_enabled')
      .single();

    if (!settings || settings.value !== 'true') {
      console.log("Auto-generate is disabled");
      return new Response(
        JSON.stringify({ message: "Auto-generate is disabled" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 获取所有激活的类目
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name')
      .order('id');

    if (categoriesError || !categories || categories.length === 0) {
      console.error("Error fetching categories:", categoriesError);
      return new Response(
        JSON.stringify({ error: "No categories found" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 随机选择类目
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // 随机选择难度
    const difficulties = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    // 随机选择生成类型（40% 单图，60% 系列图）
    const isSeries = Math.random() > 0.4;
    const generationType = isSeries ? 'series' : 'single';

    console.log(`Generating ${generationType} for category: ${category.name}, difficulty: ${difficulty}`);

    // 第一步：生成主题
    const themeResponse = await supabase.functions.invoke('generate-theme', {
      body: {
        category: category.name,
        generationType,
        difficulty,
        seriesLength: isSeries ? 8 : 1
      }
    });

    if (themeResponse.error) {
      console.error("Error generating theme:", themeResponse.error);
      throw new Error("Failed to generate theme");
    }

    const { theme } = themeResponse.data;
    console.log("Generated theme:", theme);

    // 第二步：生成图片
    let generatedPages = [];

    if (isSeries) {
      // 生成系列图（8张）
      const seriesResponse = await supabase.functions.invoke('generate-story-series', {
        body: {
          category: category.name,
          theme,
          difficulty,
          seriesLength: 8
        }
      });

      if (seriesResponse.error) {
        console.error("Error generating series:", seriesResponse.error);
        throw new Error("Failed to generate series");
      }

      console.log("Series response data:", JSON.stringify(seriesResponse.data));
      
      const { images, story } = seriesResponse.data || {};

      if (!images || images.length === 0) {
        console.error("No images returned from generate-story-series");
        throw new Error("No images generated");
      }

      console.log(`Processing ${images.length} generated images...`);

      // 保存系列图到数据库（草稿状态）
      for (let i = 0; i < images.length; i++) {
        const { data: page, error: insertError } = await supabase
          .from('coloring_pages')
          .insert({
            title: `${theme} - Chapter ${i + 1}`,
            description: story?.chapters?.[i] || `Part ${i + 1} of ${theme}`,
            image_url: images[i],
            category_id: category.id,
            difficulty,
            series_title: theme,
            series_order: i + 1,
            status: 'draft',
            tags: [category.name, difficulty, 'series', 'auto-generated']
          })
          .select()
          .single();

        if (insertError) {
          console.error(`Error inserting page ${i + 1}:`, insertError);
        } else if (page) {
          console.log(`Successfully saved page ${i + 1}: ${page.title}`);
          generatedPages.push(page);
        }
      }

      console.log(`Generated ${generatedPages.length} series pages as drafts`);

    } else {
      // 生成单图
      const singleResponse = await supabase.functions.invoke('generate-coloring-page', {
        body: {
          category: category.name,
          theme,
          difficulty
        }
      });

      if (singleResponse.error) {
        console.error("Error generating single page:", singleResponse.error);
        throw new Error("Failed to generate single page");
      }

      console.log("Single page response data:", JSON.stringify(singleResponse.data));
      
      const { imageUrl } = singleResponse.data || {};

      if (!imageUrl) {
        console.error("No image URL returned from generate-coloring-page");
        throw new Error("No image generated");
      }

      // 保存单图到数据库（草稿状态）
      const { data: page, error: insertError } = await supabase
        .from('coloring_pages')
        .insert({
          title: theme,
          description: `A ${difficulty} level coloring page about ${theme}`,
          image_url: imageUrl,
          category_id: category.id,
          difficulty,
          status: 'draft',
          tags: [category.name, difficulty, 'single', 'auto-generated']
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting single page:", insertError);
      } else if (page) {
        console.log(`Successfully saved page: ${page.title}`);
        generatedPages.push(page);
      }

      console.log("Generated single page as draft");
    }

    // 记录生成统计
    await supabase
      .from('generation_stats')
      .insert({
        generated_at: new Date().toISOString(),
        category_id: category.id,
        generation_type: generationType,
        difficulty,
        pages_count: generatedPages.length,
        success: true
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${generatedPages.length} draft pages`,
        category: category.name,
        difficulty,
        type: generationType,
        pages: generatedPages.map(p => ({ id: p.id, title: p.title }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in auto-generate-drafts:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
