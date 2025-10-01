'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Ruler,
  Settings,
  ChevronRight,
  Play
} from 'lucide-react'

// Mock quality checks data
const sampleQualityChecks = [
  {
    id: '1',
    checkId: 'VISUAL-001',
    name: 'Visual Inspection',
    description: 'Check for visual defects, scratches, and surface quality',
    type: 'VISUAL' as const,
    specification: 'No visible defects',
    status: 'PASSED' as const,
    result: 'PASS' as const,
    sequence: 1,
    isRequired: true,
    inspectorName: 'John Smith',
    actualStartTime: '2025-09-23T08:25:00Z',
    actualEndTime: '2025-09-23T08:28:00Z',
    notes: 'Surface quality excellent, no defects found'
  },
  {
    id: '2',
    checkId: 'DIM-001',
    name: 'Dimensional Check',
    description: 'Measure critical dimensions with calipers',
    type: 'DIMENSIONAL' as const,
    specification: '100mm ± 0.1mm',
    tolerance: '±0.1mm',
    unit: 'mm',
    targetValue: 100,
    minValue: 99.9,
    maxValue: 100.1,
    measuredValue: 99.95,
    status: 'IN_PROGRESS' as const,
    result: undefined,
    sequence: 2,
    isRequired: true,
    inspectorName: 'Sarah Johnson',
    actualStartTime: '2025-09-23T08:30:00Z',
    actualEndTime: undefined,
    notes: undefined
  },
  {
    id: '3',
    checkId: 'FUNC-001',
    name: 'Function Test',
    description: 'Test operational functionality',
    type: 'FUNCTIONAL' as const,
    specification: 'All functions must operate within spec',
    status: 'PENDING' as const,
    result: undefined,
    sequence: 3,
    isRequired: true,
    inspectorName: undefined,
    actualStartTime: undefined,
    actualEndTime: undefined,
    notes: undefined
  }
]

type QualityCheckStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'SKIPPED'
type QualityCheckResult = 'PASS' | 'FAIL' | 'CONDITIONAL_PASS' | 'NOT_APPLICABLE'
type QualityCheckType = 'VISUAL' | 'DIMENSIONAL' | 'FUNCTIONAL' | 'MATERIAL' | 'SAFETY' | 'CUSTOM'

interface QualityCheck {
  id: string
  checkId: string
  name: string
  description: string
  type: QualityCheckType
  specification: string
  tolerance?: string
  unit?: string
  targetValue?: number
  minValue?: number
  maxValue?: number
  measuredValue?: number
  status: QualityCheckStatus
  result?: QualityCheckResult
  sequence: number
  isRequired: boolean
  inspectorName?: string
  actualStartTime?: string
  actualEndTime?: string
  notes?: string
}

interface QualityChecksPanelProps {
  operationId?: string
  manufacturingOrderId?: string
}

export function QualityChecksPanel({ 
  operationId = '2',
  manufacturingOrderId = '1' 
}: QualityChecksPanelProps) {
  const [checks] = useState<QualityCheck[]>(sampleQualityChecks)
  const [selectedCheck, setSelectedCheck] = useState<string | null>(null)
  const [measuredValue, setMeasuredValue] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const getStatusColor = (status: QualityCheckStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-gray-100 text-gray-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'PASSED': return 'bg-green-100 text-green-800'
      case 'FAILED': return 'bg-red-100 text-red-800'
      case 'SKIPPED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResultColor = (result?: QualityCheckResult) => {
    switch (result) {
      case 'PASS': return 'text-green-600'
      case 'FAIL': return 'text-red-600'
      case 'CONDITIONAL_PASS': return 'text-yellow-600'
      case 'NOT_APPLICABLE': return 'text-gray-600'
      default: return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: QualityCheckStatus) => {
    switch (status) {
      case 'PENDING': return Clock
      case 'IN_PROGRESS': return Play
      case 'PASSED': return CheckCircle
      case 'FAILED': return XCircle
      case 'SKIPPED': return AlertTriangle
      default: return Clock
    }
  }

  const getTypeIcon = (type: QualityCheckType) => {
    switch (type) {
      case 'VISUAL': return Eye
      case 'DIMENSIONAL': return Ruler
      default: return Settings
    }
  }

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '--'
    if (!end) return 'In progress...'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    return `${minutes}m`
  }

  const passedChecks = checks.filter(c => c.status === 'PASSED').length
  const failedChecks = checks.filter(c => c.status === 'FAILED').length
  const totalChecks = checks.length
  const overallProgress = (passedChecks + failedChecks) / totalChecks * 100

  const handleStartInspection = (checkId: string) => {
    console.log(`Starting inspection for ${checkId}`)
    // Would call API to update status to IN_PROGRESS
  }

  const handleRecordResult = (checkId: string, result: QualityCheckResult) => {
    console.log(`Recording result for ${checkId}: ${result}`, { measuredValue, notes })
    // Would call API to record inspection results
    setSelectedCheck(null)
    setMeasuredValue('')
    setNotes('')
  }

  return (
    <div className="space-y-4">
      {/* Quality Summary */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Quality Checks</CardTitle>
              <CardDescription>Operation 020 - Advanced CNC Station</CardDescription>
            </div>
            <Badge variant="outline">
              {passedChecks}/{totalChecks} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
              <div className="text-gray-600">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
              <div className="text-gray-600">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {checks.filter(c => c.status === 'IN_PROGRESS').length}
              </div>
              <div className="text-gray-600">In Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Checks List */}
      <div className="space-y-3">
        {checks.map((check) => {
          const StatusIcon = getStatusIcon(check.status)
          const TypeIcon = getTypeIcon(check.type)
          const isActive = selectedCheck === check.id
          const canStart = check.status === 'PENDING'
          const canRecord = check.status === 'IN_PROGRESS'
          
          return (
            <Card key={check.id} className={`${isActive ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      check.status === 'PASSED' ? 'bg-green-100' : 
                      check.status === 'FAILED' ? 'bg-red-100' :
                      check.status === 'IN_PROGRESS' ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <StatusIcon className={`w-4 h-4 ${
                        check.status === 'PASSED' ? 'text-green-600' :
                        check.status === 'FAILED' ? 'text-red-600' :
                        check.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="w-4 h-4 text-gray-500" />
                        <CardTitle className="text-base">{check.name}</CardTitle>
                        <Badge className={getStatusColor(check.status)}>
                          {check.status.replace('_', ' ')}
                        </Badge>
                        {check.isRequired && (
                          <Badge variant="outline" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1">
                        {check.checkId}: {check.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {canStart && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartInspection(check.id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Start
                      </Button>
                    )}
                    {canRecord && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => setSelectedCheck(isActive ? null : check.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Record
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Specification */}
                  <div className="text-sm">
                    <span className="font-medium text-gray-600">Specification:</span>
                    <p className="text-gray-900">{check.specification}</p>
                    {check.tolerance && (
                      <p className="text-gray-600 text-xs">Tolerance: {check.tolerance}</p>
                    )}
                  </div>

                  {/* Measurement Details */}
                  {check.type === 'DIMENSIONAL' && (
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-3 rounded">
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium ml-2">{check.targetValue} {check.unit}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Range:</span>
                        <span className="font-medium ml-2">
                          {check.minValue} - {check.maxValue} {check.unit}
                        </span>
                      </div>
                      {check.measuredValue && (
                        <>
                          <div>
                            <span className="text-gray-600">Measured:</span>
                            <span className={`font-medium ml-2 ${
                              check.measuredValue >= check.minValue! && check.measuredValue <= check.maxValue! 
                                ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {check.measuredValue} {check.unit}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Deviation:</span>
                            <span className="font-medium ml-2">
                              {(check.measuredValue - check.targetValue!).toFixed(2)} {check.unit}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Inspector and Timing */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Inspector:</span>
                      <p className="font-medium">{check.inspectorName || 'Not assigned'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="font-medium">
                        {formatDuration(check.actualStartTime, check.actualEndTime)}
                      </p>
                    </div>
                  </div>

                  {/* Result and Notes */}
                  {check.result && (
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Result:</span>
                        <span className={`font-medium ${getResultColor(check.result)}`}>
                          {check.result.replace('_', ' ')}
                        </span>
                      </div>
                      {check.notes && (
                        <div className="mt-2">
                          <span className="text-gray-600">Notes:</span>
                          <p className="text-gray-900 italic">{check.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recording Form */}
                  {isActive && canRecord && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      <h4 className="font-medium">Record Inspection Results</h4>
                      
                      {check.type === 'DIMENSIONAL' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Measured Value ({check.unit})
                          </label>
                          <Input
                            type="number"
                            value={measuredValue}
                            onChange={(e) => setMeasuredValue(e.target.value)}
                            placeholder={`Enter measurement in ${check.unit}`}
                            step="0.01"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <Input
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add inspection notes..."
                        />
                      </div>

                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleRecordResult(check.id, 'PASS')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Pass
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleRecordResult(check.id, 'FAIL')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Fail
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCheck(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
