'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  AlertCircle, 
  XCircle,
  CheckCircle,
  Plus,
  Search,
  Clock,
  DollarSign
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

// Sample NCRs
const sampleNCRs = [
  {
    id: '1',
    ncrNumber: 'NCR-2025-001',
    title: 'Dimensional variance in machined parts',
    severity: 'MAJOR' as const,
    status: 'INVESTIGATING' as const,
    category: 'DIMENSIONAL' as const,
    quantityAffected: 25,
    reportedBy: 'John Smith',
    reportedAt: '2025-09-23T10:30:00Z',
    estimatedCost: 2500,
    targetCloseDate: '2025-09-25T17:00:00Z',
  },
  {
    id: '2',
    ncrNumber: 'NCR-2025-002', 
    title: 'Surface finish quality issue',
    severity: 'MINOR' as const,
    status: 'CORRECTIVE_ACTION' as const,
    category: 'SURFACE_FINISH' as const,
    quantityAffected: 5,
    reportedBy: 'Sarah Johnson',
    reportedAt: '2025-09-23T14:15:00Z',
    estimatedCost: 500,
    targetCloseDate: '2025-09-24T17:00:00Z',
  },
  {
    id: '3',
    ncrNumber: 'NCR-2025-003',
    title: 'Material contamination detected',
    severity: 'CRITICAL' as const,
    status: 'OPEN' as const,
    category: 'MATERIAL_DEFECT' as const,
    quantityAffected: 100,
    reportedBy: 'Mike Wilson',
    reportedAt: '2025-09-23T16:00:00Z',
    estimatedCost: 8000,
    targetCloseDate: '2025-09-24T09:00:00Z',
  }
]

interface NonConformancePanelProps {
  operationId?: string
}

export function NonConformancePanel({ operationId = '2' }: NonConformancePanelProps) {
  const [ncrs, setNCRs] = useState(sampleNCRs)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load NCRs from API
  useEffect(() => {
    const loadNCRs = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getNCRs(operationId)
        setNCRs(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load NCRs:', err)
        setError('Failed to load NCRs')
        // Keep using mock data on error
      } finally {
        setLoading(false)
      }
    }

    loadNCRs()
  }, [operationId])

  // Handle create NCR
  const handleCreateNCR = async () => {
    try {
      const newNCR = await apiClient.createNCR({
        operationId,
        title: 'New Quality Issue',
        description: 'Quality issue description',
        category: 'OTHER',
        severity: 'MINOR',
        quantityAffected: 1,
        reportedBy: 'Current Operator'
      })
      setNCRs([...ncrs, newNCR])
      setShowCreateForm(false)
    } catch (err) {
      console.error('Failed to create NCR:', err)
      setError('Failed to create NCR')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200'
      case 'MAJOR': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'MINOR': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800'
      case 'INVESTIGATING': return 'bg-blue-100 text-blue-800'
      case 'CORRECTIVE_ACTION': return 'bg-orange-100 text-orange-800'
      case 'RESOLVED': return 'bg-green-100 text-green-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return XCircle
      case 'MAJOR': return AlertTriangle
      case 'MINOR': return AlertCircle
      default: return AlertCircle
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOverdue = (targetDate: string) => {
    return new Date(targetDate) < new Date()
  }

  const totalNCRs = ncrs.length
  const openNCRs = ncrs.filter(n => n.status === 'OPEN').length
  const criticalNCRs = ncrs.filter(n => n.severity === 'CRITICAL').length
  const totalEstimatedCost = ncrs.reduce((sum, n) => sum + n.estimatedCost, 0)

  return (
    <div className="space-y-4">
      {/* NCR Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>Non-Conformance Reports</span>
          </CardTitle>
          <CardDescription>Quality issues and corrective actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalNCRs}</div>
              <div className="text-gray-600">Total NCRs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{openNCRs}</div>
              <div className="text-gray-600">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{criticalNCRs}</div>
              <div className="text-gray-600">Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${totalEstimatedCost.toLocaleString()}</div>
              <div className="text-gray-600">Est. Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create NCR Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Active NCRs</h3>
        <Button 
          onClick={handleCreateNCR}
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          Report NCR
        </Button>
      </div>

      {/* NCR List */}
      <div className="space-y-3">
        {ncrs.map((ncr) => {
          const SeverityIcon = getSeverityIcon(ncr.severity)
          
          return (
            <Card key={ncr.id} className={`border-l-4 ${getSeverityColor(ncr.severity)}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <SeverityIcon className={`w-6 h-6 mt-1 ${
                      ncr.severity === 'CRITICAL' ? 'text-red-600' :
                      ncr.severity === 'MAJOR' ? 'text-orange-600' : 'text-yellow-600'
                    }`} />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{ncr.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {ncr.ncrNumber}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Reported by {ncr.reportedBy} on {formatDate(ncr.reportedAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusColor(ncr.status)}>
                      {ncr.status.replace('_', ' ')}
                    </Badge>
                    {isOverdue(ncr.targetCloseDate) && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        OVERDUE
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <p className="font-medium">{ncr.category.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Quantity Affected:</span>
                    <p className="font-medium">{ncr.quantityAffected} units</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Target Close:</span>
                    <p className={`font-medium ${isOverdue(ncr.targetCloseDate) ? 'text-red-600' : ''}`}>
                      {formatDate(ncr.targetCloseDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. Cost:</span>
                    <p className="font-medium flex items-center">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {ncr.estimatedCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <Button variant="default" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Update Status
                  </Button>
                  {ncr.status === 'OPEN' && (
                    <Button variant="outline" size="sm">
                      Assign
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Search className="w-4 h-4 mr-2" />
              Search NCRs
            </Button>
            <Button variant="outline" className="justify-start">
              <CheckCircle className="w-4 h-4 mr-2" />
              Close Resolved
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
