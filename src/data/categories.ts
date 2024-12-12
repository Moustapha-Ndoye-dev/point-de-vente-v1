// src/data/categoryService.ts
import { supabase } from '../supabaseClient';
import { Category } from '../types/types';

// Récupérer toutes les catégories d'une entreprise
export const fetchCategories = async (enterpriseId: string): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      products:products(*)
    `)
    .eq('enterprise_id', enterpriseId)
    .order('name');
  
  if (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return [];
  }
  return data || [];
};

// Ajouter une nouvelle catégorie
export const addCategory = async (
  name: string, 
  color: string, 
  enterpriseId: string
): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ 
      name, 
      color, 
      enterprise_id: enterpriseId 
    }])
    .select()
    .single();
  
  if (error) {
    console.error('Erreur lors de l\'ajout de la catégorie:', error);
    return null;
  }
  return data;
};

// Modifier une catégorie
export const updateCategory = async (
  id: string, 
  name: string, 
  color: string, 
  enterpriseId: string
): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name, color })
    .eq('id', id)
    .eq('enterprise_id', enterpriseId)
    .select()
    .single();
  
  if (error) {
    console.error('Erreur lors de la mise à jour de la catégorie:', error);
    return null;
  }
  return data;
};

// Supprimer une catégorie
export const deleteCategory = async (
  categoryId: string, 
  enterpriseId: string
): Promise<boolean> => {
  // Vérifier si la catégorie a des produits
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .eq('category_id', categoryId)
    .eq('enterprise_id', enterpriseId);

  if (productsError) {
    console.error('Erreur lors de la vérification des produits:', productsError);
    return false;
  }

  if (products && products.length > 0) {
    console.error('La catégorie contient des produits et ne peut pas être supprimée');
    return false;
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la suppression de la catégorie:', error);
    return false;
  }
  return true;
};

// Récupérer une catégorie par ID
export const getCategoryById = async (
  id: string, 
  enterpriseId: string
): Promise<Category | null> => {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      products:products(*)
    `)
    .eq('id', id)
    .eq('enterprise_id', enterpriseId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération de la catégorie:', error);
    return null;
  }
  return data;
};
