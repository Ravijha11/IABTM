import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/${groupId}/block`,
      {
        method: 'POST',
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
    console.error('Error blocking group:', error);
    return NextResponse.json(
      { success: false, message: 'Error blocking group' },
      { status: 500 }
    );
  }
} 