'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreHorizontal, Settings, Activity, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { workCentersApi, queryKeys, type WorkCenterFilters } from '@/lib/api'

export default function WorkCentersPage() {
  const [filters, setFilters] = useState<WorkCenterFilters>({
    page: 1,
    limit: 20,
    sortBy: 'wc.name',
    sortOrder: 'ASC',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch work centers data
  const { data: workCentersData, isLoading, error } = useQuery({
    queryKey: queryKeys.workCenters.list(filters),
    queryFn: () => workCentersApi.getAll(filters),
  })

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: queryKeys.workCenters.statistics(),
    queryFn: workCentersApi.getStatistics,
  })

  // Fetch capacity metrics
  const { data: capacityMetrics } = useQuery({
    queryKey: queryKeys.workCenters.capacityMetrics(),
    queryFn: () => workCentersApi.getCapacityMetrics(),
  })

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setFilters(prev => ({
      ...prev,
      code: query || undefined,
      page: 1,
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PRODUCTION': return 'bg-hierarchy-workCenter text-white'
      case 'ASSEMBLY': return 'bg-status-operational text-white'
      case 'PACKAGING': return 'bg-status-warning text-white'
      case 'QUALITY': return 'bg-hierarchy-equipment text-white'
      case 'MAINTENANCE': return 'bg-status-maintenance text-white'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getUtilizationStatus = (utilization: number) => {
    if (utilization > 90) return 'alarm'
    if (utilization > 75) return 'warning'
    if (utilization > 0) return 'operational'
    return 'offline'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" label="Loading work centers..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Work Centers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load work centers data. Please try again.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage production work centers and monitor capacity utilization
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Work Center
        </Button>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Centers</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <StatusIndicator status="operational" size="sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? Math.round((stats.active / stats.total) * 100) : 0}% operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.totalCapacity || 0)}</div>
            <p className="text-xs text-muted-foreground">units/hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Capacity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.averageCapacity || 0)}</div>
            <p className="text-xs text-muted-foreground">units/hour per center</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Work Centers Directory</CardTitle>
              <CardDescription>
                Browse and manage all production work centers
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search work centers..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Work centers grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {workCentersData?.data.map((workCenter) => {
              const metrics = capacityMetrics?.find(m => m.workCenterId === workCenter.id)
              const utilization = metrics?.utilizationPercentage || 0
              
              return (
                <Card key={workCenter.id} className="equipment-card cursor-pointer hover:shadow-card-hover transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusIndicator 
                          status={workCenter.isActive ? getUtilizationStatus(utilization) : 'offline'} 
                          size="sm" 
                        />
                        <CardTitle className="text-base">{workCenter.name}</CardTitle>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {workCenter.code}
                      </Badge>
                      <Badge className={`text-xs ${getCategoryColor(workCenter.category)}`}>
                        {workCenter.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Area information */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Area:</span>
                        <span className="font-medium">{workCenter.area.name}</span>
                      </div>

                      {/* Capacity information */}
                      {workCenter.capacity && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium">{workCenter.capacity} units/h</span>
                        </div>
                      )}

                      {/* Utilization */}
                      {metrics && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Utilization:</span>
                            <span className="font-medium">{Math.round(utilization)}%</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                utilization > 90
                                  ? 'bg-status-alarm'
                                  : utilization > 75
                                  ? 'bg-status-warning'
                                  : utilization > 0
                                  ? 'bg-status-operational'
                                  : 'bg-status-offline'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Operations count */}
                      {metrics && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Active Operations:</span>
                          <span className="font-medium">{metrics.activeOperations}</span>
                        </div>
                      )}

                      {/* Description */}
                      {workCenter.description && (
                        <p className="text-muted-foreground text-xs line-clamp-2">
                          {workCenter.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Empty state */}
          {!workCentersData?.data.length && (
            <div className="flex flex-col items-center justify-center py-12">
              <Settings className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No work centers found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery 
                  ? `No work centers match "${searchQuery}". Try adjusting your search.`
                  : 'Get started by adding your first work center.'
                }
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Work Center
              </Button>
            </div>
          )}

          {/* Pagination */}
          {workCentersData?.pagination.totalPages && workCentersData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((workCentersData.pagination.page - 1) * workCentersData.pagination.limit) + 1} to{' '}
                {Math.min(workCentersData.pagination.page * workCentersData.pagination.limit, workCentersData.pagination.total)} of{' '}
                {workCentersData.pagination.total} work centers
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(workCentersData.pagination.page - 1)}
                  disabled={!workCentersData.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(workCentersData.pagination.page + 1)}
                  disabled={!workCentersData.pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
