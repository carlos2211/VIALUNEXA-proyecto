import { createContext, useContext, useState, type ReactNode } from 'react'
import { STORAGE_KEYS } from '../lib/constants'
import { readJSON, writeJSON } from '../lib/storage'
import type { Role, User } from '../types'

/**
 * Autenticación local de demostración: usuarios y sesión viven en localStorage.
 * Sirve para separar las vistas por perfil, pero NO es seguridad real: cualquiera con acceso
 * al navegador puede leer o modificar los datos. En producción debe validarse en un servidor.
 */

/** Cuentas de prueba (contraseñas: admin123, conductor123, cliente123) */
const DEMO_USERS: User[] = [
  {
    id: 'user-admin',
    role: 'admin',
    name: 'Administración Vialunexa',
    email: 'admin@vialunexa.cl',
    phone: '+56 9 1111 1111',
    salt: 'seed-admin',
    passwordHash: '34d9c5694eaa9c5fb2a38fafc8edebb8e0dd40c79d39369b7aa4db1fba4529d0',
    created: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-driver',
    role: 'conductor',
    name: 'Pedro Soto',
    email: 'conductor@vialunexa.cl',
    phone: '+56 9 2222 2222',
    salt: 'seed-driver',
    passwordHash: 'e538a95a6638d5d1e1473999e036db657a137d69be46b3c1715591757371a4f7',
    created: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'user-client',
    role: 'cliente',
    name: 'María González',
    email: 'cliente@vialunexa.cl',
    phone: '+56 9 3333 3333',
    salt: 'seed-client',
    passwordHash: '750dbf7f0256265f0be4b88c26010fc673d6d6da65042fdfa0015bfcf0b46e2b',
    created: '2026-01-01T00:00:00.000Z',
  },
]

export const DEMO_ACCOUNTS = [
  { role: 'Administrador', email: 'admin@vialunexa.cl', password: 'admin123' },
  { role: 'Conductor', email: 'conductor@vialunexa.cl', password: 'conductor123' },
  { role: 'Cliente', email: 'cliente@vialunexa.cl', password: 'cliente123' },
]

export interface RegisterInput {
  role: Exclude<Role, 'admin'>
  name: string
  email: string
  phone: string
  password: string
}

interface Auth {
  user: User | null
  users: User[]
  /** Devuelve '' si todo salió bien, o el mensaje de error */
  login: (email: string, password: string) => Promise<string>
  register: (input: RegisterInput) => Promise<string>
  logout: () => void
  updateProfile: (patch: Partial<Pick<User, 'name' | 'phone'>>) => boolean
}

const AuthContext = createContext<Auth | null>(null)

async function hashPassword(salt: string, password: string) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

function loadUsers(): User[] {
  const list = readJSON<unknown>(STORAGE_KEYS.users, null)
  if (Array.isArray(list) && list.length) return list as User[]
  writeJSON(STORAGE_KEYS.users, DEMO_USERS)
  return DEMO_USERS
}

const normEmail = (v: string) => v.trim().toLowerCase()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState(loadUsers)
  const [userId, setUserId] = useState(() => readJSON<string>(STORAGE_KEYS.session, ''))
  const user = users.find(u => u.id === userId) ?? null

  const commitUsers = (next: User[]) => {
    if (!writeJSON(STORAGE_KEYS.users, next)) return false
    setUsers(next)
    return true
  }

  const startSession = (id: string) => {
    writeJSON(STORAGE_KEYS.session, id)
    setUserId(id)
  }

  const value: Auth = {
    user,
    users,
    login: async (email, password) => {
      const found = users.find(u => u.email === normEmail(email))
      if (!found || (await hashPassword(found.salt, password)) !== found.passwordHash)
        return 'Correo o contraseña incorrectos.'
      startSession(found.id)
      return ''
    },
    register: async ({ role, name, email, phone, password }) => {
      const mail = normEmail(email)
      if (users.some(u => u.email === mail)) return 'Ya existe una cuenta con ese correo.'
      const salt = crypto.randomUUID()
      const u: User = {
        id: 'user-' + Date.now().toString(36),
        role,
        name,
        email: mail,
        phone,
        salt,
        passwordHash: await hashPassword(salt, password),
        created: new Date().toISOString(),
      }
      if (!commitUsers([...users, u])) return 'No fue posible guardar la cuenta en este navegador.'
      startSession(u.id)
      return ''
    },
    logout: () => {
      writeJSON(STORAGE_KEYS.session, '')
      setUserId('')
    },
    updateProfile: patch => (user ? commitUsers(users.map(u => (u.id === user.id ? { ...u, ...patch } : u))) : false),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
