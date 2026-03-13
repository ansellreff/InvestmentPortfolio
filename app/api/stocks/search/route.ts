import { NextRequest, NextResponse } from 'next/server';
import { searchStocks as realtimeSearch } from '@/lib/api/realtime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query parameter "q" is required',
        },
        { status: 400 }
      );
    }

    const results = await realtimeSearch(query);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error searching stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search stocks',
      },
      { status: 500 }
    );
  }
}
