'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, 
  Clock, 
  Play, 
  Pause,
  Coffee,
  CheckCircle,
  Settings
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

// Sample labor assignments
const sampleAssignments = [
  {
    id: '1',
    operatorId: 'OP-001',
    operatorName: 'John Smith',
    role: 'PRIMARY' as const,
    status: 'ACTIVE' as const,
    clockInTime: '2025-09-23T08:30:00Z',
    plannedHours: 2.0,
    actualHours: 1.4,
    hourlyRate: 25.50,
  },
  {
    id: '2', 
    operatorId: 'OP-015',
    operatorName: 'Sarah Johnson',
    role: 'ASSISTANT' as const,
    status: 'ON_BREAK' as const,
    clockInTime: '2025-09-23T08:45:00Z',
    plannedHours: 2.0,
    actualHours: 1.2,
    hourlyRate: 22.00,
  }
]

interface LaborAssignmentsPanelProps {
  operationId?: string
}

export function LaborAssignmentsPanel({ operationId = '2' }: LaborAssignmentsPanelProps) {
  const [assignments, setAssignments] = useState(sampleAssignments)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load labor assignments from API
  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getLaborAssignments(operationId)
        setAssignments(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load labor assignments:', err)
        setError('Failed to load assignments')
        // Keep using mock data on error
      } finally {
        setLoading(false)
      }
    }

    loadAssignments()
  }, [operationId])

  // Handle clock in/out actions
  const handleClockIn = async (assignmentId: string) => {
    try {
      await apiClient.clockIn(assignmentId)
      // Reload assignments to get updated data
      const data = await apiClient.getLaborAssignments(operationId)
      setAssignments(data)
    } catch (err) {
      console.error('Clock in failed:', err)
      setError('Clock in failed')
    }
  }

  const handleClockOut = async (assignmentId: string) => {
    try {
      await apiClient.clockOut(assignmentId)
      const data = await apiClient.getLaborAssignments(operationId)
      setAssignments(data)
    } catch (err) {
      console.error('Clock out failed:', err)
      setError('Clock out failed')
    }
  }

  const handleStartBreak = async (assignmentId: string) => {
    try {
      await apiClient.startBreak(assignmentId)
      const data = await apiClient.getLaborAssignments(operationId)
      setAssignments(data)
    } catch (err) {
      console.error('Start break failed:', err)
      setError('Start break failed')
    }
  }

  const handleEndBreak = async (assignmentId: string) => {
    try {
      await apiClient.endBreak(assignmentId)
      const data = await apiClient.getLaborAssignments(operationId)
      setAssignments(data)
    } catch (err) {
      console.error('End break failed:', err)
      setError('End break failed')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_BREAK': return 'bg-yellow-100 text-yellow-800'
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800'
      case 'OFFLINE': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return Play
      case 'ON_BREAK': return Coffee
      case 'ASSIGNED': return Clock
      case 'OFFLINE': return Pause
      default: return Clock
    }
  }

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const totalLaborCost = assignments.reduce((sum, a) => sum + (a.actualHours * a.hourlyRate), 0)

  return (
    <div className="space-y-4">
      {/* Labor Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Labor Assignments</CardTitle>
          <CardDescription>Operation 020 - Advanced CNC Station</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{assignments.length}</div>
              <div className="text-gray-600">Operators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(assignments.reduce((sum, a) => sum + a.actualHours, 0))}
              </div>
              <div className="text-gray-600">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">${totalLaborCost.toFixed(2)}</div>
              <div className="text-gray-600">Labor Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operator List */}
      <div className="space-y-3">
        {assignments.map((assignment) => {
          const StatusIcon = getStatusIcon(assignment.status)
          
          return (
            <Card key={assignment.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{assignment.operatorName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {assignment.role}
                        </Badge>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{assignment.operatorId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="w-4 h-4 text-gray-500" />
                    {assignment.status === 'ACTIVE' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStartBreak(assignment.id)}
                        disabled={loading}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Break
                      </Button>
                    )}
                    {assignment.status === 'ON_BREAK' && (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleEndBreak(assignment.id)}
                        disabled={loading}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Resume
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Clock In:</span>
                    <p className="font-medium">{formatTime(assignment.clockInTime)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Hours Worked:</span>
                    <p className="font-medium">
                      {formatDuration(assignment.actualHours)} / {formatDuration(assignment.plannedHours)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span>
                    <p className="font-medium">${assignment.hourlyRate}/hr</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Labor Cost:</span>
                    <p className="font-medium">${(assignment.actualHours * assignment.hourlyRate).toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <User className="w-4 h-4 mr-2" />
              Add Operator
            </Button>
            <Button variant="outline" className="justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Time Adjustments
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
