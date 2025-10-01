'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  QrCode, 
  ScanLine, 
  Package2, 
  CheckCircle, 
  AlertCircle,
  History,
  Search
} from 'lucide-react'

// Sample lot tracking data
const sampleLots = [
  {
    id: 'LOT-STL-20250920-001',
    productSku: 'STL-BAR-100',
    productName: 'Steel Bar 100mm x 500mm',
    quantity: 100,
    manufactureDate: '2025-09-20',
    expiryDate: '2027-09-20',
    status: 'ACTIVE' as const,
    location: 'WH-A-01-03',
    supplier: 'Advanced Steel Corp',
  },
  {
    id: 'LOT-OIL-20250918-003', 
    productSku: 'OIL-CUT-5L',
    productName: 'Cutting Oil Premium Grade',
    quantity: 25,
    manufactureDate: '2025-09-18',
    expiryDate: '2026-09-18',
    status: 'ACTIVE' as const,
    location: 'WH-B-02-01',
    supplier: 'Industrial Fluids Inc',
  }
]

const recentScans = [
  { lotId: 'LOT-STL-20250920-001', timestamp: '2025-09-23T14:30:00Z', operator: 'John Smith', action: 'ALLOCATED' },
  { lotId: 'LOT-OIL-20250918-003', timestamp: '2025-09-23T14:25:00Z', operator: 'Sarah Johnson', action: 'CONSUMED' },
]

interface BarcodeScannerProps {
  operationId?: string
  onLotScanned?: (lotId: string) => void
}

export function BarcodeScanner({ operationId = '2', onLotScanned }: BarcodeScannerProps) {
  const [scanInput, setScanInput] = useState('')
  const [scanResults, setScanResults] = useState<typeof sampleLots>([])
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = (input: string) => {
    // Simulate barcode/QR scanning
    const foundLot = sampleLots.find(lot => 
      lot.id.toLowerCase().includes(input.toLowerCase()) ||
      lot.productSku.toLowerCase().includes(input.toLowerCase())
    )
    
    if (foundLot) {
      setScanResults([foundLot])
      onLotScanned?.(foundLot.id)
    } else {
      setScanResults([])
    }
  }

  const handleManualScan = () => {
    if (scanInput.trim()) {
      handleScan(scanInput)
      setScanInput('')
    }
  }

  const startCameraScanning = () => {
    setIsScanning(true)
    // In real implementation, would activate camera
    setTimeout(() => {
      // Simulate successful scan
      handleScan('LOT-STL-20250920-001')
      setIsScanning(false)
    }, 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'CONSUMED': return 'bg-blue-100 text-blue-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString()
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-4">
      {/* Scanner Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Lot Tracking Scanner</span>
          </CardTitle>
          <CardDescription>Scan barcodes or QR codes to track materials and lots</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Manual Input */}
          <div className="flex space-x-2">
            <Input
              placeholder="Enter lot ID or product SKU..."
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
            />
            <Button onClick={handleManualScan} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Camera Scanner */}
          <div className="flex justify-center">
            <Button 
              onClick={startCameraScanning} 
              disabled={isScanning}
              size="lg"
              className="w-full"
            >
              {isScanning ? (
                <>
                  <ScanLine className="w-5 h-5 mr-2 animate-pulse" />
                  Scanning...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  Start Camera Scanner
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Scan Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scanResults.map((lot) => (
                <Card key={lot.id} className="border border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Package2 className="w-8 h-8 text-green-600" />
                        <div>
                          <h3 className="font-medium">{lot.productName}</h3>
                          <p className="text-sm text-gray-600">{lot.productSku}</p>
                          <p className="text-sm font-mono text-blue-600">{lot.id}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(lot.status)}>
                        {lot.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Quantity:</span>
                        <p className="font-medium">{lot.quantity} units</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <p className="font-medium">{lot.location}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Manufactured:</span>
                        <p className="font-medium">{formatDate(lot.manufactureDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <p className="font-medium">{lot.supplier}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Button variant="default" size="sm">
                        Allocate to Operation
                      </Button>
                      <Button variant="outline" size="sm">
                        View History
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="w-5 h-5" />
            <span>Recent Scans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentScans.map((scan, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{scan.lotId}</p>
                  <p className="text-xs text-gray-600">by {scan.operator}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {scan.action}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{formatTime(scan.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
