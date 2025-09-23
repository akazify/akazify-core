import { Package, Calendar, Clock, ArrowRight } from 'lucide-react'

export default function ManufacturingOrdersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manufacturing Orders</h1>
          <p className="text-gray-600">Plan, execute, and track production orders across your manufacturing facilities</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Manufacturing Order execution and lifecycle management is coming in Sprint 1.4: Production Execution.
        </p>

        {/* Sprint Info */}
        <div className="bg-green-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <div className="flex items-center justify-center space-x-2 text-green-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Sprint 1.4</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-green-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Target: December 2025</span>
          </div>
        </div>

        {/* Features Preview */}
        <div className="text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-3">Planned Features:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>MO lifecycle management (Plan → Release → Execute → Complete)</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Operation sequencing and routing logic</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Barcode/QR code scanning for lot tracking</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Labor tracking and time collection</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Material consumption and waste tracking</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
