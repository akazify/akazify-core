import { BarChart3, Calendar, Clock, ArrowRight } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-600">Advanced manufacturing dashboards, OEE tracking, and performance analytics</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <BarChart3 className="w-8 h-8 text-purple-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Advanced analytics and reporting capabilities are coming in Sprint 3.3: Analytics & Reporting.
        </p>

        {/* Sprint Info */}
        <div className="bg-purple-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <div className="flex items-center justify-center space-x-2 text-purple-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Sprint 3.3</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-purple-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Target: March 2026</span>
          </div>
        </div>

        {/* Features Preview */}
        <div className="text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-3">Planned Features:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Real-time manufacturing dashboards</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>OEE (Overall Equipment Effectiveness) calculation</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Production performance analytics</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Quality trend analysis</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Predictive maintenance algorithms</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Custom report builder</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
