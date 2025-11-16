
import { Save, User, Lock, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function SettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      <div className="space-y-6">
        {/* Profile Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-blkout-purple mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blkout-purple focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Lock className="h-5 w-5 text-blkout-purple mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
          </div>
          <div className="space-y-4">
            <button className="btn-secondary">
              Change Password
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-blkout-purple mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-gray-700">Email notifications for new drafts</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" defaultChecked />
              <span className="text-sm text-gray-700">Email notifications for approvals</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              <span className="text-sm text-gray-700">Weekly analytics summary</span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="btn-primary flex items-center">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
