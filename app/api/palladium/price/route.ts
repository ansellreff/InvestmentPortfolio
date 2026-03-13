import { NextResponse } from 'next/server';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Palladium Price API - Reliable Metals Price Source
 */
export async function GET() {
  try {
    const palladiumData = await getMetalPriceWithChange('palladium');

    if (!palladiumData || !palladiumData.price) {
      logger.warn('[PalladiumAPI] All sources failed, using fallback');
      return NextResponse.json({
        success: true,
        data: {
          symbol: 'PALLADIUM',
          name: 'Palladium Spot',
          price: 1050.00,
          change: 6.00,
          changePercent: 0.57,
          currency: 'USD',
          source: 'Fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.debug('[PalladiumAPI]', `Palladium Spot Price: $${palladiumData.price}`);

    return NextResponse.json({
      success: true,
      data: {
        symbol: 'PALLADIUM',
        name: 'Palladium Spot',
        price: palladiumData.price,
        change: palladiumData.change,
        changePercent: palladiumData.changePercent,
        currency: palladiumData.currency,
        source: 'Metals Live API',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[PalladiumAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch palladium price',
      },
      { status: 500 }
    );
  }
}
