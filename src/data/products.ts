import { supabase } from '../supabaseClient';
import { Product } from '../types/types';

// Récupérer tous les produits pour une entreprise
export const fetchProducts = async (enterpriseId: string): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        id,
        name
      )
    `)
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }

  return data.map(product => ({
    id: product.id,
    name: product.name,
    price: product.price,
    stock: product.stock,
    description: product.description,
    categoryId: product.category_id,
    category: product.categories,
    imageUrl: product.image_url,
    enterpriseId: product.enterprise_id,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  }));
};

// Ajouter un produit
export const addProduct = async (
  productData: Omit<Product, 'id'>, 
  enterpriseId: string
): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        price: productData.price,
        stock: productData.stock,
        description: productData.description || null,
        category_id: productData.categoryId,
        image_url: productData.imageUrl || null,
        enterprise_id: enterpriseId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit:', error);
    return null;
  }
};

// Modifier un produit
export const updateProduct = async (
  id: string,
  productData: Partial<Omit<Product, 'id'>>,
  enterpriseId: string
): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .update({
      name: productData.name,
      price: productData.price,
      stock: productData.stock,
      description: productData.description || null,
      category_id: productData.categoryId,
      image_url: productData.imageUrl || null
    })
    .eq('id', id)
    .eq('enterprise_id', enterpriseId)
    .select();

  if (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    return null;
  }
  return data[0];
};

// Supprimer un produit
export const deleteProduct = async (id: string, enterpriseId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    return false;
  }
  return true;
};

// Récupérer un produit par ID
export const fetchProductById = async (id: string, enterpriseId: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .eq('enterprise_id', enterpriseId)
    .single();

  if (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return null;
  }
  return data;
};

// Mettre à jour le stock d'un produit
export const updateProductStock = async (
  id: string, 
  newStock: number,
  enterpriseId: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .update({ stock: newStock })
    .eq('id', id)
    .eq('enterprise_id', enterpriseId);

  if (error) {
    console.error('Erreur lors de la mise à jour du stock:', error);
    return false;
  }
  return true;
};