'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter, MoreHorizontal, Building2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusIndicator } from '@/components/ui/status-indicator'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { sitesApi, queryKeys, type SiteFilters } from '@/lib/api'
import { Site } from '@akazify/core-domain'

export default function SitesPage() {
  const [filters, setFilters] = useState<SiteFilters>({
    page: 1,
    limit: 20,
    sortBy: 'name',
    sortOrder: 'ASC',
  })
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch sites data
  const { data: sitesData, isLoading, error } = useQuery({
    queryKey: queryKeys.sites.list(filters),
    queryFn: () => sitesApi.getAll(filters),
  })

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: queryKeys.sites.statistics(),
    queryFn: sitesApi.getStatistics,
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" label="Loading sites..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Failed to load sites data. Please try again.
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
          <h1 className="text-2xl font-bold tracking-tight">Manufacturing Sites</h1>
          <p className="text-muted-foreground">
            Manage and monitor your manufacturing facilities
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sites</CardTitle>
            <StatusIndicator status="operational" size="sm" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? Math.round((stats.active / stats.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Regions</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byRegion.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timezones</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byTimezone.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sites Directory</CardTitle>
              <CardDescription>
                Browse and manage all manufacturing sites
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search sites..."
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
          {/* Sites grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sitesData?.data.map((site: Site) => (
              <Card key={site.id} className="equipment-card cursor-pointer hover:shadow-card-hover transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <StatusIndicator 
                        status={site.isActive ? 'operational' : 'offline'} 
                        size="sm" 
                      />
                      <CardTitle className="text-base">{site.name}</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {site.code}
                    </Badge>
                    {site.region && (
                      <Badge variant="secondary" className="text-xs">
                        {site.region}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 text-sm">
                    {site.address && (
                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{site.address}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Timezone:</span>
                      <span className="font-medium">{site.timezone}</span>
                    </div>
                    {site.description && (
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {site.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty state */}
          {!sitesData?.data.length && (
            <div className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No sites found</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchQuery 
                  ? `No sites match "${searchQuery}". Try adjusting your search.`
                  : 'Get started by adding your first manufacturing site.'
                }
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </div>
          )}

          {/* Pagination */}
          {sitesData?.pagination.totalPages && sitesData.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((sitesData.pagination.page - 1) * sitesData.pagination.limit) + 1} to{' '}
                {Math.min(sitesData.pagination.page * sitesData.pagination.limit, sitesData.pagination.total)} of{' '}
                {sitesData.pagination.total} sites
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(sitesData.pagination.page - 1)}
                  disabled={!sitesData.pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(sitesData.pagination.page + 1)}
                  disabled={!sitesData.pagination.hasNext}
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
