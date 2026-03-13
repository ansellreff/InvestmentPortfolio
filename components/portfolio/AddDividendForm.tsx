'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { usePortfolioStore } from '@/stores/usePortfolioStore';

interface AddDividendFormProps {
  editDividend?: any;
  onClose: () => void;
  onSave: () => void;
}

export function AddDividendForm({ editDividend, onClose, onSave }: AddDividendFormProps) {
  const { positions } = usePortfolioStore();
  const [symbol, setSymbol] = useState(editDividend?.symbol || '');
  const [name, setName] = useState(editDividend?.name || '');
  const [amount, setAmount] = useState(editDividend?.amount || '');
  const [currency, setCurrency] = useState(editDividend?.currency || 'USD');
  const [exDate, setExDate] = useState(
    editDividend?.exDate
      ? new Date(editDividend.exDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [paymentDate, setPaymentDate] = useState(
    editDividend?.paymentDate
      ? new Date(editDividend.paymentDate).toISOString().split('T')[0]
      : ''
  );
  const [shares, setShares] = useState(editDividend?.shares || '');
  const [perShare, setPerShare] = useState(editDividend?.perShare || '');
  const [notes, setNotes] = useState(editDividend?.notes || '');
  const [loading, setLoading] = useState(false);

  // Auto-fill from position if symbol matches
  useEffect(() => {
    if (symbol && !editDividend) {
      const position = positions.find(p => p.symbol === symbol);
      if (position) {
        setName(position.name);
        setShares(position.quantity.toString());
      }
    }
  }, [symbol, positions, editDividend]);

  // Calculate per share when amount and shares change
  useEffect(() => {
    if (amount && shares && !editDividend) {
      const calculatedPerShare = parseFloat(amount) / parseFloat(shares);
      if (isFinite(calculatedPerShare)) {
        setPerShare(calculatedPerShare.toFixed(4));
      }
    }
  }, [amount, shares, editDividend]);

  // Calculate amount when per share and shares change
  useEffect(() => {
    if (perShare && shares && !editDividend) {
      const calculatedAmount = parseFloat(perShare) * parseFloat(shares);
      if (isFinite(calculatedAmount)) {
        setAmount(calculatedAmount.toFixed(2));
      }
    }
  }, [perShare, shares, editDividend]);

  const handleSubmit = async () => {
    if (!symbol || !amount || !exDate) {
      alert('Please fill in required fields: Symbol, Amount, Ex-Date');
      return;
    }

    setLoading(true);

    try {
      const dividendData = {
        symbol: symbol.toUpperCase(),
        name: name || symbol,
        type: 'STOCK', // Default type
        amount: parseFloat(amount),
        currency,
        exDate,
        paymentDate: paymentDate || null,
        shares: parseFloat(shares) || 0,
        perShare: parseFloat(perShare) || 0,
        notes: notes || null,
      };

      if (editDividend) {
        // For editing, we'll need to add an update endpoint
        // For now, just close
        onSave();
      } else {
        const response = await fetch('/api/dividends', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dividendData),
        });

        const result = await response.json();

        if (result.success) {
          onSave();
        } else {
          alert(result.error || 'Failed to add dividend');
        }
      }
    } catch (error) {
      console.error('Error saving dividend:', error);
      alert('Failed to save dividend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{editDividend ? 'Edit Dividend' : 'Add Dividend Payment'}</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Symbol */}
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="e.g., AAPL"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              list="symbols"
            />
            <datalist id="symbols">
              {positions.map((p) => (
                <option key={p.symbol} value={p.symbol}>
                  {p.name}
                </option>
              ))}
            </datalist>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              placeholder="e.g., Apple Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Total Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="JPY">JPY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Shares */}
            <div className="space-y-2">
              <Label htmlFor="shares">Number of Shares</Label>
              <Input
                id="shares"
                type="number"
                step="0.0001"
                placeholder="100"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
              />
            </div>

            {/* Per Share */}
            <div className="space-y-2">
              <Label htmlFor="perShare">Per Share Amount</Label>
              <Input
                id="perShare"
                type="number"
                step="0.0001"
                placeholder="1.00"
                value={perShare}
                onChange={(e) => setPerShare(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Ex-Date */}
            <div className="space-y-2">
              <Label htmlFor="exDate">Ex-Dividend Date *</Label>
              <Input
                id="exDate"
                type="date"
                value={exDate}
                onChange={(e) => setExDate(e.target.value)}
              />
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Saving...' : editDividend ? 'Update' : 'Add Dividend'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
