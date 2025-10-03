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
import { Search, Edit, Trash2, Star, StarOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ManageColoringPages() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());
  const [editingPage, setEditingPage] = useState<any>(null);
  const [deletingPageId, setDeletingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: coloringPages, isLoading } = useQuery({
    queryKey: ['admin-coloring-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coloring_pages')
        .select(`
          *,
          categories (
            id,
            name,
            slug
          )
        `)
        .order('created_at', { ascending: false });
      
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

  const filteredPages = coloringPages?.filter(page => {
    const matchesSearch = !searchQuery || 
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.series_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || page.category_id === selectedCategory;
    const matchesDifficulty = !selectedDifficulty || page.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

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
    if (selectedPages.size === filteredPages?.length) {
      setSelectedPages(new Set());
    } else {
      setSelectedPages(new Set(filteredPages?.map(p => p.id) || []));
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

  const difficultyConfig = {
    easy: { label: "简单", icon: "🟢" },
    medium: { label: "中等", icon: "🟡" },
    hard: { label: "困难", icon: "🔴" }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2">
            <Label>搜索</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标题、描述或系列..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div>
            <Label>分类</Label>
            <Select value={selectedCategory || "all"} onValueChange={(v) => setSelectedCategory(v === "all" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="全部分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分类</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>难度</Label>
            <Select value={selectedDifficulty || "all"} onValueChange={(v) => setSelectedDifficulty(v === "all" ? null : v)}>
              <SelectTrigger>
                <SelectValue placeholder="全部难度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部难度</SelectItem>
                <SelectItem value="easy">🟢 简单</SelectItem>
                <SelectItem value="medium">🟡 中等</SelectItem>
                <SelectItem value="hard">🔴 困难</SelectItem>
              </SelectContent>
            </Select>
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
            <div className="flex gap-2">
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
          共 {filteredPages?.length || 0} 个涂色页
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedPages.size === filteredPages?.length ? "取消全选" : "全选"}
        </Button>
      </div>

      {/* Pages List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : filteredPages && filteredPages.length > 0 ? (
        <div className="grid gap-4">
          {filteredPages.map((page) => (
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
                  
                  <div className="flex flex-wrap gap-2 text-xs">
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
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                        📚 {page.series_title} ({page.series_order}/{page.series_total})
                      </span>
                    )}
                    <span className="px-2 py-1 rounded-full bg-muted">
                      下载: {page.download_count}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
    </div>
  );
}
