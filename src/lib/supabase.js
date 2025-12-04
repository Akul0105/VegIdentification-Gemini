import { createClient } from '@supabase/supabase-js'

// Supabase project credentials
const supabaseUrl = 'https://gsrwhuqurkzyhibryoby.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzcndodXF1cmt6eWhpYnJ5b2J5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTczOTYsImV4cCI6MjA3Njk5MzM5Nn0.qVzmiSCYHbPqFgFF8RthVnMn13zeTDUSA8dWvZ56RAY'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper functions for vegetable operations
export const vegetableService = {
  // Get all vegetables
  async getAllVegetables() {
    const { data, error } = await supabase
      .from('vegetables')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Find vegetable by name (fuzzy search with multiple attempts)
  async findVegetableByName(name) {
    if (!name) return null;
    
    // Clean the name and try different variations
    const cleanName = name.toLowerCase().trim();
    
    // Try exact match first
    let { data, error } = await supabase
      .from('vegetables')
      .select('*')
      .ilike('name', cleanName)
      .limit(1)
      .single()
    
    if (data) return data;
    
    // Try partial match
    const { data: partialData, error: partialError } = await supabase
      .from('vegetables')
      .select('*')
      .ilike('name', `%${cleanName}%`)
      .limit(1)
      .single()
    
    if (partialData) return partialData;
    
    // Try specific vegetable name mappings
    const nameMappings = {
      'potato': 'Potato',
      'potatoes': 'Potato',
      'tomato': 'Tomato',
      'tomatoes': 'Tomato',
      'onion': 'Onion',
      'onions': 'Onion',
      'carrot': 'Carrot',
      'carrots': 'Carrot',
      'lettuce': 'Lettuce',
      'cabbage': 'Cabbage',
      'cauliflower': 'Cauliflower',
      'eggplant': 'Eggplant',
      'ginger': 'Ginger',
      'garlic': 'Garlic',
      'mint': 'Mint',
      'bok choy': 'Chinese Cabbage (Bok choy)',
      'chinese cabbage': 'Chinese Cabbage (Bok choy)',
      'spring onion': 'Onion Spring',
      'onion spring': 'Onion Spring'
    };
    
    const mappedName = nameMappings[cleanName];
    if (mappedName) {
      const { data: mappedData, error: mappedError } = await supabase
        .from('vegetables')
        .select('*')
        .eq('name', mappedName)
        .limit(1)
        .single()
      
      if (mappedData) return mappedData;
    }
    
    return null;
  },

  // Calculate price for a vegetable
  async calculatePrice(vegetableName, weightG) {
    const { data, error } = await supabase
      .rpc('calculate_vegetable_price', {
        p_vegetable_name: vegetableName,
        p_weight_g: weightG
      })
    
    if (error) throw error
    return data
  },

  // Add item to checkout
  async addToCheckout(sessionId, vegetableData) {
    const { data, error } = await supabase
      .from('checkout_items')
      .insert([{
        session_id: sessionId,
        vegetable_id: vegetableData.id,
        vegetable_name: vegetableData.name,
        weight_g: vegetableData.weight,
        unit_price: vegetableData.unitPrice,
        total_price: vegetableData.totalPrice,
        confidence_score: vegetableData.confidence
      }])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Get checkout items for session
  async getCheckoutItems(sessionId) {
    const { data, error } = await supabase
      .from('checkout_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get cart total
  async getCartTotal(sessionId) {
    const { data, error } = await supabase
      .rpc('get_cart_total', {
        p_session_id: sessionId
      })
    
    if (error) throw error
    return data
  },

  // Remove item from checkout
  async removeFromCheckout(itemId) {
    const { error } = await supabase
      .from('checkout_items')
      .delete()
      .eq('id', itemId)
    
    if (error) throw error
  },

  // Clear checkout session
  async clearCheckout(sessionId) {
    const { error } = await supabase
      .from('checkout_items')
      .delete()
      .eq('session_id', sessionId)
    
    if (error) throw error
  }
}
