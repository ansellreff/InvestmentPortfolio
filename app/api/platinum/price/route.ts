import { NextResponse } from 'next/server';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Platinum Price API - Reliable Metals Price Source
 */
export async function GET() {
  try {
    const platinumData = await getMetalPriceWithChange('platinum');

    if (!platinumData || !platinumData.price) {
      logger.warn('[PlatinumAPI] All sources failed, using fallback');
      return NextResponse.json({
        success: true,
        data: {
          symbol: 'PLATINUM',
          name: 'Platinum Spot',
          price: 950.00,
          change: 5.20,
          changePercent: 0.55,
          currency: 'USD',
          source: 'Fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.debug('[PlatinumAPI]', `Platinum Spot Price: $${platinumData.price}`);

    return NextResponse.json({
      success: true,
      data: {
        symbol: 'PLATINUM',
        name: 'Platinum Spot',
        price: platinumData.price,
        change: platinumData.change,
        changePercent: platinumData.changePercent,
        currency: platinumData.currency,
        source: 'Yahoo Finance',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[PlatinumAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch platinum price',
      },
      { status: 500 }
    );
  }
}
