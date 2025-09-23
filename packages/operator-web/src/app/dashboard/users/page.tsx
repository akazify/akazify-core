import { Users, Calendar, Clock, ArrowRight } from 'lucide-react'

export default function UsersPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage operators, technicians, and system users with role-based access</p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-indigo-600" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          User management and security features are coming in Sprint 2.1: Security & Compliance.
        </p>

        {/* Sprint Info */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6 max-w-sm mx-auto">
          <div className="flex items-center justify-center space-x-2 text-indigo-700 mb-2">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Sprint 2.1</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-indigo-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Target: January 2026</span>
          </div>
        </div>

        {/* Features Preview */}
        <div className="text-left max-w-md mx-auto">
          <h3 className="font-medium text-gray-900 mb-3">Planned Features:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>OAuth2/OIDC authentication (Keycloak/Auth0)</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Fine-grained RBAC with role-based UI</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Audit logging for all operations</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>User profile and permissions management</span>
            </li>
            <li className="flex items-center space-x-2">
              <ArrowRight className="w-3 h-3" />
              <span>Multi-factor authentication (MFA)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
