'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

const materials = [
  { id: '1', sku: 'STL-BAR-100', name: 'Steel Bar', consumed: 75, planned: 100, cost: 637.50 },
  { id: '2', sku: 'OIL-CUT-5L', name: 'Cutting Oil', consumed: 2.3, planned: 5, cost: 27.60 }
]

interface MaterialConsumptionPanelProps {
  operationId?: string
}

export function MaterialConsumptionPanel({ operationId = '2' }: MaterialConsumptionPanelProps) {
  const [materials, setMaterials] = useState([
    { id: '1', sku: 'STL-BAR-100', name: 'Steel Bar', consumed: 75, planned: 100, cost: 637.50 },
    { id: '2', sku: 'OIL-CUT-5L', name: 'Cutting Oil', consumed: 2.3, planned: 5, cost: 27.60 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load material consumption from API
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getMaterialConsumption(operationId)
        setMaterials(data)
        setError(null)
      } catch (err) {
        console.error('Failed to load material consumption:', err)
        setError('Failed to load materials')
        // Keep using mock data on error
      } finally {
        setLoading(false)
      }
    }

    loadMaterials()
  }, [operationId])
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Material Consumption</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{materials.length}</div>
              <div className="text-gray-600">Materials</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                ${materials.reduce((sum, m) => sum + m.cost, 0).toFixed(0)}
              </div>
              <div className="text-gray-600">Total Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {materials.map((material) => (
        <Card key={material.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-medium">{material.name}</h3>
                  <p className="text-sm text-gray-600">{material.sku}</p>
                </div>
              </div>
              <Badge>{material.consumed}/{material.planned}</Badge>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
