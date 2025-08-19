import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Client-side: Fetching all users from backend...');
    
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/get-all-users`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
      }
    );

    console.log('📦 Client-side: Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Client-side: Backend error response:', errorText);
      throw new Error(`Backend responded with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Client-side: Backend data received:', {
      success: data.success,
      message: data.message,
      userCount: data.data?.length || 0
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Client-side: Error fetching all users:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error fetching all users',
        data: []
      },
      { status: 500 }
    );
  }
} 