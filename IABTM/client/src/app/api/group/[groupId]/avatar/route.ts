import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const { groupId } = params;
    const formData = await request.formData();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/group/${groupId}/avatar`,
      {
        method: 'PUT',
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
        credentials: 'include',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating group avatar:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating group avatar' },
      { status: 500 }
    );
  }
} 