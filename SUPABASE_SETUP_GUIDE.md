# 🗄️ Supabase Setup Guide for Vegetable Checkout System

## Step 1: Get Your Supabase Credentials

1. **Go to your Supabase project dashboard**
2. **Navigate to Settings > API**
3. **Copy the following values:**
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (long string starting with `eyJ...`)

## Step 2: Update Your React App Configuration

1. **Open `src/lib/supabase.js`**
2. **Replace the placeholder values:**

```javascript
const supabaseUrl = 'https://your-actual-project-id.supabase.co'  // Your Project URL
const supabaseKey = 'your-actual-anon-key-here'  // Your Anon Key
```

## Step 3: Set Up the Database

1. **Go to your Supabase project dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the entire contents of `database-setup.sql`**
4. **Click "Run" to execute the script**

## Step 4: Verify the Setup

After running the SQL script, you should see:
- ✅ "Database setup completed successfully!"
- ✅ A count of vegetables (should be 12)
- ✅ A list of all vegetables with their pricing

## Step 5: Test Your App

1. **Start your React app:** `npm start`
2. **Scan a vegetable** (try potato, tomato, onion, etc.)
3. **Check if pricing appears** in the receipt
4. **Try adding items to cart**

## 🔧 Database Schema Overview

### `vegetables` Table
- **id**: Primary key
- **name**: Vegetable name (unique)
- **average_weight_per_unit_g**: Average weight per unit in grams
- **average_area_per_unit_mm2**: Average area per unit in mm²
- **price_per_500g**: Price per 500g (for weight-based pricing)
- **price_per_unit**: Price per unit (for unit-based pricing)
- **price_per_packet**: Price per packet (for packet-based pricing)
- **pricing_unit**: How the vegetable is priced ('per_500g', 'per_unit', 'per_packet')

### `checkout_items` Table
- **id**: Primary key
- **session_id**: Unique session identifier
- **vegetable_id**: Reference to vegetables table
- **vegetable_name**: Name of the vegetable
- **weight_g**: Weight in grams
- **quantity**: Number of items
- **unit_price**: Price per unit
- **total_price**: Total price for this item
- **confidence_score**: AI confidence score
- **created_at**: Timestamp

## 🚨 Troubleshooting

### Error: "Invalid supabaseUrl"
- Make sure your URL starts with `https://`
- Check that you copied the full URL from Supabase dashboard

### Error: "Invalid API key"
- Make sure you're using the **anon/public** key, not the service role key
- Check that the key is complete (no truncation)

### No pricing data showing
- Verify the database setup completed successfully
- Check that vegetables were inserted (run: `SELECT COUNT(*) FROM vegetables;`)
- Make sure your vegetable names match the database entries

### Cart not updating
- Check browser console for errors
- Verify RLS policies are set correctly
- Make sure session_id is being generated properly

## 📊 Expected Results

After successful setup, you should be able to:
1. ✅ Scan vegetables and see pricing
2. ✅ Add items to cart
3. ✅ See running total
4. ✅ Remove items from cart
5. ✅ Clear entire cart

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for error messages
2. Verify your Supabase credentials are correct
3. Make sure the database setup completed without errors
4. Test with a simple vegetable like "potato" or "tomato"
