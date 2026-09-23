"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { articleSchema, ArticleFormValues } from "@/lib/validations/article";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Save, Send, Image as ImageIcon, Settings, PlusCircle, Zap, Loader2, Trash2, ArrowLeft, RotateCcw, Undo2, PenTool, UserCheck } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { FormShadowLoader } from "@/components/ui/shadow-loaders";

interface EditArticleProps {
  params: Promise<{ id: string }>;
}

interface ArticleData {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  category_id: string | null;
  is_featured: boolean | null;
  is_pinned: boolean | null;
  allow_comments: boolean | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  status: string | null;
  published_at?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  author_title?: string | null;
  publisher_id?: string | null;
}

export default function EditArticlePage({ params }: EditArticleProps) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isGuestAuthor, setIsGuestAuthor] = useState<boolean>(false);
  const [publisherName, setPublisherName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("editor");
  const [originalArticle, setOriginalArticle] = useState<ArticleData | null>(null);
  const supabase = createClient();

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema) as Resolver<ArticleFormValues>,
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category_id: "",
      author_id: null,
      author_name: "",
      author_title: "",
      is_featured: false,
      is_pinned: false,
      allow_comments: true,
      cover_image_url: "",
      cover_image_alt: "",
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
    },
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, name");

        if (error) throw error;
        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, [supabase]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (data && data.role) {
            setUserRole(data.role);
          }
        }

        // Fetch editorial team members for author dropdown
        const { data: team } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .in("role", ["admin", "editor"])
          .order("full_name");

        if (team) {
          setTeamProfiles(team);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [supabase]);

  useEffect(() => {
    const fetchArticleDetails = async () => {
      try {
        let articleData: any = null;
        const { data, error } = await supabase
          .from("articles")
          .select("*, publisher:profiles!publisher_id(full_name)")
          .eq("id", id)
          .single();

        if (!error && data) {
          articleData = data;
        } else {
          // Graceful fallback if publisher_id relationship doesn't exist yet
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("articles")
            .select("*")
            .eq("id", id)
            .single();
          if (fallbackError) throw fallbackError;
          articleData = fallbackData;
        }

        if (articleData) {
          setOriginalArticle(articleData);
          if (articleData.author_name) {
            setIsGuestAuthor(true);
          }
          if (articleData.publisher?.full_name) {
            setPublisherName(articleData.publisher.full_name);
          }
          
          const savedDraft = localStorage.getItem(`vou_draft_edit_${id}`);
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              Object.keys(parsed).forEach((key) => {
                form.setValue(key as keyof ArticleFormValues, parsed[key], { shouldValidate: true });
              });
              if (parsed.author_name) {
                setIsGuestAuthor(true);
              }
              toast.success("Loaded your auto-saved edits.");
            } catch (e) {
              console.error("Error loading draft edits:", e);
            }
          } else {
            form.reset({
              title: data.title || "",
              slug: data.slug || "",
              excerpt: data.excerpt || "",
              content: data.content || "",
              category_id: data.category_id || "",
              author_id: data.author_id || null,
              author_name: data.author_name || "",
              author_title: data.author_title || "",
              is_featured: data.is_featured || false,
              is_pinned: data.is_pinned || false,
              allow_comments: data.allow_comments !== false,
              cover_image_url: data.cover_image_url || "",
              cover_image_alt: data.cover_image_alt || "",
              meta_title: data.meta_title || "",
              meta_description: data.meta_description || "",
              meta_keywords: data.meta_keywords || "",
            });
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching article details:", err);
        toast.error(err instanceof Error ? err.message : "Failed to load article details.");
        router.push("/dashboard/editor/articles");
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleDetails();
  }, [id, supabase, router, form]);

  const watchedValues = form.watch();
  useEffect(() => {
    if (isSubmitted) return;
    if (!isLoading && typeof window !== "undefined") {
      const hasContent = 
        (watchedValues.title && watchedValues.title.trim() !== "") || 
        (watchedValues.content && watchedValues.content !== "<p></p>" && watchedValues.content.trim() !== "") || 
        (watchedValues.excerpt && watchedValues.excerpt.trim() !== "") || 
        (watchedValues.cover_image_url && watchedValues.cover_image_url.trim() !== "");
      
      if (hasContent) {
        localStorage.setItem(`vou_draft_edit_${id}`, JSON.stringify(watchedValues));
      } else {
        localStorage.removeItem(`vou_draft_edit_${id}`);
      }
    }
  }, [watchedValues, id, isLoading, isSubmitted]);

  const handleRevertChanges = () => {
    if (confirm("Are you sure you want to revert all changes? This will restore the article back to its original database values.")) {
      if (originalArticle) {
        form.reset({
          title: originalArticle.title || "",
          slug: originalArticle.slug || "",
          excerpt: originalArticle.excerpt || "",
          content: originalArticle.content || "",
          category_id: originalArticle.category_id || "",
          is_featured: originalArticle.is_featured || false,
          is_pinned: originalArticle.is_pinned || false,
          allow_comments: originalArticle.allow_comments !== false,
          cover_image_url: originalArticle.cover_image_url || "",
          cover_image_alt: originalArticle.cover_image_alt || "",
          meta_title: originalArticle.meta_title || "",
          meta_description: originalArticle.meta_description || "",
          meta_keywords: originalArticle.meta_keywords || "",
        });
        if (typeof window !== "undefined") {
          localStorage.removeItem(`vou_draft_edit_${id}`);
        }
        toast.success("All edits reverted back to original copy.");
      }
    }
  };

  const handleFormErrors = (errors: FieldErrors<ArticleFormValues>) => {
    console.error("Form validation errors:", errors);
    const allErrors: Record<string, unknown> = { ...errors, ...form.formState.errors };
    const errorKeys = Object.keys(allErrors);
    
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const errorObj = allErrors[firstKey] as { message?: string } | undefined;
      toast.error(`${firstKey.replace("_", " ").toUpperCase()}: ${errorObj?.message || "Invalid field value"}`);
    } else {
      toast.error("Form validation failed. Please check required fields.");
    }
  };

  const submitArticle = async (data: ArticleFormValues, status: "draft" | "review" | "published") => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to modify an article.");
        setIsSaving(false);
        return;
      }

      const resolvedAuthorId = isGuestAuthor ? null : (data.author_id || originalArticle?.author_id || user.id);
      const resolvedAuthorName = isGuestAuthor ? (data.author_name?.trim() || null) : null;
      const resolvedAuthorTitle = isGuestAuthor ? (data.author_title?.trim() || null) : null;

      const updatePayload: Record<string, unknown> = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category_id: data.category_id || null,
        author_id: resolvedAuthorId,
        author_name: resolvedAuthorName,
        author_title: resolvedAuthorTitle,
        status,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        meta_keywords: data.meta_keywords || null,
        cover_image_url: data.cover_image_url || null,
        cover_image_alt: data.cover_image_alt || null,
        is_featured: data.is_featured || false,
        is_pinned: data.is_pinned || false,
        allow_comments: data.allow_comments !== false,
      };

      if (status === "published") {
        updatePayload.published_at = originalArticle?.published_at || new Date().toISOString();
        updatePayload.publisher_id = user.id;
      }

      let { error } = await supabase
        .from("articles")
        .update(updatePayload)
        .eq("id", id);

      // Gracefully retry with core fields if new columns are not yet present in the database
      if (error && (error.message?.includes("publisher_id") || error.message?.includes("author_name") || error.message?.includes("author_title") || (error as any).code === "42703")) {
        const fallbackPayload = { ...updatePayload };
        delete (fallbackPayload as any).publisher_id;
        delete (fallbackPayload as any).author_name;
        delete (fallbackPayload as any).author_title;
        const retry = await supabase.from("articles").update(fallbackPayload).eq("id", id);
        error = retry.error;
      }

      if (error) throw error;

      setIsSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem(`vou_draft_edit_${id}`);
      }

      if (status === "draft") {
        toast.success("Article draft updated successfully!");
      } else if (status === "published") {
        toast.success("Article updated and published successfully!");
        // Dispatch push notification to OneSignal subscribers in background
        fetch("/api/notifications/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article: {
              title: data.title,
              slug: data.slug,
              excerpt: data.excerpt,
              cover_image_url: data.cover_image_url,
            },
          }),
        }).catch((e) => console.error("Push dispatch error:", e));
      } else {
        toast.success("Article edits submitted for review!");
      }
      
      router.push(userRole === "admin" ? "/dashboard/admin/articles" : "/dashboard/editor/articles");
    } catch (err: unknown) {
      console.error("Error updating article:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update article");
    } finally {
      setIsSaving(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const result = await res.json();
      if (result.secure_url) {
        form.setValue("cover_image_url", result.secure_url, { shouldValidate: true });
        toast.success("Image uploaded successfully!");
      } else {
        throw new Error("Invalid upload response");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload image to Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title, { shouldValidate: true });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingSEO, setIsGeneratingSEO] = useState(false);

  const generateSEO = () => {
    const title = form.getValues("title");
    const excerpt = form.getValues("excerpt");
    const rawContent = form.getValues("content");

    if (!title) {
      toast.error("Please add a title first before generating SEO data.");
      return;
    }

    setIsGeneratingSEO(true);

    setTimeout(() => {
      let metaTitle = `${title.trim()} | Voice of UPSA`;
      if (metaTitle.length > 60) {
        metaTitle = title.trim().slice(0, 57) + "...";
      }
      form.setValue("meta_title", metaTitle, { shouldValidate: true });

      let metaDesc = "";
      if (excerpt && excerpt.trim() !== "") {
        metaDesc = excerpt.trim();
      } else if (rawContent && rawContent.trim() !== "" && rawContent !== "<p></p>") {
        const tmp = document.createElement("div");
        tmp.innerHTML = rawContent;
        metaDesc = (tmp.textContent || tmp.innerText || "").trim();
      }
      
      if (metaDesc.length > 155) {
        metaDesc = metaDesc.slice(0, 152).trim() + "...";
      }
      if (metaDesc) {
        form.setValue("meta_description", metaDesc, { shouldValidate: true });
      }

      const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "for", "with", "about", "against", "between", 
        "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", 
        "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once",
        "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", 
        "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", 
        "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now",
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", 
        "do", "does", "did", "doing", "of", "at", "by", "i", "we", "you", "he", "she", "it", 
        "they", "them", "us"
      ]);

      const sourceText = `${title} ${excerpt || ""}`.toLowerCase();
      const words = sourceText.match(/[a-z0-9]+/g) || [];
      const keywordsMap: { [key: string]: number } = {};

      words.forEach(word => {
        if (word.length >= 3 && !stopWords.has(word) && isNaN(Number(word))) {
          keywordsMap[word] = (keywordsMap[word] || 0) + 1;
        }
      });

      const sortedKeywords = Object.keys(keywordsMap)
        .sort((a, b) => keywordsMap[b] - keywordsMap[a])
        .slice(0, 8);

      if (sortedKeywords.length > 0) {
        form.setValue("meta_keywords", sortedKeywords.join(", "), { shouldValidate: true });
      }

      toast.success("SEO Metadata auto-generated!");
      setIsGeneratingSEO(false);
    }, 600);
  };

  const generateExcerpt = () => {
    const rawContent = form.getValues("content");
    if (!rawContent || rawContent.trim() === "" || rawContent === "<p></p>") {
      toast.error("Write some content first before generating a summary.");
      return;
    }

    setIsGenerating(true);

    const tmp = document.createElement("div");
    tmp.innerHTML = rawContent;
    const plainText = (tmp.textContent || tmp.innerText || "").trim();

    if (plainText.length < 20) {
      toast.error("The article content is too short to generate a summary.");
      setIsGenerating(false);
      return;
    }

    setTimeout(() => {
      const sentences = plainText.match(/[^.!?]+[.!?]+/g) || [plainText];
      let excerpt = "";
      for (const sentence of sentences) {
        if ((excerpt + sentence.trim()).length > 200) break;
        excerpt += (excerpt ? " " : "") + sentence.trim();
      }

      if (!excerpt) {
        excerpt = plainText.slice(0, 200).trim();
        if (plainText.length > 200) excerpt += "...";
      }

      form.setValue("excerpt", excerpt, { shouldValidate: true });
      toast.success("Excerpt generated from your content!");
      setIsGenerating(false);
    }, 600);
  };

  if (isLoading) {
    return <FormShadowLoader />;
  }

  const coverImageUrl = form.watch("cover_image_url");

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Edit Article</h1>
          <p className="text-gray-500">Modify and update your story details</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="ghost" 
            type="button"
            className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold"
            onClick={handleRevertChanges}
            disabled={isSaving}
          >
            <Undo2 className="mr-2 h-4 w-4" /> Revert Edits
          </Button>
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isSaving}>Cancel</Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              const data = form.getValues();
              submitArticle(data, "draft");
            }}
            disabled={isSaving}
          >
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button 
            type="button"
            className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold"
            onClick={form.handleSubmit(
              (data) => submitArticle(data, "published"),
              (errors) => handleFormErrors(errors)
            )}
            disabled={isSaving}
          >
            <Send className="mr-2 h-4 w-4" /> Publish Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold text-gray-700">Article Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. UPSA Awards Ceremony 2026 Highlights" 
                  className="font-semibold text-lg h-12"
                  {...form.register("title")}
                  onChange={handleTitleChange}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt" className="text-sm font-bold text-gray-700">Summary / Excerpt</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-bold border-upsa-gold/40 text-upsa-gold hover:bg-upsa-gold/10 hover:text-upsa-gold transition-all gap-1"
                    onClick={generateExcerpt}
                    disabled={isGenerating}
                  >
                    <Zap className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`} />
                    {isGenerating ? "Generating..." : "Generate Summary"}
                  </Button>
                </div>
                <Textarea 
                  id="excerpt" 
                  placeholder="Provide a short hook summary of this article to display in lists (max 300 characters)..." 
                  className="h-20 resize-none text-sm"
                  {...form.register("excerpt")}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-xs text-red-500">{form.formState.errors.excerpt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Article Body Content</Label>
                <TiptapEditor 
                  content={form.watch("content") || ""} 
                  onChange={(val) => form.setValue("content", val, { shouldValidate: true })}
                />
                {form.formState.errors.content && (
                  <p className="text-xs text-red-500">{form.formState.errors.content.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings Column */}
        <div className="space-y-6">
          {/* Author Attribution Card */}
          <Card className="border-upsa-navy/10 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1.5">
                  <PenTool className="h-3.5 w-3.5 text-upsa-gold" /> Written By
                </CardTitle>
                <span className="text-[10px] bg-upsa-navy/5 text-upsa-navy font-bold px-2 py-0.5 rounded-full">
                  Author Credit
                </span>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Credit the person who researched and wrote this piece.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_guest_author_edit"
                  className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy cursor-pointer"
                  checked={isGuestAuthor}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGuestAuthor(checked);
                    if (checked) {
                      form.setValue("author_id", null);
                    } else {
                      form.setValue("author_id", originalArticle?.author_id || currentUserId || null);
                      form.setValue("author_name", "");
                      form.setValue("author_title", "");
                    }
                  }}
                />
                <Label htmlFor="is_guest_author_edit" className="cursor-pointer text-xs font-semibold text-gray-700">
                  Guest / External Contributor
                </Label>
              </div>

              {!isGuestAuthor ? (
                <div className="space-y-2">
                  <Label htmlFor="author_id_edit" className="text-xs text-gray-600">Staff Author</Label>
                  <Select
                    value={form.watch("author_id") || originalArticle?.author_id || currentUserId || undefined}
                    onValueChange={(val) => form.setValue("author_id", val, { shouldValidate: true })}
                  >
                    <SelectTrigger id="author_id_edit" className="h-9 text-xs">
                      <SelectValue placeholder="Choose staff author" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamProfiles.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name} ({member.role}) {member.id === currentUserId ? "— You" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="space-y-1">
                    <Label htmlFor="author_name_edit" className="text-xs font-bold text-gray-700">Author Name *</Label>
                    <Input
                      id="author_name_edit"
                      placeholder="e.g. Kofi Mensah"
                      className="h-8 text-xs bg-white"
                      {...form.register("author_name")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="author_title_edit" className="text-xs text-gray-500">Author Title / Role</Label>
                    <Input
                      id="author_title_edit"
                      placeholder="e.g. SRC PRO / Level 400 Student"
                      className="h-8 text-xs bg-white"
                      {...form.register("author_title")}
                    />
                  </div>
                </div>
              )}

              {/* Publisher Attribution Badge */}
              {originalArticle?.status === "published" && (
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" /> Published by:
                  </span>
                  <span className="font-semibold text-upsa-navy">
                    {publisherName || "Editorial Staff"}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-gray-400">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={form.watch("category_id") || undefined}
                  onValueChange={(val) => form.setValue("category_id", val, { shouldValidate: true })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.category_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-400">/articles/</span>
                  <Input id="slug" {...form.register("slug")} className="h-8 text-xs" />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_featured"
                    className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy cursor-pointer"
                    checked={form.watch("is_featured") || false}
                    onChange={(e) => form.setValue("is_featured", e.target.checked, { shouldValidate: true })}
                  />
                  <Label htmlFor="is_featured" className="cursor-pointer font-bold text-gray-700 text-sm">
                    Feature on Homepage
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_pinned"
                    className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy cursor-pointer"
                    checked={form.watch("is_pinned") || false}
                    onChange={(e) => form.setValue("is_pinned", e.target.checked, { shouldValidate: true })}
                  />
                  <Label htmlFor="is_pinned" className="cursor-pointer font-bold text-gray-700 text-sm">
                    Pin/Highlight Article
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allow_comments"
                    className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy cursor-pointer"
                    checked={form.watch("allow_comments") !== false}
                    onChange={(e) => form.setValue("allow_comments", e.target.checked, { shouldValidate: true })}
                  />
                  <Label htmlFor="allow_comments" className="cursor-pointer font-bold text-gray-700 text-sm">
                    Allow Reader Comments
                  </Label>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4" /> Cover Image
                  </Label>
                  {coverImageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 text-red-500 hover:text-red-700 hover:bg-red-50 text-xs px-2 gap-1"
                      onClick={() => {
                        form.setValue("cover_image_url", "", { shouldValidate: true });
                        form.setValue("cover_image_alt", "", { shouldValidate: true });
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="mt-2 relative">
                  <input
                    type="file"
                    id="cover_upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />

                  {coverImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={coverImageUrl} 
                        alt="Uploaded cover image preview" 
                        className="aspect-video object-cover w-full"
                      />
                    </div>
                  ) : (
                    <label 
                      htmlFor="cover_upload"
                      className="aspect-video rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-upsa-navy animate-spin mb-2" />
                      ) : (
                        <PlusCircle className="h-8 w-8 text-gray-300 mb-2" />
                      )}
                      <span className="text-xs font-medium text-gray-500">
                        {isUploading ? "Uploading image..." : "Upload Cover Image"}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-1">Recommended: 16:9 ratio, max 5MB</span>
                    </label>
                  )}
                </div>
                {form.formState.errors.cover_image_url && (
                  <p className="text-xs text-red-500">{form.formState.errors.cover_image_url.message}</p>
                )}

                {coverImageUrl && (
                  <div className="space-y-2 mt-4 pt-2 border-t border-gray-100">
                    <Label htmlFor="cover_image_alt" className="text-xs font-bold text-gray-500">Image Alt Text (SEO & Access)</Label>
                    <Input 
                      id="cover_image_alt" 
                      placeholder="e.g. Students inside the library" 
                      className="h-8 text-xs"
                      {...form.register("cover_image_alt")}
                    />
                    {form.formState.errors.cover_image_alt && (
                      <p className="text-xs text-red-500">{form.formState.errors.cover_image_alt.message}</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm uppercase tracking-widest text-gray-400 flex items-center">
                <Settings className="mr-2 h-4 w-4" /> SEO Optimization
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-bold border-upsa-gold/40 text-upsa-gold hover:bg-upsa-gold/10 hover:text-upsa-gold transition-all gap-1"
                onClick={generateSEO}
                disabled={isGeneratingSEO}
              >
                <Zap className={`h-3 w-3 ${isGeneratingSEO ? "animate-pulse" : ""}`} />
                {isGeneratingSEO ? "Generating..." : "Generate SEO"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="meta_title" className="text-xs">Meta Title</Label>
                <Input id="meta_title" {...form.register("meta_title")} className="h-8 text-xs" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meta_description" className="text-xs">Meta Description</Label>
                <Textarea id="meta_description" {...form.register("meta_description")} className="h-20 text-xs resize-none" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="meta_keywords" className="text-xs">Meta Keywords (comma-separated)</Label>
                <Input id="meta_keywords" placeholder="e.g. upsa, awards, students" {...form.register("meta_keywords")} className="h-8 text-xs" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
