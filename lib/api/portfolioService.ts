/**
 * Portfolio Service Layer
 * Handles portfolio CRUD operations with database synchronization
 * Provides optimistic updates with rollback on error
 */

import { logger } from '@/lib/utils/logger';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  quantity: number;
  averageBuyPrice: number;
  currency: string;
  addedAt: string;
  notes?: string;
}

export interface ApiPosition {
  id: string;
  symbol: string;
  name: string;
  type: 'GOLD' | 'STOCK' | 'SILVER' | 'PLATINUM' | 'PALLADIUM' | 'CRYPTO';
  quantity: number;
  avgBuyPrice: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch portfolio from database for authenticated user
 */
export async function fetchPortfolio(): Promise<ApiPosition[]> {
  try {
    const response = await fetch('/api/user/portfolio');

    if (!response.ok) {
      throw new Error(`Failed to fetch portfolio: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      return result.data;
    }

    return [];
  } catch (error) {
    logger.error('[PortfolioService] Error fetching portfolio:', error);
    return [];
  }
}

/**
 * Add position to database
 */
export async function addPortfolioPosition(
  position: Omit<Position, 'id' | 'addedAt'>
): Promise<ApiPosition | null> {
  try {
    const response = await fetch('/api/user/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: position.symbol,
        name: position.name,
        type: position.type,
        quantity: position.quantity,
        avgBuyPrice: position.averageBuyPrice,
        currency: position.currency,
        notes: position.notes,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add position');
    }

    const result = await response.json();

    if (result.success) {
      logger.api('[PortfolioService]', `Added position: ${position.symbol}`);
      return result.data;
    }

    return null;
  } catch (error) {
    logger.error('[PortfolioService] Error adding position:', error);
    throw error;
  }
}

/**
 * Update position in database
 */
export async function updatePortfolioPosition(
  symbol: string,
  updates: Partial<Omit<Position, 'id' | 'symbol' | 'addedAt'>>
): Promise<ApiPosition | null> {
  try {
    const response = await fetch('/api/user/portfolio', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol,
        ...updates,
        // Map frontend field names to backend
        ...(updates.averageBuyPrice !== undefined && { avgBuyPrice: updates.averageBuyPrice }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        quantity: updates.quantity,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update position');
    }

    const result = await response.json();

    if (result.success) {
      logger.api('[PortfolioService]', `Updated position: ${symbol}`);
      return result.data;
    }

    return null;
  } catch (error) {
    logger.error('[PortfolioService] Error updating position:', error);
    throw error;
  }
}

/**
 * Delete position from database
 */
export async function deletePortfolioPosition(symbol: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/user/portfolio?symbol=${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete position');
    }

    const result = await response.json();

    if (result.success) {
      logger.api('[PortfolioService]', `Deleted position: ${symbol}`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error('[PortfolioService] Error deleting position:', error);
    throw error;
  }
}

/**
 * Merge local and remote portfolio data
 * Remote data takes precedence for existing symbols
 */
export function mergePortfolios(
  localPositions: Position[],
  remotePositions: ApiPosition[]
): Position[] {
  const mergedMap = new Map<string, Position>();

  // Add remote positions first (source of truth)
  for (const remote of remotePositions) {
    mergedMap.set(remote.symbol, {
      id: remote.id,
      symbol: remote.symbol,
      name: remote.name,
      type: remote.type,
      quantity: remote.quantity,
      averageBuyPrice: remote.avgBuyPrice,
      currency: remote.currency,
      addedAt: remote.createdAt,
      notes: remote.notes || '',
    });
  }

  // Add local positions that don't exist remotely
  for (const local of localPositions) {
    if (!mergedMap.has(local.symbol)) {
      mergedMap.set(local.symbol, local);
    }
  }

  return Array.from(mergedMap.values());
}

/**
 * Convert Position to API format
 */
export function toApiPosition(position: Position): Omit<ApiPosition, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    symbol: position.symbol,
    name: position.name,
    type: position.type,
    quantity: position.quantity,
    avgBuyPrice: position.averageBuyPrice,
    currency: position.currency,
    notes: position.notes,
  };
}

/**
 * Convert API position to local format
 */
export function fromApiPosition(apiPosition: ApiPosition): Position {
  return {
    id: apiPosition.id,
    symbol: apiPosition.symbol,
    name: apiPosition.name,
    type: apiPosition.type,
    quantity: apiPosition.quantity,
    averageBuyPrice: apiPosition.avgBuyPrice,
    currency: apiPosition.currency,
    addedAt: apiPosition.createdAt,
    notes: apiPosition.notes || '',
  };
}
