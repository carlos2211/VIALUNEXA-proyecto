import { useAppData } from '../context/AppDataContext'
import { useAuth } from '../context/AuthContext'

/** Registros de flota del conductor conectado (si ya los completó) */
export function useMyFleet() {
  const { fleet } = useAppData()
  const { user } = useAuth()
  return {
    driver: fleet.drivers.find(d => d.userId === user?.id),
    vehicle: fleet.vehicles.find(v => v.userId === user?.id),
  }
}
