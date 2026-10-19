"use client";

import { useEffect, useState } from "react";
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
import { MoreHorizontal, Eye, Trash2, CheckCircle2, AlertCircle, FileEdit, Archive, Plus, Star, RotateCcw, AlertTriangle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";

interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  author: string;
  author_title?: string;
  publisher: string;
  category: string;
  status: string;
  views: number;
  date: string;
  is_featured: boolean;
  excerpt?: string;
  cover_image_url?: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<ArticleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [articleToDelete, setArticleToDelete] = useState<ArticleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const supabase = createClient();

  const fetchArticles = async () => {
    try {
      let articlesData = null;
      const { data, error } = await supabase
        .from("articles")
        .select("*, categories(name), author:profiles!author_id(full_name), publisher:profiles!publisher_id(full_name)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        articlesData = data;
      } else {
        // Fallback: If publisher_id is not in schema cache, fetch standard article relationships
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("articles")
          .select("*, categories(name), author:profiles!author_id(full_name)")
          .order("created_at", { ascending: false });

        if (fallbackError) throw fallbackError;
        articlesData = fallbackData;
      }

      if (articlesData) {
        const mapped = articlesData.map((art: any) => ({
          id: art.id,
          title: art.title,
          slug: art.slug,
          author: art.author_name ? art.author_name : (art.author?.full_name || "Unknown"),
          author_title: art.author_title || (art.author_name ? "Guest Contributor" : undefined),
          publisher: art.publisher?.full_name || (art.status === "published" ? "Staff" : "—"),
          category: art.categories?.name || "Uncategorized",
          status: art.status || "draft",
          views: art.view_count || 0,
          date: art.created_at ? new Date(art.created_at).toLocaleDateString() : "N/A",
          is_featured: art.is_featured || false,
          excerpt: art.excerpt || "",
          cover_image_url: art.cover_image_url || null,
        }));
        setArticles(mapped);
        setFilteredArticles(mapped);
      }
    } catch (err: any) {
      console.error("Error fetching articles:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        error: err
      });
      toast.error(err.message || "Failed to load articles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [supabase]);

  useEffect(() => {
    let result = articles;

    if (searchQuery.trim() !== "") {
      result = result.filter(art => 
        (art.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (art.author || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(art => art.status === statusFilter);
    }

    setFilteredArticles(result);
    setCurrentPage(1); // Reset to first page on filter change
  }, [searchQuery, statusFilter, articles]);

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const handleUpdateStatus = async (articleId: string, newStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData: any = { status: newStatus };
      if (newStatus === "published") {
        updateData.published_at = new Date().toISOString();
        if (user) {
          updateData.publisher_id = user.id;
        }
      }
      
      let { error } = await supabase
        .from("articles")
        .update(updateData)
        .eq("id", articleId);

      // Gracefully retry without publisher_id if column hasn't migrated yet
      if (error && error.message?.includes("publisher_id")) {
        delete updateData.publisher_id;
        const retry = await supabase
          .from("articles")
          .update(updateData)
          .eq("id", articleId);
        error = retry.error;
      }

      if (error) throw error;

      toast.success(`Article status updated to ${newStatus}!`);
      fetchArticles();

      if (newStatus === "published") {
        const targetArt = articles.find((a) => a.id === articleId);
        if (targetArt) {
          fetch("/api/notifications/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              article: {
                title: targetArt.title,
                slug: targetArt.slug,
                excerpt: targetArt.excerpt,
                cover_image_url: targetArt.cover_image_url,
              },
            }),
          }).catch((e) => console.error("Push dispatch error:", e));
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update article status");
    }
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleToDelete.id);

      if (error) throw error;

      toast.success("Article deleted successfully!");
      setArticleToDelete(null);
      fetchArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
    } finally {
      setIsDeleting(false);
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
    } catch (err: any) {
      toast.error(err.message || "Failed to update featured status");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy dark:text-white tracking-tight">Articles Management</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage all articles, moderate submissions, and change status</p>
        </div>
        <Button asChild className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy dark:bg-upsa-gold dark:text-upsa-navy dark:hover:bg-amber-400 font-bold">
          <Link href="/dashboard/editor/articles/new">
            <Plus className="mr-2 h-4 w-4" /> Create Article
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search by title or author..."
          className="max-w-md bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest text-[10px]">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm font-medium text-gray-800 dark:text-slate-200 focus:ring-2 focus:ring-upsa-navy/20 dark:focus:ring-upsa-gold/20 outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableShadowLoader rows={6} hasSearch={false} />
          </div>
        ) : filteredArticles.length > 0 ? (
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-white/[0.02]">
              <TableRow className="border-b border-gray-100 dark:border-white/10">
                <TableHead className="font-bold text-upsa-navy dark:text-white">Article Title</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Author</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Publisher</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Category</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Views</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white text-center">Featured</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Status</TableHead>
                <TableHead className="font-bold text-upsa-navy dark:text-white">Created</TableHead>
                <TableHead className="text-right font-bold text-upsa-navy dark:text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedArticles.map((art) => (
                <TableRow key={art.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] border-b border-gray-100 dark:border-white/5 transition-colors">
                  <TableCell className="font-semibold text-upsa-navy dark:text-white max-w-xs truncate">
                    <Link href={`/articles/${art.slug}`} className="hover:text-upsa-gold transition-colors">
                      {art.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-700 dark:text-slate-300">
                    <div>
                      <span>{art.author}</span>
                      {art.author_title && (
                        <span className="block text-[10px] text-gray-400 dark:text-slate-500 font-normal">{art.author_title}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                    <span className={cn(art.publisher !== "—" ? "text-upsa-navy dark:text-white" : "text-gray-400 dark:text-slate-500")}>
                      {art.publisher}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-slate-400">{art.category}</TableCell>
                  <TableCell className="text-sm font-bold text-gray-600 dark:text-slate-300">{art.views.toLocaleString()}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleToggleFeatured(art.id, art.is_featured)}
                      className="mx-auto block p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
                      title={art.is_featured ? "Remove from featured" : "Mark as featured"}
                    >
                      <Star className={cn("h-5 w-5 transition-transform hover:scale-110", art.is_featured ? "fill-upsa-gold text-upsa-gold" : "text-gray-300 dark:text-slate-600")} />
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
                  <TableCell className="text-sm text-gray-400 dark:text-slate-500">{art.date}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-gray-600 dark:text-slate-300 hover:text-upsa-navy dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-[#0C1729] border border-gray-100 dark:border-white/10 text-gray-700 dark:text-slate-200">
                        <DropdownMenuLabel className="dark:text-white">Article Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="dark:border-white/10" />
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 dark:focus:bg-white/5">
                          <Link href={`/dashboard/editor/articles/edit/${art.id}`}>
                            <FileEdit className="mr-2 h-4 w-4 text-emerald-500" /> Edit Article
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 dark:focus:bg-white/5">
                          <Link href={`/articles/${art.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Live Article
                          </Link>
                        </DropdownMenuItem>
                        
                        {art.status !== "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 dark:focus:bg-white/5"
                            onClick={() => handleUpdateStatus(art.id, "published")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Publish Article
                          </DropdownMenuItem>
                        )}
                        
                        {art.status === "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 dark:focus:bg-white/5"
                            onClick={() => handleUpdateStatus(art.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4 text-amber-500" /> Archive Article
                          </DropdownMenuItem>
                        )}

                        {art.status === "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer text-amber-600 dark:text-amber-400 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30"
                            onClick={() => handleUpdateStatus(art.id, "draft")}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Revert to Draft
                          </DropdownMenuItem>
                        )}

                        {art.status !== "review" && art.status !== "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 dark:focus:bg-white/5"
                            onClick={() => handleUpdateStatus(art.id, "review")}
                          >
                            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Submit for Review
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator className="dark:border-white/10" />
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30"
                          onClick={() => setArticleToDelete(art)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Permanently
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="py-20 text-center text-gray-500 dark:text-slate-400 italic">No articles found matching filters.</div>
        )}

        {filteredArticles.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
            <div className="text-sm text-gray-500 dark:text-slate-400 font-medium">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white dark:bg-[#0C1729] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Previous
              </Button>
              <div className="flex items-center px-4 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-[#0C1729] border border-gray-200 dark:border-white/10 rounded-md">
                Page {currentPage} of {totalPages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="bg-white dark:bg-[#0C1729] dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Article Delete Confirmation Modal */}
      {articleToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0C1729] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <div className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Article</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Permanent action</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              Are you sure you want to permanently delete <strong className="text-upsa-navy dark:text-upsa-gold">"{articleToDelete.title}"</strong>? This will remove the story and its reader statistics permanently.
            </p>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setArticleToDelete(null)}
                disabled={isDeleting}
                className="dark:bg-transparent dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteArticle}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
