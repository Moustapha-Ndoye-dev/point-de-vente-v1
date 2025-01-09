import { supabase } from "../supabaseClient";
import { Enterprise } from "../types/types";
import bcrypt from 'bcryptjs';

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
    if (!enterprise.password) {
      throw new Error("Le mot de passe est requis pour créer une entreprise.");
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(enterprise.password, 10);

    const { data, error } = await supabase
      .from("enterprise")
      .insert({
        ...enterprise,
        password: hashedPassword, // Stocker le mot de passe haché
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
