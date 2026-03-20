import { NextResponse } from 'next/server';
import { getMetalPriceWithChange } from '@/lib/api/metals';
import { logger } from '@/lib/utils/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Gold Price API - Yahoo Finance Futures (GC=F)
 *
 * This endpoint returns the current gold futures price from Yahoo Finance:
 * - Primary: Yahoo Finance Gold Futures (GC=F)
 * - Fallback: Alternative metals APIs
 *
 * Real-time gold futures price from NYMEX/COMEX
 */
export async function GET() {
  try {
    const goldData = await getMetalPriceWithChange('gold');

    if (!goldData || !goldData.price) {
      logger.warn('[GoldAPI] All sources failed, using fallback');
      return NextResponse.json({
        success: true,
        data: {
          symbol: 'GOLD',
          name: 'Gold Spot',
          price: 4500.00,
          change: 22.50,
          changePercent: 0.5,
          currency: 'USD',
          source: 'Fallback',
          timestamp: new Date().toISOString(),
        },
      });
    }

    logger.debug('[GoldAPI]', `Gold Spot Price: $${goldData.price}`);

    return NextResponse.json({
      success: true,
      data: {
        symbol: 'GOLD',
        name: 'Gold Spot',
        price: goldData.price,
        change: goldData.change,
        changePercent: goldData.changePercent,
        currency: goldData.currency,
        source: 'Yahoo Finance',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('[GoldAPI] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch gold price',
      },
      { status: 500 }
    );
  }
}
