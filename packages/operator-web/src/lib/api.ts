import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Site, WorkCenter } from '@akazify/core-domain'

/**
 * API configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_VERSION = 'v1'

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  // Request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      // Add authentication token if available
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Handle authentication errors
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth-token')
          window.location.href = '/login'
        }
      }
      return Promise.reject(error)
    }
  )

  return client
}

export const apiClient = createApiClient()

/**
 * Pagination parameters for API requests
 */
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * API error response
 */
export interface ApiError {
  error: string
  message: string
  statusCode?: number
}

/**
 * Sites API
 */
export interface SiteFilters extends PaginationParams {
  region?: string
  timezone?: string
  code?: string
  isActive?: boolean
}

export interface SiteStatistics {
  total: number
  active: number
  byRegion: { region: string; count: number }[]
  byTimezone: { timezone: string; count: number }[]
}

export const sitesApi = {
  /**
   * Get all sites with pagination and filtering
   */
  getAll: async (filters: SiteFilters = {}): Promise<PaginatedResponse<Site>> => {
    const response: AxiosResponse<PaginatedResponse<Site>> = await apiClient.get('/sites', {
      params: filters,
    })
    return response.data
  },

  /**
   * Get site by ID
   */
  getById: async (id: string): Promise<Site> => {
    const response: AxiosResponse<Site> = await apiClient.get(`/sites/${id}`)
    return response.data
  },

  /**
   * Create new site
   */
  create: async (data: Omit<Site, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Site> => {
    const response: AxiosResponse<Site> = await apiClient.post('/sites', data)
    return response.data
  },

  /**
   * Update site
   */
  update: async (id: string, data: Partial<Omit<Site, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<Site> => {
    const response: AxiosResponse<Site> = await apiClient.put(`/sites/${id}`, data)
    return response.data
  },

  /**
   * Delete site (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/sites/${id}`)
  },

  /**
   * Get site statistics
   */
  getStatistics: async (): Promise<SiteStatistics> => {
    const response: AxiosResponse<SiteStatistics> = await apiClient.get('/sites/statistics')
    return response.data
  },
}

/**
 * Work Centers API
 */
export interface WorkCenterFilters extends PaginationParams {
  areaId?: string
  siteId?: string
  category?: 'PRODUCTION' | 'ASSEMBLY' | 'PACKAGING' | 'QUALITY' | 'MAINTENANCE'
  code?: string
  isActive?: boolean
}

export interface WorkCenterWithArea extends WorkCenter {
  area: {
    id: string
    name: string
    code: string
    siteId: string
  }
}

export interface WorkCenterCapacityMetrics {
  workCenterId: string
  workCenterCode: string
  capacity?: number
  utilizationPercentage: number
  activeOperations: number
  plannedOperations: number
}

export interface WorkCenterStatistics {
  total: number
  active: number
  byCategory: { category: string; count: number }[]
  totalCapacity: number
  averageCapacity: number
}

export const workCentersApi = {
  /**
   * Get all work centers with pagination and filtering
   */
  getAll: async (filters: WorkCenterFilters = {}): Promise<PaginatedResponse<WorkCenterWithArea>> => {
    const response: AxiosResponse<PaginatedResponse<WorkCenterWithArea>> = await apiClient.get('/work-centers', {
      params: filters,
    })
    return response.data
  },

  /**
   * Get work center by ID
   */
  getById: async (id: string): Promise<WorkCenter> => {
    const response: AxiosResponse<WorkCenter> = await apiClient.get(`/work-centers/${id}`)
    return response.data
  },

  /**
   * Create new work center
   */
  create: async (data: Omit<WorkCenter, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<WorkCenter> => {
    const response: AxiosResponse<WorkCenter> = await apiClient.post('/work-centers', data)
    return response.data
  },

  /**
   * Update work center
   */
  update: async (id: string, data: Partial<Omit<WorkCenter, 'id' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<WorkCenter> => {
    const response: AxiosResponse<WorkCenter> = await apiClient.put(`/work-centers/${id}`, data)
    return response.data
  },

  /**
   * Delete work center (soft delete)
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/work-centers/${id}`)
  },

  /**
   * Get work center statistics
   */
  getStatistics: async (): Promise<WorkCenterStatistics> => {
    const response: AxiosResponse<WorkCenterStatistics> = await apiClient.get('/work-centers/statistics')
    return response.data
  },

  /**
   * Get capacity metrics
   */
  getCapacityMetrics: async (workCenterId?: string): Promise<WorkCenterCapacityMetrics[]> => {
    const response: AxiosResponse<WorkCenterCapacityMetrics[]> = await apiClient.get('/work-centers/capacity-metrics', {
      params: workCenterId ? { workCenterId } : {},
    })
    return response.data
  },
}

/**
 * Areas API (nested under sites)
 */
export interface Area {
  id: string
  siteId: string
  name: string
  code: string
  description?: string
  parentAreaId?: string
  level: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  version: number
}

export interface AreaFilters {
  level?: number
  parentAreaId?: string
}

export const areasApi = {
  /**
   * Get all areas for a specific site
   */
  getBySite: async (siteId: string, filters: AreaFilters = {}): Promise<PaginatedResponse<Area>> => {
    const response: AxiosResponse<PaginatedResponse<Area>> = await apiClient.get(`/sites/${siteId}/areas`, {
      params: filters,
    })
    return response.data
  },

  /**
   * Get area by ID within a site
   */
  getBySiteAndId: async (siteId: string, areaId: string): Promise<Area> => {
    const response: AxiosResponse<Area> = await apiClient.get(`/sites/${siteId}/areas/${areaId}`)
    return response.data
  },

  /**
   * Create new area in a site
   */
  createInSite: async (siteId: string, data: Omit<Area, 'id' | 'siteId' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Area> => {
    const response: AxiosResponse<Area> = await apiClient.post(`/sites/${siteId}/areas`, data)
    return response.data
  },

  /**
   * Update area in a site
   */
  updateInSite: async (siteId: string, areaId: string, data: Partial<Omit<Area, 'id' | 'siteId' | 'createdAt' | 'updatedAt' | 'version'>>): Promise<Area> => {
    const response: AxiosResponse<Area> = await apiClient.put(`/sites/${siteId}/areas/${areaId}`, data)
    return response.data
  },

  /**
   * Delete area from a site
   */
  deleteFromSite: async (siteId: string, areaId: string): Promise<void> => {
    await apiClient.delete(`/sites/${siteId}/areas/${areaId}`)
  },
}

/**
 * Health Check API
 */
export interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  uptime: number
  timestamp: string
  services: {
    database: 'healthy' | 'unhealthy'
    redis?: 'healthy' | 'unhealthy'
    externalApi?: 'healthy' | 'unhealthy'
  }
}

export const healthApi = {
  /**
   * Get system health status
   */
  getHealth: async (): Promise<HealthStatus> => {
    const response: AxiosResponse<HealthStatus> = await apiClient.get('/health')
    return response.data
  },
}

/**
 * React Query keys for consistent caching
 */
export const queryKeys = {
  sites: {
    all: ['sites'] as const,
    lists: () => [...queryKeys.sites.all, 'list'] as const,
    list: (filters: SiteFilters) => [...queryKeys.sites.lists(), filters] as const,
    details: () => [...queryKeys.sites.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sites.details(), id] as const,
    statistics: () => [...queryKeys.sites.all, 'statistics'] as const,
  },
  workCenters: {
    all: ['workCenters'] as const,
    lists: () => [...queryKeys.workCenters.all, 'list'] as const,
    list: (filters: WorkCenterFilters) => [...queryKeys.workCenters.lists(), filters] as const,
    details: () => [...queryKeys.workCenters.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.workCenters.details(), id] as const,
    statistics: () => [...queryKeys.workCenters.all, 'statistics'] as const,
    capacityMetrics: (workCenterId?: string) => [...queryKeys.workCenters.all, 'capacity', workCenterId] as const,
  },
  areas: {
    all: ['areas'] as const,
    bySite: (siteId: string) => [...queryKeys.areas.all, 'site', siteId] as const,
    list: (siteId: string, filters: AreaFilters) => [...queryKeys.areas.bySite(siteId), 'list', filters] as const,
    detail: (siteId: string, areaId: string) => [...queryKeys.areas.bySite(siteId), 'detail', areaId] as const,
  },
  health: {
    all: ['health'] as const,
    basic: () => [...queryKeys.health.all, 'basic'] as const,
  },
} as const
