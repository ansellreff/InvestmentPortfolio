'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell } from 'lucide-react';

interface AlertDialogProps {
  symbol: string;
  name: string;
  currentPrice?: number;
  trigger?: React.ReactNode;
}

type AlertType = 'ABOVE' | 'BELOW' | 'CHANGE_PERCENT' | 'DAILY_HIGH' | 'DAILY_LOW';

export function AlertDialog({ symbol, name, currentPrice, trigger }: AlertDialogProps) {
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState<AlertType>('ABOVE');
  const [targetPrice, setTargetPrice] = useState(currentPrice?.toString() || '');
  const [targetPercent, setTargetPercent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!targetPrice && !targetPercent) {
      alert('Please enter a target price or percentage');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          name,
          alertType,
          targetPrice: targetPrice ? parseFloat(targetPrice) : null,
          targetPercent: targetPercent ? parseFloat(targetPercent) : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        setTargetPrice('');
        setTargetPercent('');
        alert('Alert created successfully!');
      } else {
        alert(`Failed to create alert: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      alert('Failed to create alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultTargetPrice = () => {
    if (currentPrice) {
      if (alertType === 'ABOVE') return (currentPrice * 1.05).toFixed(2); // 5% above
      if (alertType === 'BELOW') return (currentPrice * 0.95).toFixed(2); // 5% below
    }
    return targetPrice;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Set Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Set Price Alert</DialogTitle>
          <DialogDescription>
            Get notified when {name} ({symbol}) hits your target price.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="symbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="symbol"
                value={`${symbol} - ${name}`}
                disabled
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="alertType" className="text-right">
                Alert Type
              </Label>
              <div className="col-span-3">
                <Select
                  value={alertType}
                  onValueChange={(value) => setAlertType(value as AlertType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ABOVE">Price Goes Above</SelectItem>
                    <SelectItem value="BELOW">Price Goes Below</SelectItem>
                    <SelectItem value="CHANGE_PERCENT">Change Percentage</SelectItem>
                    <SelectItem value="DAILY_HIGH">Hits Daily High</SelectItem>
                    <SelectItem value="DAILY_LOW">Hits Daily Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(alertType === 'ABOVE' || alertType === 'BELOW') && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetPrice" className="text-right">
                  Target Price
                </Label>
                <Input
                  id="targetPrice"
                  type="number"
                  step="0.01"
                  placeholder={getDefaultTargetPrice()}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            )}

            {alertType === 'CHANGE_PERCENT' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="targetPercent" className="text-right">
                  Target %
                </Label>
                <Input
                  id="targetPercent"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={targetPercent}
                  onChange={(e) => setTargetPercent(e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
            )}

            {currentPrice && (
              <div className="text-sm text-slate-500 text-center">
                Current price: ${currentPrice.toLocaleString()}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
