/**
 * Session Status Component
 * Shows current authentication status and provides login/logout functionality
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { User, Building, SignOut, ShieldCheck } from '@phosphor-icons/react'
import { 
  getCurrentSession, 
  authenticateInstitutionalUser, 
  logout,
  initializePublicSession 
} from '@/services/authContext'
import { toast } from 'sonner'

export function SessionStatus() {
  const [session, setSession] = useState(getCurrentSession())
  const [showLogin, setShowLogin] = useState(false)
  const [userId, setUserId] = useState('')
  const [institutionName, setInstitutionName] = useState('')

  const handleLogin = () => {
    if (!userId.trim() || !institutionName.trim()) {
      toast.error('Please enter both user ID and institution name')
      return
    }

    const newSession = authenticateInstitutionalUser(userId.trim(), institutionName.trim())
    setSession(newSession)
    setShowLogin(false)
    setUserId('')
    setInstitutionName('')
    toast.success(`Authenticated as ${institutionName}`, {
      description: 'You now have institutional access'
    })
  }

  const handleLogout = () => {
    const newSession = logout()
    setSession(newSession)
    toast.info('Logged out - returned to public access', {
      description: 'You can only process personal matters'
    })
  }

  if (showLogin) {
    return (
      <Card className="absolute top-16 right-6 p-4 w-80 z-50 bg-card border border-border shadow-lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Building size={20} className="text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Institutional Login</h3>
          </div>
          <Input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="text-sm"
          />
          <Input
            placeholder="Institution Name"
            value={institutionName}
            onChange={(e) => setInstitutionName(e.target.value)}
            className="text-sm"
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Institutional access allows corporate/multi-party documents</p>
            <p>• All users remain subject to constitutional enforcement</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleLogin}
              className="flex-1 text-sm"
              size="sm"
            >
              Login
            </Button>
            <Button
              onClick={() => setShowLogin(false)}
              variant="outline"
              className="flex-1 text-sm"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {session.isAuthenticated && session.isInstitutional ? (
        <>
          <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/20 rounded-md">
            <ShieldCheck size={16} weight="fill" className="text-green-700 dark:text-green-400" />
            <span className="text-xs font-medium text-green-800 dark:text-green-300">
              {session.institutionName}
            </span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <SignOut size={18} weight="regular" />
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-md">
            <User size={16} weight="regular" className="text-blue-700 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-300">
              Public Access
            </span>
          </div>
          <Button
            onClick={() => setShowLogin(true)}
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Institutional Login
          </Button>
        </>
      )}
    </div>
  )
}
