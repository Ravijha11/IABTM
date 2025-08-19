import { getAllEssentialsProducts, getEssentialsProductsByCollection } from '@/lib/shopify/essentialsStoreFront';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get('handle');
  const firstParam = searchParams.get('first');
  const first = firstParam ? Number(firstParam) : 10;

  try {
    // If handle is provided, get products by collection
    if (handle) {
      const products = await getEssentialsProductsByCollection(handle);
      return NextResponse.json(products, { status: 200 });
    } 
    // Otherwise, get all products
    else {
      const products = await getAllEssentialsProducts(first);
      return NextResponse.json(products, { status: 200 });
    }
  } catch (error) {
    console.error('❌ Essentials API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch essentials products' },
      { status: 500 }
    );
  }
} 