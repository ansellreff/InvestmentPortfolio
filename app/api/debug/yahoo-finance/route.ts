import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get('symbol') || 'GC=F';

  const results = {
    symbol,
    tests: [] as any[],
  };

  // Test 1: Direct fetch to Yahoo Finance
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    results.tests.push({
      name: 'Direct Yahoo Finance Fetch',
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    if (response.ok) {
      const data = await response.json();
      results.tests.push({
        name: 'Response Structure',
        hasChart: !!data.chart,
        hasResult: !!data.chart?.result,
        resultLength: data.chart?.result?.length,
        firstResultKeys: data.chart?.result?.[0] ? Object.keys(data.chart?.result?.[0]) : [],
      });

      if (data.chart?.result?.[0]) {
        const result = data.chart?.result?.[0];
        results.tests.push({
          name: 'Data Availability',
          hasMeta: !!result.meta,
          hasTimestamp: !!result.timestamp,
          timestampLength: result.timestamp?.length,
          hasIndicators: !!result.indicators,
          hasQuote: !!result.indicators?.quote?.[0],
        });
      }
    }
  } catch (error: any) {
    results.tests.push({
      name: 'Direct Yahoo Finance Fetch',
      error: error.message,
    });
  }

  // Test 2: Without User-Agent
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
    const response = await fetch(url);

    results.tests.push({
      name: 'Fetch Without User-Agent',
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });
  } catch (error: any) {
    results.tests.push({
      name: 'Fetch Without User-Agent',
      error: error.message,
    });
  }

  return NextResponse.json(results);
}
