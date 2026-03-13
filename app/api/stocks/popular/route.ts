import { NextResponse } from 'next/server';
import { getPopularStocks } from '@/lib/api/realtime';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const stocks = await getPopularStocks();

    return NextResponse.json({
      success: true,
      data: stocks,
    });
  } catch (error) {
    console.error('Error getting popular stocks:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get popular stocks',
      },
      { status: 500 }
    );
  }
}
