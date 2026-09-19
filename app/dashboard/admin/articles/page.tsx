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
import { MoreHorizontal, Eye, Trash2, CheckCircle2, AlertCircle, FileEdit, Archive, Plus, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
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
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(art => art.status === statusFilter);
    }

    setFilteredArticles(result);
  }, [searchQuery, statusFilter, articles]);

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

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("Are you sure you want to permanently delete this article? This action cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", articleId);

      if (error) throw error;

      toast.success("Article deleted successfully!");
      fetchArticles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete article");
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
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Articles Management</h1>
          <p className="text-gray-500">Manage all articles, moderate submissions, and change status</p>
        </div>
        <Button asChild className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold">
          <Link href="/dashboard/editor/articles/new">
            <Plus className="mr-2 h-4 w-4" /> Create Article
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Input
          placeholder="Search by title or author..."
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
                <TableHead className="font-bold text-upsa-navy">Publisher</TableHead>
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
                    <Link href={`/articles/${art.slug}`} className="hover:text-upsa-gold transition-colors">
                      {art.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium text-gray-700">
                    <div>
                      <span>{art.author}</span>
                      {art.author_title && (
                        <span className="block text-[10px] text-gray-400 font-normal">{art.author_title}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-gray-500">
                    <span className={cn(art.publisher !== "—" ? "text-upsa-navy" : "text-gray-400")}>
                      {art.publisher}
                    </span>
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
                  <TableCell className="text-sm text-gray-400">{art.date}</TableCell>
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
                        <DropdownMenuItem asChild className="cursor-pointer">
                          <Link href={`/articles/${art.slug}`} target="_blank">
                            <Eye className="mr-2 h-4 w-4 text-blue-500" /> View Live Article
                          </Link>
                        </DropdownMenuItem>
                        
                        {art.status !== "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleUpdateStatus(art.id, "published")}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Publish Article
                          </DropdownMenuItem>
                        )}
                        
                        {art.status === "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleUpdateStatus(art.id, "archived")}
                          >
                            <Archive className="mr-2 h-4 w-4 text-amber-500" /> Archive Article
                          </DropdownMenuItem>
                        )}

                        {art.status !== "review" && art.status !== "published" && (
                          <DropdownMenuItem 
                            className="cursor-pointer"
                            onClick={() => handleUpdateStatus(art.id, "review")}
                          >
                            <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Submit for Review
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => handleDeleteArticle(art.id)}
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
          <div className="py-20 text-center text-gray-500 italic">No articles found matching filters.</div>
        )}
      </div>
    </div>
  );
}
