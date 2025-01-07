import { supabase } from "../supabaseClient";
import { Enterprise } from "../types/types";

export async function getEnterprise(id: string) {
  const { data, error } = await supabase
    .from("enterprise")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function checkSubscriptionStatus(id: string) {
  const { data, error } = await supabase
    .from("enterprise")
    .select("subscription_status, subscription_end_date")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data.subscription_status === true &&
         new Date(data.subscription_end_date) > new Date();
}

export async function updateEnterpriseSubscription(id: string) {
  const { data, error } = await supabase
    .from("enterprise")
    .update({
      subscription_status: false,
      subscription_end_date: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) throw error;
  return data;
}

export async function createEnterprise(enterprise: Enterprise) {
  const { data, error } = await supabase
    .from("enterprise")
    .insert({
      ...enterprise,
      subscription_status: true,
      subscription_end_date: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select();

  if (error) throw error;
  return data;
}

export async function getActiveEnterprises() {
  const { data, error } = await supabase
    .from("enterprise")
    .select("*")
    .eq("subscription_status", true);

  if (error) throw error;
  return data;
}

export async function deleteEnterprise(id: string) {
  const { data, error } = await supabase
    .from("enterprise")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return data;
}
