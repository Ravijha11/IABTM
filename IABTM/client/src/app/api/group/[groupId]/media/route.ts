import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/${groupId}/media`,
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
    console.error('Error fetching group media:', error);
    return NextResponse.json(
      { success: false, message: 'Error fetching group media' },
      { status: 500 }
    );
  }
} 