import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/conversations`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
      }
    );

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 503) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Database temporarily unavailable. Please try again in a few moments.',
            error: 'database_unavailable'
          },
          { status: 503 }
        );
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Authentication required. Please log in again.',
            error: 'unauthorized'
          },
          { status: 401 }
        );
      }
      
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    
    // Check if it's a network error
    if (error instanceof Error && (error.message.includes('fetch') || error.message.includes('network'))) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Unable to connect to server. Please check your internet connection.',
          error: 'network_error'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error fetching conversations. Please try again.',
        error: 'unknown_error'
      },
      { status: 500 }
    );
  }
} 