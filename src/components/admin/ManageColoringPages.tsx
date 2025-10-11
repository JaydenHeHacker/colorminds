import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Edit, Trash2, Star, StarOff, Loader2, FolderTree, Gauge, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

type SortField = 'created_at' | 'published_at' | 'updated_at' | 'title' | 'download_count';
type SortOrder = 'asc' | 'desc';

export default function ManageColoringPages() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editingPage, setEditingPage] = useState<any>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showBatchCategoryDialog, setShowBatchCategoryDialog] = useState(false);
  const [showBatchDifficultyDialog, setShowBatchDifficultyDialog] = useState(false);
  const [batchCategory, setBatchCategory] = useState<string>("");
  const [batchDifficulty, setBatchDifficulty] = useState<string>("");

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('level', 2)  // 获取level 2的实际内容分类
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // 简化分类标签显示，不展示图标
  const getCategoryLabel = (cat: any) => {
    return cat.name;
  };

  // 查询总数
  const { data: totalCount } = useQuery({
    queryKey: ['admin-coloring-pages-count', searchQuery, selectedCategory, selectedDifficulty, selectedStatus, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from('coloring_pages')
        .select('*', { count: 'exact', head: true });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,series_title.ilike.%${searchQuery}%`);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty as 'easy' | 'medium' | 'hard');
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
  });

  // 分页查询数据
  const { data: coloringPages, isLoading } = useQuery({
    queryKey: ['admin-coloring-pages', currentPage, searchQuery, selectedCategory, selectedDifficulty, selectedStatus, sortField, sortOrder],
    queryFn: async () => {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order(sortField, { ascending: sortOrder === 'asc', nullsFirst: false })
        .range(from, to);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,series_title.ilike.%${searchQuery}%`);
      }
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }
      if (selectedDifficulty) {
        query = query.eq('difficulty', selectedDifficulty as 'easy' | 'medium' | 'hard');
      }
      if (selectedStatus) {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('coloring_pages')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success("更新成功！");
    },
    onError: (error: Error) => {
      toast.error("更新失败：" + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coloring_pages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success("删除成功！");
      setDeletingPageId(null);
    },
    onError: (error: Error) => {
      toast.error("删除失败：" + error.message);
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('coloring_pages')
        .delete()
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success(`成功删除 ${selectedPages.size} 个项目！`);
      setSelectedPages(new Set());
    },
    onError: (error: Error) => {
      toast.error("批量删除失败：" + error.message);
    },
  });

  const batchFeatureMutation = useMutation({
    mutationFn: async ({ ids, featured }: { ids: string[]; featured: boolean }) => {
      const { error } = await supabase
        .from('coloring_pages')
        .update({ is_featured: featured })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: (_, { featured }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success(`成功${featured ? '设置' : '取消'}精选 ${selectedPages.size} 个项目！`);
      setSelectedPages(new Set());
    },
    onError: (error: Error) => {
      toast.error("批量操作失败：" + error.message);
    },
  });

  const batchUpdateCategoryMutation = useMutation({
    mutationFn: async ({ ids, categoryId }: { ids: string[]; categoryId: string }) => {
      const { error } = await supabase
        .from('coloring_pages')
        .update({ category_id: categoryId })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success(`成功修改 ${selectedPages.size} 个项目的分类！`);
      setSelectedPages(new Set());
      setShowBatchCategoryDialog(false);
      setBatchCategory("");
    },
    onError: (error: Error) => {
      toast.error("批量修改失败：" + error.message);
    },
  });

  const batchUpdateDifficultyMutation = useMutation({
    mutationFn: async ({ ids, difficulty }: { ids: string[]; difficulty: 'easy' | 'medium' | 'hard' }) => {
      const { error } = await supabase
        .from('coloring_pages')
        .update({ difficulty })
        .in('id', ids);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coloring-pages'] });
      queryClient.invalidateQueries({ queryKey: ['coloring-pages'] });
      toast.success(`成功修改 ${selectedPages.size} 个项目的难度！`);
      setSelectedPages(new Set());
      setShowBatchDifficultyDialog(false);
      setBatchDifficulty("");
    },
    onError: (error: Error) => {
      toast.error("批量修改失败：" + error.message);
    },
  });

  // 服务端分页，直接使用查询结果
  const totalPages = Math.ceil((totalCount || 0) / itemsPerPage);
  const paginatedPages = coloringPages;

  // 当筛选条件改变时重置页码
  const resetPagination = () => setCurrentPage(1);

  const handleToggleSelect = (pageId: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageId)) {
      newSelected.delete(pageId);
    } else {
      newSelected.add(pageId);
    }
    setSelectedPages(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPages.size === paginatedPages?.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(paginatedPages?.map(p => p.id) || []));
    }
  };

  const handleToggleFeatured = async (page: any) => {
    await updateMutation.mutateAsync({
      id: page.id,
      updates: { is_featured: !page.is_featured }
    });
  };

  const handleEditPage = (page: any) => {
    setEditingPage(page);
    setEditTitle(page.title);
    setEditDescription(page.description || "");
  };

  const handleSaveEdit = async () => {
    if (!editingPage) return;
    
    await updateMutation.mutateAsync({
      id: editingPage.id,
      updates: {
        title: editTitle,
        description: editDescription || null
      }
    });
    
    setEditingPage(null);
  };

  const handleBatchDelete = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要删除的项目");
      return;
    }
    batchDeleteMutation.mutate(Array.from(selectedPages));
  };

  const handleBatchFeature = (featured: boolean) => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }
    batchFeatureMutation.mutate({ ids: Array.from(selectedPages), featured });
  };

  const handleBatchUpdateCategory = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }
    if (!batchCategory) {
      toast.error("请选择分类");
      return;
    }
    batchUpdateCategoryMutation.mutate({ ids: Array.from(selectedPages), categoryId: batchCategory });
  };

  const handleBatchUpdateDifficulty = () => {
    if (selectedPages.size === 0) {
      toast.error("请先选择要操作的项目");
      return;
    }
    if (!batchDifficulty) {
      toast.error("请选择难度");
      return;
    }
    batchUpdateDifficultyMutation.mutate({ 
      ids: Array.from(selectedPages), 
      difficulty: batchDifficulty as 'easy' | 'medium' | 'hard'
    });
  };

  const difficultyConfig = {
    easy: { label: "简单", icon: "🟢" },
    medium: { label: "中等", icon: "🟡" },
    hard: { label: "困难", icon: "🔴" }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="md:col-span-2">
              <Label>搜索</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索标题、描述或系列..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    resetPagination();
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label>分类</Label>
              <Select 
                value={selectedCategory || "all"} 
                onValueChange={(v) => {
                  setSelectedCategory(v === "all" ? null : v);
                  resetPagination();
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="全部分类" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[300px]">
                  <SelectItem value="all">全部分类</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {getCategoryLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>难度</Label>
              <Select 
                value={selectedDifficulty || "all"} 
                onValueChange={(v) => {
                  setSelectedDifficulty(v === "all" ? null : v);
                  resetPagination();
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="全部难度" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">全部难度</SelectItem>
                  <SelectItem value="easy">🟢 简单</SelectItem>
                  <SelectItem value="medium">🟡 中等</SelectItem>
                  <SelectItem value="hard">🔴 困难</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>状态</Label>
              <Select 
                value={selectedStatus || "all"} 
                onValueChange={(v) => {
                  setSelectedStatus(v === "all" ? null : v);
                  resetPagination();
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="全部状态" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="draft">📝 草稿</SelectItem>
                  <SelectItem value="published">✅ 已发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>排序字段</Label>
              <Select 
                value={sortField} 
                onValueChange={(v) => {
                  setSortField(v as SortField);
                  resetPagination();
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="created_at">创建时间</SelectItem>
                  <SelectItem value="published_at">发布时间</SelectItem>
                  <SelectItem value="updated_at">更新时间</SelectItem>
                  <SelectItem value="title">标题</SelectItem>
                  <SelectItem value="download_count">下载次数</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>排序方向</Label>
              <Select 
                value={sortOrder} 
                onValueChange={(v) => {
                  setSortOrder(v as SortOrder);
                  resetPagination();
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="desc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      降序
                    </div>
                  </SelectItem>
                  <SelectItem value="asc">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      升序
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Batch Actions */}
      {selectedPages.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              已选择 {selectedPages.size} 个项目
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchFeature(true)}
                disabled={batchFeatureMutation.isPending}
              >
                <Star className="h-4 w-4 mr-1" />
                批量精选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBatchFeature(false)}
                disabled={batchFeatureMutation.isPending}
              >
                <StarOff className="h-4 w-4 mr-1" />
                取消精选
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchCategoryDialog(true)}
              >
                <FolderTree className="h-4 w-4 mr-1" />
                修改分类
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBatchDifficultyDialog(true)}
              >
                <Gauge className="h-4 w-4 mr-1" />
                修改难度
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                批量删除
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 {totalCount || 0} 个涂色页，当前第 {currentPage}/{totalPages} 页
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedPages.size === paginatedPages?.length ? "取消全选" : "全选当前页"}
        </Button>
      </div>

      {/* Pages List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : paginatedPages && paginatedPages.length > 0 ? (
        <>
          <div className="grid gap-4">
            {paginatedPages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex gap-4">
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedPages.has(page.id)}
                    onCheckedChange={() => handleToggleSelect(page.id)}
                  />
                </div>
                
                <div className="w-24 h-24 rounded-lg overflow-hidden border-2 bg-white flex-shrink-0">
                  <img
                    src={page.image_url}
                    alt={page.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{page.title}</h3>
                      {page.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {page.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFeatured(page)}
                        disabled={updateMutation.isPending}
                        title={page.is_featured ? "取消精选" : "设为精选"}
                      >
                        {page.is_featured ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditPage(page)}
                        title="编辑"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingPageId(page.id)}
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full ${
                        page.status === 'draft' 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      }`}>
                        {page.status === 'draft' ? '📝 草稿' : '✅ 已发布'}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {page.categories?.name || '未分类'}
                      </span>
                      {page.difficulty && (
                        <span className="px-2 py-1 rounded-full bg-muted">
                          {difficultyConfig[page.difficulty as keyof typeof difficultyConfig]?.icon}{' '}
                          {difficultyConfig[page.difficulty as keyof typeof difficultyConfig]?.label}
                        </span>
                      )}
                      {page.series_title && (
                        <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          📚 {page.series_title} ({page.series_order}/{page.series_total})
                        </span>
                      )}
                      <span className="px-2 py-1 rounded-full bg-muted">
                        下载: {page.download_count}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>
                        创建：{format(new Date(page.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                      </span>
                      {page.published_at && (
                        <span className="text-green-600 dark:text-green-400">
                          发布：{format(new Date(page.published_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      )}
                      {page.updated_at && page.updated_at !== page.created_at && (
                        <span>
                          更新：{format(new Date(page.updated_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              首页
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              上一页
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">第</span>
              <Input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    setCurrentPage(page);
                  }
                }}
                className="w-20 text-center"
              />
              <span className="text-sm text-muted-foreground">/ {totalPages} 页</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              下一页
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              末页
            </Button>
          </div>
        )}
      </>
      ) : (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">
            没有找到符合条件的涂色页
          </p>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑涂色页</DialogTitle>
            <DialogDescription>
              修改标题和描述信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">描述（可选）</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                "保存"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPageId} onOpenChange={(open) => !open && setDeletingPageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作无法撤销。确定要删除这个涂色页吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPageId && deleteMutation.mutate(deletingPageId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                "删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Category Dialog */}
      <Dialog open={showBatchCategoryDialog} onOpenChange={setShowBatchCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量修改分类</DialogTitle>
            <DialogDescription>
              为选中的 {selectedPages.size} 个项目修改分类
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="batch-category">选择分类</Label>
            <Select value={batchCategory} onValueChange={setBatchCategory}>
              <SelectTrigger id="batch-category">
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchCategoryDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleBatchUpdateCategory} 
              disabled={batchUpdateCategoryMutation.isPending || !batchCategory}
            >
              {batchUpdateCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "确认修改"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Difficulty Dialog */}
      <Dialog open={showBatchDifficultyDialog} onOpenChange={setShowBatchDifficultyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量修改难度</DialogTitle>
            <DialogDescription>
              为选中的 {selectedPages.size} 个项目修改难度
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="batch-difficulty">选择难度</Label>
            <Select value={batchDifficulty} onValueChange={setBatchDifficulty}>
              <SelectTrigger id="batch-difficulty">
                <SelectValue placeholder="选择难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">🟢 简单</SelectItem>
                <SelectItem value="medium">🟡 中等</SelectItem>
                <SelectItem value="hard">🔴 困难</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDifficultyDialog(false)}>
              取消
            </Button>
            <Button 
              onClick={handleBatchUpdateDifficulty} 
              disabled={batchUpdateDifficultyMutation.isPending || !batchDifficulty}
            >
              {batchUpdateDifficultyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                "确认修改"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
