import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call the backend logout endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/api/user/auth/logout`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Backend logout failed');
    }

    // Create response with cleared cookies
    const nextResponse = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear all authentication-related cookies
    nextResponse.cookies.delete('token');
    nextResponse.cookies.delete('authToken');
    nextResponse.cookies.delete('refreshToken');
    nextResponse.cookies.delete('session');

    // Set cache control headers
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    nextResponse.headers.set('Pragma', 'no-cache');
    nextResponse.headers.set('Expires', '0');

    return nextResponse;
  } catch (error) {
    console.error('Logout error:', error);
    
    // Even if backend fails, clear client-side cookies
    const errorResponse = NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );

    // Clear cookies even on error
    errorResponse.cookies.delete('token');
    errorResponse.cookies.delete('authToken');
    errorResponse.cookies.delete('refreshToken');
    errorResponse.cookies.delete('session');

    return errorResponse;
  }
} 