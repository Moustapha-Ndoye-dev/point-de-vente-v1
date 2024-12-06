// src/data/categoryService.ts
import { supabase } from '../supabaseClient';
import { Category } from '../types/types';

// Cette fonction permet de récupérer toutes les catégories de la base de données.
export const fetchCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase
      .from('categories')
      .select('*'); // Cette ligne sélectionne toutes les colonnes de la table 'categories'.
   if (error) {
      console.error('Erreur lors de la récupération des catégories:', error);
      return []; // Si une erreur survient, cette fonction renvoie un tableau vide.
  }
  return data; // Si tout se passe bien, cette fonction renvoie les données récupérées.
};

// Cette fonction permet d'ajouter une nouvelle catégorie à la base de données.
export const addCategory = async (name: string, color: string): Promise<Category | null> => {
  const { data, error } = await supabase
      .from('categories')
      .insert([{ name, color }]) // Cette ligne insère une nouvelle ligne dans la table 'categories' avec le nom et la couleur spécifiés.
      .single(); // Cette fonctionnalité permet de récupérer la ligne insérée.
   if (error) {
      console.error('Erreur lors de l\'ajout de la catégorie:', error);
      return null; // Si une erreur survient, cette fonction renvoie null.
  }
  return data; // Si tout se passe bien, cette fonction renvoie la catégorie ajoutée.
};

// Cette fonction permet de modifier une catégorie existante dans la base de données.
export const updateCategory = async (id: string, name: string, color: string): Promise<Category | null> => {
  const { data, error } = await supabase
      .from('categories')
      .update({ name, color }) // Cette ligne met à jour le nom et la couleur d'une catégorie spécifiée.
      .eq('id', id) // Cette ligne spécifie l'identifiant de la catégorie à mettre à jour.
      .single(); // Cette fonctionnalité permet de récupérer la ligne mise à jour.
   if (error) {
      console.error('Erreur lors de la mise à jour de la catégorie:', error);
      return null; // Si une erreur survient, cette fonction renvoie null.
  }
  return data; // Si tout se passe bien, cette fonction renvoie la catégorie mise à jour.
};

// Cette fonction permet de supprimer une catégorie de la base de données.
export const deleteCategory = async (id: string): Promise<boolean> => {
  const { error } = await supabase
      .from('categories')
      .delete() // Cette ligne supprime une ligne de la table 'categories'.
      .eq('id', id); // Cette ligne spécifie l'identifiant de la catégorie à supprimer.
   if (error) {
      console.error('Erreur lors de la suppression de la catégorie:', error);
      return false; // Si une erreur survient, cette fonction renvoie false.
  }
  return true; // Si tout se passe bien, cette fonction renvoie true.
};

// Cette fonction permet de récupérer une catégorie spécifique par son identifiant.
export const fetchCategoryById = async (id: string): Promise<Category | null> => {
  const { data, error } = await supabase
      .from('categories')
      .select('*') // Cette ligne sélectionne toutes les colonnes de la table 'categories'.
      .eq('id', id) // Cette ligne spécifie l'identifiant de la catégorie à récupérer.
      .single(); // Cette fonctionnalité permet de récupérer la ligne correspondante.
   if (error) {
      console.error('Erreur lors de la récupération de la catégorie par ID:', error);
      return null; // Si une erreur survient, cette fonction renvoie null.
  }
  return data; // Si tout se passe bien, cette fonction renvoie la catégorie récupérée.
};