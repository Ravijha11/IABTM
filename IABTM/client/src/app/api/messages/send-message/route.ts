import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, groupId, recipientId } = body;

    if (!content || (!groupId && !recipientId)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Content and either groupId or recipientId are required',
          error: 'missing_required_fields'
        },
        { status: 400 }
      );
    }

    console.log('📡 Sending message via API:', { content, groupId, recipientId });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          content: content.trim(),
          groupId,
          recipientId
        }),
      }
    );

    if (!response.ok) {
      // Handle specific error codes
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
      
      if (response.status === 403) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'You are not authorized to send messages to this chat.',
            error: 'forbidden'
          },
          { status: 403 }
        );
      }
      
      // Try to get error message from response
      let errorMessage = `Backend responded with status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // If we can't parse the error response, use the default message
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          error: 'backend_error'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data.data || data.message,
      statusCode: data.statusCode
    });
  } catch (error) {
    console.error('Error sending message:', error);
    
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
        message: 'Error sending message. Please try again.',
        error: 'unknown_error'
      },
      { status: 500 }
    );
  }
} 