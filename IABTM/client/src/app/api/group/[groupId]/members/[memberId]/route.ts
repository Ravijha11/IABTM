import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { groupId: string; memberId: string } }
) {
  try {
    const { groupId, memberId } = params;

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/${groupId}/members/${memberId}`,
      {
        method: 'DELETE',
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
    console.error('Error removing group member:', error);
    return NextResponse.json(
      { success: false, message: 'Error removing group member' },
      { status: 500 }
    );
  }
} 