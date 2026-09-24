"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Trash2, AlertCircle, Plus, Calendar, FileEdit, Star, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";

interface RawArticle {
  id: string;
  title: string;
  slug: string;
  categories?: { name: string } | null;
  status?: string | null;
  view_count?: number | null;
  created_at?: string | null;
  is_featured?: boolean | null;
}

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  author_title?: string;
  category: string;
  status: string;
  views: number;
  date: string;
  is_featured: boolean;
}

export default function EditorArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let articlesData = null;
      let { data, error } = await supabase
        .from("articles")
        .select("*, categories(name), author:profiles!author_id(full_name)")
        .or(`author_id.eq.${user.id},publisher_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error && (error.message?.includes("publisher_id") || (error as any).code === "42703")) {
        // Fallback for pre-migration schema: filter by author_id
        const fallback = await supabase
          .from("articles")
          .select("*, categories(name), author:profiles!author_id(full_name)")
          .eq("author_id", user.id)
          .order("created_at", { ascending: false });
        data = fallback.data;
        error = fallback.error;
      }

      if (error) throw error;
      articlesData = data;

      if (articlesData) {
        const mapped = articlesData.map((art: any) => ({
          id: art.id,
          title: art.title,
          slug: art.slug,
          author: art.author_name ? art.author_name : (art.author?.full_name || "You"),
          author_title: art.author_title || (art.author_name ? "Guest" : undefined),
          category: art.categories?.name || "Uncategorized",
          status: art.status || "draft",
          views: art.view_count || 0,
          date: art.created_at ? new Date(art.created_at).toLocaleDateString() : "N/A",
          is_featured: art.is_featured || false,
        }));
        setArticles(mapped);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load articles";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        fetchArticles();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mounted, fetchArticles]);

  // Compute filtered articles dynamically on render to prevent cascading renders
  const filteredArticles = articles.filter(art => {
    const matchesSearch = searchQuery.trim() === "" || 
      (art.title || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || art.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (articleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ status: newStatus })
        .eq("id", articleId);

      if (error) throw error;

      toast.success(`Article submitted for review!`);
      fetchArticles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update article status";
      toast.error(errorMessage);
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;

      toast.success("Article deleted successfully!");
      fetchArticles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete article";
      toast.error(errorMessage);
    }
  };

  const handleToggleFeatured = async (articleId: string, currentFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from("articles")
        .update({ is_featured: !currentFeatured })
        .eq("id", articleId);

      if (error) throw error;

      toast.success(currentFeatured ? "Article removed from featured stories!" : "Article added to featured stories!");
      fetchArticles();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update featured status";
      toast.error(errorMessage);
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">My Articles</h1>
          <p className="text-gray-500">Draft, edit, and track status of all your submissions</p>
        </div>
        <Button asChild className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold">
          <Link href="/dashboard/editor/articles/new">
            <Plus className="mr-2 h-4 w-4" /> Create Article
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search by title..."
          className="max-w-md bg-white border border-gray-200"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest text-[10px]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg p-2 text-sm font-medium focus:ring-2 focus:ring-upsa-navy/20 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableShadowLoader rows={6} hasSearch={false} />
          </div>
        ) : filteredArticles.length > 0 ? (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-bold text-upsa-navy">Article Title</TableHead>
                <TableHead className="font-bold text-upsa-navy">Author</TableHead>
                <TableHead className="font-bold text-upsa-navy">Category</TableHead>
                <TableHead className="font-bold text-upsa-navy">Views</TableHead>
                <TableHead className="font-bold text-upsa-navy text-center">Featured</TableHead>
                <TableHead className="font-bold text-upsa-navy">Status</TableHead>
                <TableHead className="font-bold text-upsa-navy">Created</TableHead>
                <TableHead className="text-right font-bold text-upsa-navy">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArticles.map((art) => (
                <TableRow key={art.id} className="hover:bg-gray-50/50 transition-colors">
                  <TableCell className="font-semibold text-upsa-navy max-w-xs truncate">
                    {art.status === "published" ? (
                      <Link href={`/articles/${art.slug}`} className="hover:text-upsa-gold transition-colors">
                        {art.title}
                      </Link>
                    ) : (
                      <span className="text-upsa-navy">{art.title}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-700">
                    <div>
                      <span>{art.author}</span>
                      {art.author_title && (
                        <span className="block text-[10px] text-gray-400 font-normal">{art.author_title}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">{art.category}</TableCell>
                  <TableCell className="text-sm font-bold text-gray-600">{art.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleToggleFeatured(art.id, art.is_featured)}
                      className="mx-auto block p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none"
                      title={art.is_featured ? "Remove from featured" : "Mark as featured"}
                    >
                      <Star className={cn("h-5 w-5 transition-transform hover:scale-110", art.is_featured ? "fill-upsa-gold text-upsa-gold" : "text-gray-300")} />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={cn(
                        "capitalize font-bold text-[10px] tracking-widest",
                        art.status === "published" ? "bg-emerald-500 text-white" :
                        art.status === "review" ? "bg-amber-500 text-white" :
                        art.status === "draft" ? "bg-gray-400 text-white" :
                        "bg-red-500 text-white"
                      )}
                    >
                      {art.status === "review" ? "in review" : art.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-2 text-gray-400" />
                      {art.date}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Article Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/dashboard/editor/articles/edit/${art.id}`}>
                            <FileEdit className="mr-2 h-4 w-4 text-emerald-500" /> Edit Article
                          </Link>
                        </DropdownMenuItem>
                        
                        {art.status === "published" && (
                          <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={`/articles/${art.slug}`} target="_blank">
                              <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Live Article
                            </Link>
                          </DropdownMenuItem>
                        )}
                        
                        {art.status === "draft" && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleUpdateStatus(art.id, "review")}
                          >
                            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Submit for Review
                          </DropdownMenuItem>
                        )}
                        
                        {art.status === "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer text-amber-600 focus:text-amber-600 focus:bg-amber-50"
                            onClick={() => handleUpdateStatus(art.id, "draft")}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Revert to Draft
                          </DropdownMenuItem>
                        )}

                        {art.status === "draft" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                              onClick={() => handleDeleteArticle(art.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Article
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-20 text-center text-gray-500 italic">You have no articles matching this filter.</div>
        )}
      </div>
    </div>
  );
}
