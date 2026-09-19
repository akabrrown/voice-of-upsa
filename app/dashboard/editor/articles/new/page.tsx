"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Resolver } from "react-hook-form";
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
import { Save, Send, Image as ImageIcon, Settings, PlusCircle, Zap, Loader2, Trash2, User, PenTool } from "lucide-react";
import { toast } from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";

export default function NewArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [teamProfiles, setTeamProfiles] = useState<{ id: string; full_name: string; role: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [isGuestAuthor, setIsGuestAuthor] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>("editor");
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

  // Fetch the user's role and ID to determine author and publish workflow capabilities
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
          // Default author_id to current user if not already set
          if (!form.getValues("author_id") && !form.getValues("author_name")) {
            form.setValue("author_id", user.id);
          }

          const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (data && data.role) {
            setUserRole(data.role);
          }
        }

        // Fetch editorial team members for author attribution
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
  }, [supabase, form]);

  // Load draft from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDraft = localStorage.getItem("vou_draft_article");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          Object.keys(parsed).forEach((key) => {
            form.setValue(key as any, parsed[key], { shouldValidate: true });
          });
        } catch (e) {
          console.error("Error loading draft from localStorage:", e);
        }
      }
    }
  }, []);

  // Save draft to localStorage on value change
  const watchedValues = form.watch();
  useEffect(() => {
    if (isSubmitted) return;
    if (typeof window !== "undefined") {
      const hasContent = 
        (watchedValues.title && watchedValues.title.trim() !== "") || 
        (watchedValues.content && watchedValues.content !== "<p></p>" && watchedValues.content.trim() !== "") || 
        (watchedValues.excerpt && watchedValues.excerpt.trim() !== "") || 
        (watchedValues.cover_image_url && watchedValues.cover_image_url.trim() !== "");
      
      if (hasContent) {
        localStorage.setItem("vou_draft_article", JSON.stringify(watchedValues));
      } else {
        localStorage.removeItem("vou_draft_article");
      }
    }
  }, [watchedValues, isSubmitted]);

  const handleClearForm = () => {
    if (confirm("Are you sure you want to clear all form fields? This will delete your current draft.")) {
      form.reset({
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        category_id: "",
        is_featured: false,
        cover_image_url: "",
        cover_image_alt: "",
        meta_title: "",
        meta_description: "",
      });
      if (typeof window !== "undefined") {
        localStorage.removeItem("vou_draft_article");
      }
      toast.success("Draft cleared.");
    }
  };

  const handleFormErrors = (errors: any) => {
    console.error("Form validation errors:", errors);
    
    // Merge errors from parameter and react-hook-form state to bypass Proxy tracking optimization gaps
    const allErrors = { ...errors, ...form.formState.errors };
    const errorKeys = Object.keys(allErrors);
    
    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];
      const errorObj = allErrors[firstKey] as any;
      toast.error(`${firstKey.replace("_", " ").toUpperCase()}: ${errorObj?.message || "Invalid field value"}`);
    } else {
      toast.error("Form validation failed. Please check required fields: Title, Excerpt, Content body, Category selection.");
    }
  };

  const submitArticle = async (data: ArticleFormValues, status: "draft" | "review" | "published") => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to submit an article.");
        setIsLoading(false);
        return;
      }

      const resolvedAuthorId = isGuestAuthor ? null : (data.author_id || user.id);
      const resolvedAuthorName = isGuestAuthor ? (data.author_name?.trim() || null) : null;
      const resolvedAuthorTitle = isGuestAuthor ? (data.author_title?.trim() || null) : null;

      const insertPayload: any = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        category_id: data.category_id || null,
        author_id: resolvedAuthorId,
        author_name: resolvedAuthorName,
        author_title: resolvedAuthorTitle,
        publisher_id: status === "published" ? user.id : null,
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
        insertPayload.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("articles")
        .insert(insertPayload);

      if (error) throw error;

      setIsSubmitted(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem("vou_draft_article");
      }

      if (status === "draft") {
        toast.success("Draft saved successfully!");
      } else if (status === "published") {
        toast.success("Article published successfully!");
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
        toast.success("Article submitted for review!");
      }
      
      router.push("/dashboard/editor/articles");
    } catch (err: unknown) {
      console.error("Error submitting article:", err);
      toast.error(err instanceof Error ? err.message : "Failed to submit article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    form.setValue("title", title, { shouldValidate: true });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    form.setValue("slug", slug, { shouldValidate: true });
  };

  const [isUploading, setIsUploading] = useState(false);
  const coverImageUrl = form.watch("cover_image_url");

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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy tracking-tight">Create New Article</h1>
          <p className="text-gray-500">Draft a new story for Voice of UPSA</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="ghost" 
            type="button"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 font-bold"
            onClick={handleClearForm}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear Draft
          </Button>
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button 
            variant="outline" 
            type="button"
            onClick={() => {
              const data = form.getValues();
              submitArticle(data, "draft");
            }}
            disabled={isLoading}
          >
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button 
            type="button"
            className="bg-upsa-navy text-white hover:bg-upsa-gold hover:text-upsa-navy font-bold"
            onClick={form.handleSubmit(
              (data) => submitArticle(data, userRole === "admin" ? "published" : "review"),
              (errors) => handleFormErrors(errors)
            )}
            disabled={isLoading}
          >
            <Send className="mr-2 h-4 w-4" /> Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editor Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Article Content</CardTitle>
              <CardDescription>The core of your story</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Article Title</Label>
                <Input 
                  id="title" 
                  placeholder="e.g. UPSA Wins Global Impact Award" 
                  className="text-lg font-bold"
                  {...form.register("title")}
                  onChange={handleTitleChange}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="excerpt">Excerpt / Summary</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs font-bold border-upsa-gold/40 text-upsa-gold hover:bg-upsa-gold/10 hover:text-upsa-gold transition-all gap-1.5"
                    onClick={generateExcerpt}
                    disabled={isGenerating}
                  >
                    <Zap className={`h-3.5 w-3.5 ${isGenerating ? "animate-pulse" : ""}`} />
                    {isGenerating ? "Generating..." : "Generate Summary"}
                  </Button>
                </div>
                <Textarea 
                  id="excerpt" 
                  placeholder="A short summary of the article for cards and social media..." 
                  className="resize-none h-24"
                  {...form.register("excerpt")}
                />
                {form.formState.errors.excerpt && (
                  <p className="text-xs text-red-500">{form.formState.errors.excerpt.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Content Body</Label>
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
                Credit the person who wrote this piece. You will be logged as the publisher.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_guest_author"
                  className="h-4 w-4 rounded border-gray-300 text-upsa-navy focus:ring-upsa-navy cursor-pointer"
                  checked={isGuestAuthor}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsGuestAuthor(checked);
                    if (checked) {
                      form.setValue("author_id", null);
                    } else {
                      form.setValue("author_id", currentUserId || null);
                      form.setValue("author_name", "");
                      form.setValue("author_title", "");
                    }
                  }}
                />
                <Label htmlFor="is_guest_author" className="cursor-pointer text-xs font-semibold text-gray-700">
                  Guest / External Contributor
                </Label>
              </div>

              {!isGuestAuthor ? (
                <div className="space-y-2">
                  <Label htmlFor="author_id" className="text-xs text-gray-600">Staff Author</Label>
                  <Select
                    value={form.watch("author_id") || currentUserId || undefined}
                    onValueChange={(val) => form.setValue("author_id", val, { shouldValidate: true })}
                  >
                    <SelectTrigger id="author_id" className="h-9 text-xs">
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
                    <Label htmlFor="author_name" className="text-xs font-bold text-gray-700">Author Name *</Label>
                    <Input
                      id="author_name"
                      placeholder="e.g. Kofi Mensah"
                      className="h-8 text-xs bg-white"
                      {...form.register("author_name")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="author_title" className="text-xs text-gray-500">Author Title / Role</Label>
                    <Input
                      id="author_title"
                      placeholder="e.g. SRC PRO / Level 400 Student"
                      className="h-8 text-xs bg-white"
                      {...form.register("author_title")}
                    />
                  </div>
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
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="file"
                    id="cover_image_input"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />

                  {coverImageUrl ? (
                    <div className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200">
                      <img
                        src={coverImageUrl}
                        alt="Article Cover"
                        className="w-full h-full object-cover"
                      />
                      <label
                        htmlFor="cover_image_input"
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity text-white text-xs font-bold gap-2"
                      >
                        <PlusCircle className="h-8 w-8 text-white/80" />
                        Change Cover Image
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="cover_image_input"
                      className="aspect-video rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 text-upsa-navy animate-spin mb-2" />
                          <span className="text-xs font-medium text-gray-500">Uploading to Cloudinary...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="h-8 w-8 text-gray-300 mb-2" />
                          <span className="text-xs font-medium text-gray-500">Upload Cover Image</span>
                          <span className="text-[10px] text-gray-400 mt-1">Recommended: 16:9 ratio, max 5MB</span>
                        </>
                      )}
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
