import { NextResponse } from 'next/server';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Silver Price API - Reliable Metals Price Source
 */
export async function GET() {
  try {
    const silverData = await getMetalPriceWithChange('silver');

    if (!silverData || !silverData.price) {
      logger.warn('[SilverAPI] All sources failed, using fallback');
      return NextResponse.json({
        success: true,
        data: {
          symbol: 'SILVER',
          name: 'Silver Spot',
          price: 32.50,
          change: 0.45,
          changePercent: 1.40,
          currency: 'USD',
          source: 'Fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.debug('[SilverAPI]', `Silver Spot Price: $${silverData.price}`);

    return NextResponse.json({
      success: true,
      data: {
        symbol: 'SILVER',
        name: 'Silver Spot',
        price: silverData.price,
        change: silverData.change,
        changePercent: silverData.changePercent,
        currency: silverData.currency,
        source: 'Yahoo Finance',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[SilverAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch silver price',
      },
      { status: 500 }
    );
  }
}
