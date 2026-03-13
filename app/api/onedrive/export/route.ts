import { NextRequest, NextResponse } from 'next/server';
import { convertCurrency, getExchangeRates } from '@/lib/utils/currencyConversion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const { instruments } = await request.json();

    if (!instruments || !Array.isArray(instruments)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: instruments array required',
        },
        { status: 400 }
      );
    }

    // Fetch exchange rates for real-time conversion
    await getExchangeRates();

    // For now, return CSV data that can be downloaded
    // In production, this would use Microsoft Graph API to create an Excel file in OneDrive

    const headers = ['Symbol', 'Name', 'Type', 'Price', 'Currency', 'Value (USD)', 'Timestamp'];
    const rows = await Promise.all(instruments.map(async (inst: any) => {
      // Convert to USD using real-time exchange rates
      const priceInUSD = await convertCurrency(inst.price || 0, inst.currency || 'USD', 'USD');
      return [
        inst.symbol,
        inst.name,
        inst.type,
        (inst.price || 0).toString(),
        inst.currency || 'USD',
        priceInUSD.toFixed(2),
        new Date().toISOString(),
      ].join(',');
    }));

    const csv = [headers.join(','), ...rows].join('\n');

    // Return as downloadable file
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="investment-comparison-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export data',
      },
      { status: 500 }
    );
  }
}
