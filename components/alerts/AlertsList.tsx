'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Trash2, CheckCircle, Clock } from 'lucide-react';

interface PriceAlert {
  id: string;
  symbol: string;
  name: string;
  alertType: string;
  targetPrice: number | null;
  targetPercent: number | null;
  condition: string;
  isActive: boolean;
  triggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

export function AlertsList() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts?active=true');
      const result = await response.json();

      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      const response = await fetch(`/api/alerts?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setAlerts(alerts.filter((a) => a.id !== id));
      } else {
        alert(`Failed to delete alert: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      alert('Failed to delete alert. Please try again.');
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'ABOVE': return 'Price Above';
      case 'BELOW': return 'Price Below';
      case 'CHANGE_PERCENT': return '% Change';
      case 'DAILY_HIGH': return 'Daily High';
      case 'DAILY_LOW': return 'Daily Low';
      default: return type;
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'ABOVE': return 'bg-green-100 text-green-800';
      case 'BELOW': return 'bg-red-100 text-red-800';
      case 'CHANGE_PERCENT': return 'bg-blue-100 text-blue-800';
      case 'DAILY_HIGH': return 'bg-purple-100 text-purple-800';
      case 'DAILY_LOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Price Alerts</CardTitle>
          <CardDescription>Loading your alerts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Price Alerts
          </CardTitle>
          <CardDescription>
            You have no active price alerts. Set alerts from any instrument page to get notified.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Price Alerts
          <Badge variant="secondary">{alerts.length}</Badge>
        </CardTitle>
        <CardDescription>
          Get notified when instruments hit your target prices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">
                    {alert.symbol}
                  </span>
                  <span className="text-xs text-slate-500">
                    {alert.name}
                  </span>
                  <Badge className={getAlertTypeColor(alert.alertType)} variant="secondary">
                    {getAlertTypeLabel(alert.alertType)}
                  </Badge>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {alert.targetPrice && (
                    <span>Target: ${alert.targetPrice.toLocaleString()}</span>
                  )}
                  {alert.targetPercent && (
                    <span>Target: {alert.targetPercent}% change</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Created {new Date(alert.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alert.triggered ? (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Triggered
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-blue-600">
                    <Clock className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(alert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
