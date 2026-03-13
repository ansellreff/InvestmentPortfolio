import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { convertCurrency, getExchangeRates } from '@/lib/utils/currencyConversion';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ExportData {
  instruments?: Array<{
    symbol: string;
    name: string;
    type: string;
    price?: number;
    currency?: string;
  }>;
  simulation?: Array<{
    symbol: string;
    name: string;
    initialInvestment: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercent: number;
    totalUnits: number;
    avgPricePerUnit: number;
    currentPrice: number;
    currency: string;
  }>;
  oneDriveUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: ExportData = await request.json();
    const workbook = XLSX.utils.book_new();

    // Fetch exchange rates for real-time conversion
    await getExchangeRates();

    // Create Investment Comparison sheet
    if (data.instruments && data.instruments.length > 0) {
      // Convert all values using real-time exchange rates
      const comparisonData = await Promise.all(data.instruments.map(async (inst, idx) => {
        const valueInUSD = await convertCurrency(inst.price || 0, inst.currency || 'USD', 'USD');
        return {
          '#': idx + 1,
          Symbol: inst.symbol,
          Name: inst.name,
          Type: inst.type,
          Price: inst.price || 0,
          Currency: inst.currency || 'USD',
          'Value (USD)': valueInUSD,
          'Last Updated': new Date().toISOString(),
        };
      }));

      const ws1 = XLSX.utils.json_to_sheet(comparisonData);

      // Set column widths
      ws1['!cols'] = [
        { wch: 5 },  // #
        { wch: 12 }, // Symbol
        { wch: 30 }, // Name
        { wch: 10 }, // Type
        { wch: 12 }, // Price
        { wch: 8 },  // Currency
        { wch: 15 }, // Value (USD)
        { wch: 20 }, // Last Updated
      ];

      XLSX.utils.book_append_sheet(workbook, ws1, 'Investment Comparison');
    }

    // Create Simulation Results sheet
    if (data.simulation && data.simulation.length > 0) {
      const simulationData = data.simulation.map((sim, idx) => ({
        '#': idx + 1,
        Symbol: sim.symbol,
        Name: sim.name,
        'Initial Investment': sim.initialInvestment,
        'Current Value': sim.currentValue,
        'Profit/Loss': sim.profitLoss,
        'Return %': sim.profitLossPercent / 100, // Excel format as decimal
        'Total Units': sim.totalUnits,
        'Avg Price/Unit': sim.avgPricePerUnit,
        'Current Price': sim.currentPrice,
        Currency: sim.currency,
      }));

      const ws2 = XLSX.utils.json_to_sheet(simulationData);

      // Set column widths and format
      ws2['!cols'] = [
        { wch: 5 },  // #
        { wch: 12 }, // Symbol
        { wch: 30 }, // Name
        { wch: 18 }, // Initial Investment
        { wch: 15 }, // Current Value
        { wch: 12 }, // Profit/Loss
        { wch: 10 }, // Return %
        { wch: 12 }, // Total Units
        { wch: 15 }, // Avg Price/Unit
        { wch: 12 }, // Current Price
        { wch: 8 },  // Currency
      ];

      XLSX.utils.book_append_sheet(workbook, ws2, 'Simulation Results');
    }

    // Create Settings sheet for OneDrive sync
    const settingsData = [
      { Setting: 'Export Date', Value: new Date().toISOString() },
      { Setting: 'Auto-Sync', Value: 'Enabled (Requires Microsoft Graph Setup)' },
      { Setting: 'Update Frequency', Value: 'Real-time (when connected)' },
      { Setting: 'OneDrive URL', Value: data.oneDriveUrl || 'Not configured' },
      { Setting: 'Instructions', Value: 'To enable auto-sync: 1) Register app in Azure AD 2) Add Client ID to .env.local 3) Connect Microsoft Graph API' },
    ];

    const ws3 = XLSX.utils.json_to_sheet(settingsData);
    ws3['!cols'] = [{ wch: 25 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, ws3, 'Settings & Info');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    const filename = `investment-advisor-${new Date().toISOString().split('T')[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export to Excel',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check OneDrive connection status
export async function GET() {
  return NextResponse.json({
    success: true,
    oneDrive: {
      connected: false,
      message: 'OneDrive auto-sync requires Microsoft Graph API setup',
      instructions: {
        step1: 'Register your app in Azure Active Directory',
        step2: 'Add Microsoft Graph API permissions (Files.ReadWrite)',
        step3: 'Configure Client ID and Secret in environment variables',
        step4: 'Set up OAuth 2.0 authorization flow',
      },
      envVariables: {
        MICROSOFT_CLIENT_ID: 'Your Azure AD Client ID',
        MICROSOFT_CLIENT_SECRET: 'Your Azure AD Client Secret',
        MICROSOFT_TENANT_ID: 'Your Azure AD Tenant ID',
      },
    },
  });
}
