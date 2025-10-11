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
          connection.id,
          connection.access_token,
          connection.refresh_token,
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
  console.log(`Selecting coloring page for user ${userId}`);
  
  // 获取最近7天内已发布的涂色页ID（缩短窗口期以允许内容复用）
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentPosts } = await supabase
    .from('social_posts')
    .select('coloring_page_id')
    .eq('user_id', userId)
    .eq('platform', 'reddit')
    .eq('status', 'published') // 只排除成功发布的，不排除失败的
    .gte('posted_at', sevenDaysAgo.toISOString());

  const recentPageIds = recentPosts?.map((p: any) => p.coloring_page_id).filter(Boolean) || [];
  console.log(`Found ${recentPageIds.length} recently posted pages`);

  // 查询高质量、未重复的涂色页
  let query = supabase
    .from('coloring_pages')
    .select('id, title, image_url, category_id, description, download_count')
    .eq('status', 'published');

  // 使用正确的Supabase语法排除最近发布的页面
  if (recentPageIds.length > 0) {
    query = query.not('id', 'in', `(${recentPageIds.join(',')})`);
  }

  // 按下载次数排序，如果没有download_count字段则按created_at排序
  const { data: pages, error } = await query
    .order('download_count', { ascending: false, nullsFirst: false })
    .limit(20);

  console.log(`Query result: ${pages?.length || 0} pages found, error:`, error);

  if (error) {
    console.error('Error querying coloring pages:', error);
    
    // 尝试更简单的查询（不排除最近的，不按download_count排序）
    const { data: fallbackPages, error: fallbackError } = await supabase
      .from('coloring_pages')
      .select('id, title, image_url, category_id, description')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log(`Fallback query: ${fallbackPages?.length || 0} pages, error:`, fallbackError);
    
    if (fallbackError || !fallbackPages || fallbackPages.length === 0) {
      return null;
    }
    
    // 从fallback结果中随机选择
    return fallbackPages[Math.floor(Math.random() * fallbackPages.length)];
  }

  if (!pages || pages.length === 0) {
    console.log('No published pages found in database');
    return null;
  }

  // 随机选择一个（从前10个中选）
  const topPages = pages.slice(0, Math.min(10, pages.length));
  const selected = topPages[Math.floor(Math.random() * topPages.length)];
  console.log(`Selected page: ${selected.title} (ID: ${selected.id})`);
  
  return selected;
}

async function generateAIContent(
  apiKey: string,
  page: ColoringPage,
  allowedSubreddits: string[]
): Promise<{ title: string; description: string; subreddit: string }> {
  // 清理 subreddit 名称，移除 r/ 前缀
  const cleanSubreddits = allowedSubreddits.map(s => s.replace(/^r\//, ''));
  
  const prompt = `You are a casual Reddit user sharing cool stuff you found. Write like a REAL person, not a marketer.

Coloring Page: "${page.title}"
${page.description ? `Context: ${page.description}` : ''}

Target subreddits: ${cleanSubreddits.join(', ')}

Generate a Reddit post that sounds like a real person sharing something they're excited about:

TITLE (max 150 chars):
- Sound casual and authentic, like you're talking to friends
- Use Reddit slang occasionally (ngl, tbh, lol, etc.)
- Can include emojis but don't overdo it
- NO marketing language ("perfect for", "ideal", "great gift")
- Examples of good vibes: "This came out way cooler than expected", "Found this gem today", "Pretty happy with how this turned out"

DESCRIPTION (2-3 sentences):
- Write like you're genuinely sharing, not selling
- Use casual language: "kinda", "pretty", "honestly", "actually"
- Can mention it's free but make it sound natural ("it's free btw" or "didn't cost anything")
- NO phrases like: "perfect for all ages", "completely free to download", "hope you enjoy"
- Share it like you found something cool and want others to see it
- Add personality: "turned out better than I thought", "spent way too long on this lol", "this was actually fun"

SUBREDDIT:
- Pick the most relevant one from: ${cleanSubreddits.join(', ')}
- Return just the name, NO 'r/' prefix

Respond ONLY with valid JSON (no markdown):
{
  "title": "your casual title here",
  "description": "your genuine-sounding description here",
  "subreddit": "subreddit_name"
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
        { role: 'system', content: 'You are a casual Reddit user sharing cool finds. Write like a real person, not an AI or marketer. Use natural language, occasional slang, and genuine enthusiasm. Always respond with valid JSON only, no markdown formatting. Never use r/ prefix in subreddit names.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('AI API error:', response.status, text);
    
    // 降级方案：使用简单模板
    return {
      title: `Found this ${page.title} coloring page, turned out pretty cool`,
      description: `Honestly wasn't expecting much but this came out nice. Free to grab if anyone wants it 🎨`,
      subreddit: cleanSubreddits[0] || 'test'
    };
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    // 尝试解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 确保清理返回的 subreddit 名称
      const cleanedSubreddit = (parsed.subreddit || cleanSubreddits[0] || 'test').replace(/^r\//, '');
      return {
        title: parsed.title || `Check out this ${page.title} coloring page!`,
        description: parsed.description || `Beautiful coloring page available for free download! 🎨`,
        subreddit: cleanedSubreddit
      };
    }
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
  }

  // 如果解析失败，返回默认值
  return {
    title: `${page.title} - came out better than expected ngl`,
    description: `Spent some time on this and honestly pretty happy with it. It's free btw if anyone's interested 🎨`,
    subreddit: cleanSubreddits[0] || 'test'
  };
}

async function refreshRedditToken(
  supabase: any,
  connectionId: string,
  refreshToken: string
): Promise<string | null> {
  const redditClientId = Deno.env.get('REDDIT_CLIENT_ID')!;
  const redditClientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')!;

  try {
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${redditClientId}:${redditClientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ColorMinds/1.0'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      console.error('Failed to refresh Reddit token:', response.status);
      return null;
    }

    const data = await response.json();
    const newAccessToken = data.access_token;

    // 更新数据库中的 access token
    await supabase
      .from('social_media_connections')
      .update({ access_token: newAccessToken })
      .eq('id', connectionId);

    console.log('Successfully refreshed Reddit token');
    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing Reddit token:', error);
    return null;
  }
}

async function postToReddit(
  supabase: any,
  connectionId: string,
  redditAccessToken: string,
  refreshToken: string,
  subreddit: string,
  title: string,
  text: string,
  imageUrl: string,
  userId: string,
  coloringPageId: string
): Promise<{ postUrl: string; postId: string }> {
  // 确保 subreddit 不带 r/ 前缀
  const cleanSubreddit = subreddit.replace(/^r\//, '');
  
  console.log(`Posting to Reddit - subreddit: ${cleanSubreddit}, title: ${title}`);
  
  // 尝试发布的函数
  const attemptPost = async (accessToken: string) => {
    const uploadResponse = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ColorMinds/1.0'
      },
      body: new URLSearchParams({
        sr: cleanSubreddit,
        kind: 'link',
        title: title,
        url: imageUrl,
        resubmit: 'true',
        sendreplies: 'false'
      })
    });

    const contentType = uploadResponse.headers.get('content-type');
    
    // 检查是否返回了 HTML（表示 token 过期）
    if (contentType?.includes('text/html')) {
      console.log('Reddit returned HTML, token likely expired');
      return { expired: true, data: null };
    }

    const responseData = await uploadResponse.json();
    console.log('Reddit API response:', JSON.stringify(responseData, null, 2));
    
    return { expired: false, data: responseData, ok: uploadResponse.ok };
  };

  // 使用 Reddit API 直接发布
  try {
    let result = await attemptPost(redditAccessToken);
    
    // 如果 token 过期，尝试刷新
    if (result.expired) {
      console.log('Attempting to refresh Reddit token...');
      const newToken = await refreshRedditToken(supabase, connectionId, refreshToken);
      
      if (!newToken) {
        throw new Error('Failed to refresh Reddit access token');
      }
      
      // 用新 token 重试
      result = await attemptPost(newToken);
    }
    
    if (!result.ok) {
      throw new Error(`Reddit API error: ${JSON.stringify(result.data)}`);
    }
    
    const responseData = result.data;
    
    // 检查 Reddit API 响应中的错误
    if (responseData.json?.errors?.length > 0) {
      throw new Error(`Reddit API error: ${JSON.stringify(responseData.json.errors)}`);
    }
    
    // 获取真实的帖子 URL 和 ID
    const realPostUrl = responseData.json?.data?.url;
    const realPostId = responseData.json?.data?.name;
    
    if (!realPostUrl || !realPostId) {
      console.warn('Reddit did not return expected data, using fallback');
    }
    
    const postId = realPostId || `reddit_${Date.now()}`;
    const postUrl = realPostUrl || `https://reddit.com/r/${cleanSubreddit}`;

    console.log(`✅ Posted to Reddit successfully: ${postUrl}`);

    // 记录到数据库
    const { error: insertError } = await supabase
      .from('social_posts')
      .insert({
        user_id: userId,
        coloring_page_id: coloringPageId,
        platform: 'reddit',
        post_id: postId,
        post_url: postUrl,
        title: title,
        description: text,
        image_url: imageUrl,
        subreddit: cleanSubreddit,
        ai_generated: true,
        status: 'published',
        posted_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error inserting social post:', insertError);
      throw insertError;
    }

    return { postUrl, postId };
  } catch (error) {
    console.error('Error posting to Reddit:', error);
    
    // 记录失败到数据库
    await supabase
      .from('social_posts')
      .insert({
        user_id: userId,
        coloring_page_id: coloringPageId,
        platform: 'reddit',
        post_id: `failed_${Date.now()}`,
        title: title,
        description: text,
        image_url: imageUrl,
        subreddit: cleanSubreddit,
        ai_generated: true,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        posted_at: new Date().toISOString()
      });
    
    throw error;
  }
}
