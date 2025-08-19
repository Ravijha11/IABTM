import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const body = await request.json();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/${groupId}/rules`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating group rules:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating group rules' },
      { status: 500 }
    );
  }
} 