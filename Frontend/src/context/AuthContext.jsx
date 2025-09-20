import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { AuthAPI } from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const saved = localStorage.getItem('auth:user')
    if (saved) setUser(JSON.parse(saved).user)
  }, [])

  const login = async (email, password) => {
    // Prevent login if already logged in
    const saved = localStorage.getItem('auth:user')
    if (saved) throw new Error('Already logged in. Please logout first.')
    const { data } = await AuthAPI.login({ email, password })
    setUser(data.user)
    localStorage.setItem('auth:user', JSON.stringify({ user: data.user }))
    return data.user
  }

  const register = async (payload) => {
    const { data } = await AuthAPI.register(payload)
    return data
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth:user')
  }

  const value = useMemo(() => ({ user, login, register, logout }), [user])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
