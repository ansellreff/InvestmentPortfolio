'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  onRefresh: () => void | Promise<void>;
  label?: string;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'default' | 'outline' | 'ghost';
}

export function RefreshButton({
  onRefresh,
  label = 'Refresh',
  size = 'sm',
  variant = 'outline',
}: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('[RefreshButton] Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant={variant}
      size={size}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      {label}
    </Button>
  );
}
