import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { BinanceClient, BinanceEncryption } from '@/lib/api/binance';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if prisma is properly initialized
    if (!prisma || typeof prisma.binanceConnection !== 'object') {
      console.error('[BinanceConnect] Prisma client not properly initialized');
      return NextResponse.json(
        {
          success: false,
          error: 'Database not initialized. Please restart the development server.',
          details: 'Stop the dev server (Ctrl+C), then run `npm run dev` again'
        },
        { status: 500 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { apiKey, apiSecret, testnet = false } = body;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { success: false, error: 'API key and secret are required' },
        { status: 400 }
      );
    }

    // Trim whitespace
    const trimmedApiKey = apiKey.trim();
    const trimmedApiSecret = apiSecret.trim();

    // Validate the API keys by making a test request
    const client = new BinanceClient(trimmedApiKey, trimmedApiSecret, testnet);
    const validation = await client.validateKeys();

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || 'Invalid API keys or insufficient permissions',
          details: validation.details
        },
        { status: 400 }
      );
    }

    // Check if user already has a connection
    const existingConnection = await prisma.binanceConnection.findUnique({
      where: { userId },
    });

    // Encrypt the API keys
    const encryptedKey = BinanceEncryption.encrypt(trimmedApiKey);
    const encryptedSecret = BinanceEncryption.encrypt(trimmedApiSecret);

    if (existingConnection) {
      // Update existing connection
      await prisma.binanceConnection.update({
        where: { userId },
        data: {
          apiKey: encryptedKey,
          apiSecret: encryptedSecret,
          testnet,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new connection
      await prisma.binanceConnection.create({
        data: {
          userId,
          apiKey: encryptedKey,
          apiSecret: encryptedSecret,
          testnet,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Binance account connected successfully',
    });
  } catch (error) {
    console.error('[BinanceConnect] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to connect Binance account',
      },
      { status: 500 }
    );
  }
}
