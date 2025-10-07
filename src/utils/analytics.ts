// Google Analytics 事件追踪工具函数

declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      eventParams?: Record<string, any>
    ) => void;
  }
}

// 检查 GA 是否已加载
const isGALoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// 打印/下载事件
export const trackPrint = (params: {
  pageTitle: string;
  category: string;
  difficulty: string;
  seriesName?: string | null;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'print_coloring_page', {
    page_title: params.pageTitle,
    category: params.category,
    difficulty: params.difficulty,
    series_name: params.seriesName || 'none',
    event_category: 'engagement',
    event_label: params.pageTitle,
  });
};

// 搜索事件
export const trackSearch = (params: {
  searchTerm: string;
  resultsCount: number;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'search', {
    search_term: params.searchTerm,
    results_count: params.resultsCount,
    event_category: 'search',
  });
};

// 收藏事件
export const trackFavorite = (params: {
  action: 'add' | 'remove';
  pageId: string;
  pageTitle: string;
  category: string;
}) => {
  if (!isGALoaded()) return;
  
  const eventName = params.action === 'add' ? 'add_to_favorites' : 'remove_from_favorites';
  
  window.gtag!('event', eventName, {
    page_id: params.pageId,
    page_title: params.pageTitle,
    category: params.category,
    event_category: 'engagement',
    event_label: params.pageTitle,
  });
};

// 打印篮事件
export const trackBasket = (params: {
  action: 'add' | 'remove';
  itemName: string;
  basketSize: number;
}) => {
  if (!isGALoaded()) return;
  
  const eventName = params.action === 'add' ? 'add_to_basket' : 'remove_from_basket';
  
  window.gtag!('event', eventName, {
    item_name: params.itemName,
    basket_size: params.basketSize,
    event_category: 'engagement',
    event_label: params.itemName,
  });
};

// AI 灵感功能
export const trackAIInspiration = (params: {
  pageTitle: string;
  category: string;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'use_ai_inspiration', {
    page_title: params.pageTitle,
    category: params.category,
    event_category: 'ai_feature',
    event_label: params.pageTitle,
  });
};

// 在线涂色功能
export const trackOnlineColoring = (params: {
  pageTitle: string;
  category: string;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'use_online_coloring', {
    page_title: params.pageTitle,
    category: params.category,
    event_category: 'ai_feature',
    event_label: params.pageTitle,
  });
};

// 分类浏览
export const trackCategoryView = (params: {
  categoryName: string;
  itemsCount: number;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'view_category', {
    category_name: params.categoryName,
    items_count: params.itemsCount,
    event_category: 'navigation',
    event_label: params.categoryName,
  });
};

// 系列故事查看
export const trackSeriesView = (params: {
  seriesName: string;
  chapterNumber?: number;
  totalChapters?: number;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'view_series', {
    series_name: params.seriesName,
    chapter_number: params.chapterNumber || 0,
    total_chapters: params.totalChapters || 0,
    event_category: 'navigation',
    event_label: params.seriesName,
  });
};

// 分享事件
export const trackShare = (params: {
  method: 'copy_link' | 'pinterest' | 'facebook' | 'twitter';
  contentType: 'coloring_page' | 'series';
  itemId: string;
  itemTitle: string;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'share', {
    method: params.method,
    content_type: params.contentType,
    item_id: params.itemId,
    item_title: params.itemTitle,
    event_category: 'social',
    event_label: `${params.method}_${params.itemTitle}`,
  });
};

// 页面预览
export const trackPreview = (params: {
  pageTitle: string;
  category: string;
}) => {
  if (!isGALoaded()) return;
  
  window.gtag!('event', 'preview_coloring_page', {
    page_title: params.pageTitle,
    category: params.category,
    event_category: 'engagement',
    event_label: params.pageTitle,
  });
};
