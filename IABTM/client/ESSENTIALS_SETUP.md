# Essentials Section Setup Guide

This guide explains how to set up the Essentials section that fetches products from `ptuev0-g4.myshopify.com`.

## Overview

The Essentials section is a complete e-commerce interface that:
- Fetches products from a separate Shopify store (`ptuev0-g4.myshopify.com`)
- Uses the same cart functionality as the main shop
- Provides filtering, sorting, and product detail pages
- Integrates seamlessly with the existing dashboard

## Files Created/Modified

### New Files:
1. `src/lib/shopify/essentialsStoreFront.ts` - Shopify client for essentials store
2. `src/app/api/essentials/route.ts` - API route for essentials products
3. `src/hooks/useEssentialsProducts.ts` - React Query hooks for essentials
4. `src/components/Essentials/EssentialsSection.tsx` - Main essentials component
5. `src/components/Essentials/EssentialsProductCard.tsx` - Product card for essentials
6. `src/app/essentials/[productID]/page.tsx` - Product detail page for essentials

### Modified Files:
1. `src/app/dashboard/page.tsx` - Added Essentials component to dashboard
2. `create-env.js` - Added environment variable for essentials store

## Setup Instructions

### 1. Environment Variables

You need to add the Shopify storefront access token for the essentials store. Update your `.env.local` file:

```bash
# Shopify Essentials Store Configuration
SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN=YOUR_ACTUAL_TOKEN_HERE
```

**To get the access token:**
1. Go to your Shopify admin panel for `ptuev0-g4.myshopify.com`
2. Navigate to Settings > Apps and sales channels > Develop apps
3. Create a new app or use an existing one
4. Configure Storefront API access
5. Copy the Storefront access token

### 2. Shopify Store Setup

Ensure your Shopify store (`ptuev0-g4.myshopify.com`) has:
- Products with images, titles, descriptions, and prices
- Storefront API enabled
- Proper access permissions for the API token

### 3. Running the Application

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
node create-env.js
```

3. Update the `SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN` in `.env.local`

4. Start the development server:
```bash
npm run dev
```

## Features

### Essentials Section Features:
- **Product Grid**: Displays all products from the essentials store
- **Filtering**: Price range, categories, and themes
- **Sorting**: By price (low/high), name, or featured
- **Product Details**: Full product pages with images, descriptions, and add to cart
- **Cart Integration**: Uses the same cart context as the main shop
- **Responsive Design**: Works on mobile and desktop

### Cart Functionality:
- Add products to cart from essentials section
- View cart count in header
- Navigate to cart page
- Same cart persists across shop and essentials

## API Endpoints

### `/api/essentials`
- `GET /api/essentials` - Get all products
- `GET /api/essentials?first=20` - Get first 20 products
- `GET /api/essentials?handle=collection-handle` - Get products by collection

## Navigation

- **Dashboard**: Essentials section is accessible from the sidebar
- **Product Details**: Click on any product to view details
- **Cart**: Cart icon in header shows count and links to cart page
- **Back Navigation**: Back button returns to dashboard

## Troubleshooting

### Common Issues:

1. **"Shopify essentials storefront access token is missing"**
   - Check that `SHOPIFY_ESSENTIALS_STOREFRONT_ACCESS_TOKEN` is set in `.env.local`
   - Restart the development server after updating environment variables

2. **"Failed to fetch essentials products"**
   - Verify the access token is correct
   - Check that the Shopify store has products
   - Ensure Storefront API is enabled in Shopify admin

3. **Products not loading**
   - Check browser console for errors
   - Verify the Shopify store domain is correct
   - Ensure products are published and available

### Debug Mode:

To debug API calls, check the browser's Network tab and look for requests to `/api/essentials`.

## Customization

### Styling:
- Modify `EssentialsSection.tsx` for layout changes
- Update `EssentialsProductCard.tsx` for product card styling
- Use Tailwind CSS classes for styling

### Functionality:
- Add new filters in the sidebar
- Modify sorting options
- Add new product fields as needed

## Security Notes

- Keep your Shopify access tokens secure
- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production use 