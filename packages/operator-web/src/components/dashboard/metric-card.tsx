import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number
  total?: number
  subtitle?: string
  icon: LucideIcon
  status: 'operational' | 'warning' | 'alarm' | 'offline' | 'maintenance'
  className?: string
}

export function MetricCard({
  title,
  value,
  total,
  subtitle,
  icon: Icon,
  status,
  className,
}: MetricCardProps) {
  const percentage = total ? Math.round((value / total) * 100) : undefined

  return (
    <Card className={cn('metrics-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          <StatusIndicator status={status} size="sm" />
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold">
              {value.toLocaleString()}
            </div>
            {total !== undefined && (
              <div className="text-sm text-muted-foreground">
                / {total.toLocaleString()}
              </div>
            )}
          </div>
          
          {percentage !== undefined && (
            <div className="flex items-center space-x-2">
              <div className="flex-1 bg-secondary rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    percentage > 80
                      ? 'bg-status-operational'
                      : percentage > 60
                      ? 'bg-status-warning'
                      : 'bg-status-alarm'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {percentage}%
              </span>
            </div>
          )}
          
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
