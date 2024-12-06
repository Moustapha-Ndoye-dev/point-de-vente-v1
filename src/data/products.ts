import { supabase } from '../supabaseClient';
import { Product } from '../types/types';

// Récupérer tous les produits avec filtre optionnel par catégorie
export const fetchProducts = async (categoryId?: string): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      price,
      stock,
      description,
      category_id,
      image_url,
      category:categories(*)
    `);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }

  // Mapper les résultats pour correspondre à notre interface Product
  return data.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    stock: item.stock,
    description: item.description,
    categoryId: item.category_id,
    imageUrl: item.image_url,
    category: item.category ? item.category[0] : null
  }));
};

// Ajouter un produit
export const addProduct = async (productData: Omit<Product, 'id'>): Promise<Product | null> => {
  try {
    // Vérifier et convertir les valeurs numériques
    const price = Number(productData.price);
    const stock = Number(productData.stock);

    if (isNaN(price) || isNaN(stock)) {
      throw new Error('Prix ou stock invalide');
    }

    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        price: price,
        stock: stock,
        description: productData.description || null,
        category_id: productData.categoryId,
        image_url: productData.imageUrl || null
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
  productData: Partial<Omit<Product, 'id'>>
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
    .select();

  if (error) {
    console.error('Erreur lors de la mise à jour du produit:', error);
    return null;
  }
  return data[0];
};

// Supprimer un produit
export const deleteProduct = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    return false;
  }
  return true;
};

// Récupérer un produit par ID
export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('id', id)
    .single();
  if (error) {
    console.error('Erreur lors de la récupération du produit:', error);
    return null;
  }
  return data;
}; 