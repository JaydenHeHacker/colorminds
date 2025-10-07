import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RedditConfig {
  id: string;
  user_id: string;
  is_enabled: boolean;
  posts_per_day: number;
  hours_between_posts: number;
  allowed_subreddits: string[];
  last_post_at: string | null;
}

interface ColoringPage {
  id: string;
  title: string;
  image_url: string;
  category_id: string;
  description: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🤖 Starting auto-post-reddit job...');

    // 获取所有启用自动发布的用户配置
    const { data: configs, error: configError } = await supabase
      .from('reddit_auto_config')
      .select('*')
      .eq('is_enabled', true);

    if (configError) {
      console.error('Error fetching configs:', configError);
      throw configError;
    }

    if (!configs || configs.length === 0) {
      console.log('No enabled auto-post configs found');
      return new Response(
        JSON.stringify({ message: 'No active configs' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${configs.length} enabled config(s)`);

    const results = [];

    for (const config of configs as RedditConfig[]) {
      try {
        // 检查是否应该发布
        if (!shouldPost(config)) {
          console.log(`User ${config.user_id}: Too soon to post`);
          results.push({ user_id: config.user_id, status: 'skipped', reason: 'too_soon' });
          continue;
        }

        // 获取 Reddit 连接
        const { data: connection } = await supabase
          .from('social_media_connections')
          .select('*')
          .eq('user_id', config.user_id)
          .eq('platform', 'reddit')
          .eq('is_active', true)
          .single();

        if (!connection) {
          console.log(`User ${config.user_id}: No Reddit connection`);
          results.push({ user_id: config.user_id, status: 'skipped', reason: 'no_connection' });
          continue;
        }

        // 智能选择涂色页
        const coloringPage = await selectBestColoringPage(supabase, config.user_id);
        
        if (!coloringPage) {
          console.log(`User ${config.user_id}: No suitable coloring page found`);
          results.push({ user_id: config.user_id, status: 'skipped', reason: 'no_content' });
          continue;
        }

        console.log(`Selected coloring page: ${coloringPage.title}`);

        // 使用 AI 生成标题和选择 subreddit
        const aiContent = await generateAIContent(lovableApiKey, coloringPage, config.allowed_subreddits);
        
        console.log(`AI generated content for subreddit: r/${aiContent.subreddit}`);

        // 发布到 Reddit
        const postResult = await postToReddit(
          supabase,
          connection.access_token,
          aiContent.subreddit,
          aiContent.title,
          aiContent.description,
          coloringPage.image_url,
          config.user_id,
          coloringPage.id
        );

        // 更新配置的最后发布时间
        await supabase
          .from('reddit_auto_config')
          .update({ last_post_at: new Date().toISOString() })
          .eq('id', config.id);

        console.log(`✅ Successfully posted for user ${config.user_id}`);
        results.push({ 
          user_id: config.user_id, 
          status: 'success',
          post_url: postResult.postUrl,
          subreddit: aiContent.subreddit
        });

      } catch (error) {
        console.error(`Error processing user ${config.user_id}:`, error);
        results.push({ 
          user_id: config.user_id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Auto-post job completed',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Fatal error in auto-post-reddit:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function shouldPost(config: RedditConfig): boolean {
  if (!config.last_post_at) {
    return true; // 首次发布
  }

  const lastPost = new Date(config.last_post_at);
  const now = new Date();
  const hoursSinceLastPost = (now.getTime() - lastPost.getTime()) / (1000 * 60 * 60);

  return hoursSinceLastPost >= config.hours_between_posts;
}

async function selectBestColoringPage(
  supabase: any,
  userId: string
): Promise<ColoringPage | null> {
  // 获取最近30天内已发布的涂色页ID
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentPosts } = await supabase
    .from('social_posts')
    .select('coloring_page_id')
    .eq('user_id', userId)
    .eq('platform', 'reddit')
    .gte('posted_at', thirtyDaysAgo.toISOString());

  const recentPageIds = recentPosts?.map((p: any) => p.coloring_page_id).filter(Boolean) || [];

  // 查询高质量、未重复的涂色页
  let query = supabase
    .from('coloring_pages')
    .select('id, title, image_url, category_id, description')
    .eq('status', 'published')
    .order('download_count', { ascending: false })
    .limit(10);

  if (recentPageIds.length > 0) {
    query = query.not('id', 'in', `(${recentPageIds.join(',')})`);
  }

  const { data: pages, error } = await query;

  if (error || !pages || pages.length === 0) {
    return null;
  }

  // 随机选择一个（从前5个中选）
  const topPages = pages.slice(0, Math.min(5, pages.length));
  return topPages[Math.floor(Math.random() * topPages.length)];
}

async function generateAIContent(
  apiKey: string,
  page: ColoringPage,
  allowedSubreddits: string[]
): Promise<{ title: string; description: string; subreddit: string }> {
  const prompt = `You are a Reddit marketing expert for a coloring page website.

Coloring Page: "${page.title}"
${page.description ? `Description: ${page.description}` : ''}

Allowed subreddits: ${allowedSubreddits.map(s => `r/${s}`).join(', ')}

Generate:
1. A catchy, natural Reddit post title (max 150 chars)
2. A friendly description text (2-3 sentences, mention it's free to download)
3. Choose the BEST subreddit from the allowed list

Rules:
- Title should NOT sound like an ad
- Be authentic and engaging
- Choose subreddit based on content relevance
- Description should invite engagement

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "subreddit": "..."
}`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a helpful AI that generates Reddit marketing content. Always respond in valid JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('AI API error:', response.status, text);
    
    // 降级方案：使用简单模板
    return {
      title: `Check out this ${page.title} coloring page!`,
      description: `I found this beautiful coloring page and wanted to share it with the community. It's free to download and perfect for relaxation! 🎨`,
      subreddit: allowedSubreddits[0] || 'test'
    };
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        title: parsed.title || `Check out this ${page.title} coloring page!`,
        description: parsed.description || `Beautiful coloring page available for free download! 🎨`,
        subreddit: parsed.subreddit || allowedSubreddits[0] || 'test'
      };
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
  }

  // 如果解析失败，返回默认值
  return {
    title: `Check out this ${page.title} coloring page!`,
    description: `I found this beautiful coloring page and wanted to share it. Free to download! 🎨`,
    subreddit: allowedSubreddits[0] || 'test'
  };
}

async function postToReddit(
  supabase: any,
  accessToken: string,
  subreddit: string,
  title: string,
  text: string,
  imageUrl: string,
  userId: string,
  coloringPageId: string
): Promise<{ postUrl: string; postId: string }> {
  // 调用 post-to-reddit edge function
  const { data, error } = await supabase.functions.invoke('post-to-reddit', {
    body: {
      subreddit: subreddit,
      title: title,
      text: text,
      imageUrl: imageUrl,
      coloringPageId: coloringPageId
    },
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (error) {
    console.error('Error posting to Reddit:', error);
    throw error;
  }

  // 更新 social_posts 记录
  await supabase
    .from('social_posts')
    .update({
      subreddit: subreddit,
      ai_generated: true
    })
    .eq('post_id', data.postId)
    .eq('user_id', userId);

  return data;
}
