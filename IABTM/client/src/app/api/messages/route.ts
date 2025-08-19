import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipientId');
    const groupId = searchParams.get('groupId');
    const limit = searchParams.get('limit') || '50';
    const cursor = searchParams.get('cursor');

    // Determine the correct backend endpoint based on parameters
    let backendUrl: string;
    
    if (groupId) {
      // For group messages, use the group-specific endpoint
      backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/group/${groupId}`;
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit);
      if (cursor) queryParams.append('cursor', cursor);
      backendUrl += `?${queryParams.toString()}`;
    } else if (recipientId) {
      // For direct messages, use the direct-specific endpoint
      backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/direct/${recipientId}`;
      const queryParams = new URLSearchParams();
      queryParams.append('limit', limit);
      if (cursor) queryParams.append('cursor', cursor);
      backendUrl += `?${queryParams.toString()}`;
    } else {
      // For conversations list
      backendUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/conversations`;
    }

    console.log('📡 Fetching messages from:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      credentials: 'include',
    });

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
    
    // Transform the response format to match frontend expectations
    if (data.message && data.message.messages) {
      // Backend returns: { data: "success", message: { messages: [...], pagination: {...} } }
      // Frontend expects: { data: { messages: [...], pagination: {...} } }
      return NextResponse.json({
        success: data.success,
        data: data.message,
        statusCode: data.statusCode
      });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    
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
        message: 'Error fetching messages. Please try again.',
        error: 'unknown_error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/messages/send-message`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
        body: JSON.stringify(body),
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
    
    // Transform the response format to match frontend expectations
    if (data.message && data.message._id) {
      // Backend returns: { data: "success", message: { _id: "...", content: "...", ... } }
      // Frontend expects: { data: { _id: "...", content: "...", ... } }
      return NextResponse.json({
        success: data.success,
        data: data.message,
        statusCode: data.statusCode
      });
    }
    
    return NextResponse.json(data);
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