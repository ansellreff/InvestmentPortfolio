'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Link2, AlertCircle, Info, Loader2, Eye, EyeOff } from 'lucide-react';

interface ConnectDialogProps {
  trigger?: React.ReactNode;
  onConnected?: () => void;
}

export function ConnectDialog({ trigger, onConnected }: ConnectDialogProps) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testnet, setTestnet] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey || !apiSecret) {
      setError('Please enter both API Key and Secret Key');
      setErrorDetails('');
      return;
    }

    // Trim whitespace from keys
    const trimmedApiKey = apiKey.trim();
    const trimmedApiSecret = apiSecret.trim();

    if (!trimmedApiKey || !trimmedApiSecret) {
      setError('API Key and Secret Key cannot be empty or only whitespace');
      setErrorDetails('');
      return;
    }

    setLoading(true);
    setError('');
    setErrorDetails('');

    try {
      const response = await fetch('/api/binance/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmedApiKey, apiSecret: trimmedApiSecret, testnet }),
      });

      const result = await response.json();

      if (result.success) {
        setOpen(false);
        setApiKey('');
        setApiSecret('');
        if (onConnected) onConnected();
        alert('Binance account connected successfully!');
      } else {
        setError(result.error || 'Failed to connect Binance account');
        setErrorDetails(result.details || '');
      }
    } catch (error) {
      console.error('Error connecting Binance:', error);
      setError('Failed to connect. Please try again.');
      setErrorDetails('Network error or server unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Link2 className="h-4 w-4 mr-2" />
            Connect Binance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Binance Account</DialogTitle>
          <DialogDescription>
            Connect your Binance account to automatically sync your crypto assets.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800 dark:text-blue-300">
              <p className="font-medium mb-1">Read-Only Access</p>
              <p className="text-[10px]">
                We only use API keys to read your balance. We never perform trades, withdrawals, or any transactions.
                Your API keys are encrypted and stored securely.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-xs mt-1">{error}</p>
                  {errorDetails && (
                    <p className="text-xs mt-2 opacity-75">Details: {errorDetails}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="Enter your Binance API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">Secret Key</Label>
              <div className="relative">
                <Input
                  id="apiSecret"
                  type={showApiSecret ? 'text' : 'password'}
                  placeholder="Enter your Binance Secret Key"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiSecret(!showApiSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="testnet">Use Testnet</Label>
                <p className="text-xs text-slate-500">
                  Use Binance Testnet for testing
                </p>
              </div>
              <Switch
                id="testnet"
                checked={testnet}
                onCheckedChange={setTestnet}
              />
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-medium mb-1">API Key Setup Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[10px]">
                    <li>Go to Binance Dashboard → API Management</li>
                    <li>Create a new API key with label "Investment Advisor"</li>
                    <li><strong>Enable "Enable Reading" permission</strong> ✅ (This is all you need!)</li>
                    <li><strong>DO NOT enable</strong> "Enable Withdrawals" ❌</li>
                    <li>"Enable Spot & Margin" is optional (only needed if Reading permission doesn't work)</li>
                    <li>Restrict IP access if possible (recommended for security)</li>
                    <li>Copy keys immediately - they won't be shown again</li>
                    <li><strong>For Testnet</strong>: use testnet.binance.vision to create test keys</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              <p className="font-medium mb-1">Troubleshooting tips:</p>
              <ul className="list-disc list-inside space-y-1 ml-1">
                <li>Make sure you copied the entire 64-character key without spaces</li>
                <li>Use Testnet first to verify setup (toggle "Use Testnet" on)</li>
                <li>At minimum, enable <strong>"Enable Reading"</strong> permission</li>
                <li>If it still fails, also enable "Enable Spot & Margin" (safe - we only read data)</li>
                <li>Verify your IP restrictions if enabled (or remove them temporarily)</li>
                <li>Make sure API key is not expired or deleted</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
