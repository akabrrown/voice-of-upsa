"use server";

import { createClient } from "@/lib/supabase/server";
import { aj } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { redis } from "@/lib/upstash";
import { serviceSchema, ServiceInput, categorySchema, CategoryInput } from "@/lib/validations/services";
import { revalidatePath } from "next/cache";

async function checkAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, id")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return profile.id;
}

async function logAudit(supabase: any, actorId: string, action: string, resourceId: string, metadata: any = {}) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    resource_type: "directory.service",
    resource_id: resourceId,
    metadata
  });
}

export async function createService(data: ServiceInput) {
  const req = await request();
  const decision = await aj.protect(req);
  if (decision.isDenied()) throw new Error("Rate limit exceeded");

  const validated = serviceSchema.parse(data);
  const supabase = await createClient();
  const adminId = await checkAdmin(supabase);
  if (!adminId) throw new Error("Unauthorized");

  const { data: service, error } = await supabase
    .from("directory_services")
    .insert({
      ...validated,
      created_by: adminId,
      verified_by: adminId,
      last_verified_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, adminId, "service.created", service.id, { name: service.name });
  
  await redis.del("directory:services:active");
  
  revalidatePath("/services");
  revalidatePath("/admin/services");

  return service;
}

export async function updateService(id: string, data: Partial<ServiceInput>) {
  const req = await request();
  const decision = await aj.protect(req);
  if (decision.isDenied()) throw new Error("Rate limit exceeded");

  const supabase = await createClient();
  const adminId = await checkAdmin(supabase);
  if (!adminId) throw new Error("Unauthorized");

  const { data: service, error } = await supabase
    .from("directory_services")
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, adminId, "service.updated", service.id, { changes: Object.keys(data) });
  
  await redis.del("directory:services:active", `directory:service:${service.slug}`);
  
  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/admin/services");

  return service;
}

export async function verifyServiceToday(id: string) {
  const req = await request();
  const decision = await aj.protect(req);
  if (decision.isDenied()) throw new Error("Rate limit exceeded");

  const supabase = await createClient();
  const adminId = await checkAdmin(supabase);
  if (!adminId) throw new Error("Unauthorized");

  const { data: service, error } = await supabase
    .from("directory_services")
    .update({
      last_verified_at: new Date().toISOString(),
      verified_by: adminId,
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, adminId, "service.verified", service.id);
  
  await redis.del("directory:services:active", `directory:service:${service.slug}`);
  
  revalidatePath("/services");
  revalidatePath(`/services/${service.slug}`);
  revalidatePath("/admin/services");

  return service;
}

export async function deactivateService(id: string) {
  return updateService(id, { status: "inactive" });
}

export async function softDeleteService(id: string) {
  const req = await request();
  const decision = await aj.protect(req);
  if (decision.isDenied()) throw new Error("Rate limit exceeded");

  const supabase = await createClient();
  const adminId = await checkAdmin(supabase);
  if (!adminId) throw new Error("Unauthorized");

  const { data: service, error } = await supabase
    .from("directory_services")
    .update({
      deleted_at: new Date().toISOString(),
      status: "inactive",
      updated_at: new Date().toISOString()
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit(supabase, adminId, "service.deleted", service.id);
  
  await redis.del("directory:services:active", `directory:service:${service.slug}`);
  
  revalidatePath("/services");
  revalidatePath("/admin/services");

  return service;
}

export async function manageCategory(data: CategoryInput, id?: string) {
  const req = await request();
  const decision = await aj.protect(req);
  if (decision.isDenied()) throw new Error("Rate limit exceeded");

  const validated = categorySchema.parse(data);
  const supabase = await createClient();
  const adminId = await checkAdmin(supabase);
  if (!adminId) throw new Error("Unauthorized");

  let result;
  if (id) {
    const { data: cat, error } = await supabase
      .from("directory_categories")
      .update({ ...validated, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = cat;
    await logAudit(supabase, adminId, "category.updated", cat.id, { name: cat.name });
  } else {
    const { data: cat, error } = await supabase
      .from("directory_categories")
      .insert(validated)
      .select()
      .single();
    if (error) throw new Error(error.message);
    result = cat;
    await logAudit(supabase, adminId, "category.created", cat.id, { name: cat.name });
  }

  await redis.del("directory:categories");

  revalidatePath("/services");
  revalidatePath("/admin/services/categories");

  return result;
}
