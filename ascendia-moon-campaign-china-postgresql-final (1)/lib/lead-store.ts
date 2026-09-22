import { getCloudBaseDatabase, useCloudBase } from "@/lib/cloudbase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export type LeadRecord = Record<string, unknown> & { id?: string; _id?: string };

function normalize<T extends LeadRecord>(lead: T) {
  return { ...lead, id: String(lead.id ?? lead._id ?? "") };
}

export async function insertLead(lead: Record<string, unknown>) {
  if (!useCloudBase()) {
    const { error } = await getSupabaseAdmin().from("leads").insert(lead);
    return { duplicate: error?.code === "23505", error: error && error.code !== "23505" ? error : null };
  }
  try {
    const { error } = await getCloudBaseDatabase().from("leads").insert(lead);
    if (error) {
      const code = String((error as { code?: unknown }).code ?? "");
      return { duplicate: code === "23505", error: code === "23505" ? null : error };
    }
    return { duplicate: false, error: null };
  } catch (error) {
    const code = String((error as { code?: unknown }).code ?? "");
    return { duplicate: code === "23505", error: code === "23505" ? null : error };
  }
}

export async function updateLeadByRequestId(requestId: string, values: Record<string, unknown>) {
  if (!useCloudBase()) {
    await getSupabaseAdmin().from("leads").update(values).eq("request_id", requestId);
    return;
  }
  const { error } = await getCloudBaseDatabase().from("leads").update(values).eq("request_id", requestId);
  if (error) throw error;
}

export async function listLeads(limit = 200) {
  if (!useCloudBase()) {
    const { data, error } = await getSupabaseAdmin().from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
    if (error) throw error;
    return (data ?? []).map(normalize);
  }
  const { data, error } = await getCloudBaseDatabase().from("leads").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function getLead(id: string) {
  if (!useCloudBase()) {
    const { data, error } = await getSupabaseAdmin().from("leads").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? normalize(data) : null;
  }
  const { data, error } = await getCloudBaseDatabase().from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

export async function updateLeadStatus(id: string, salesStatus: string) {
  const updatedAt = new Date().toISOString();
  if (!useCloudBase()) {
    const { data, error } = await getSupabaseAdmin().from("leads").update({ sales_status: salesStatus }).eq("id", id).select("id,sales_status,updated_at").single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await getCloudBaseDatabase()
    .from("leads")
    .update({ sales_status: salesStatus, updated_at: updatedAt })
    .eq("id", id)
    .select("id,sales_status,updated_at")
    .single();
  if (error) throw error;
  return data;
}
