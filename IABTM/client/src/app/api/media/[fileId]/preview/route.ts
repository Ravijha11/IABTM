import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { fileId } = params;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/media/${fileId}/preview`,
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
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error previewing media:', error);
    return NextResponse.json(
      { success: false, message: 'Error previewing media' },
      { status: 500 }
    );
  }
} 