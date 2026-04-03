import { create } from 'zustand'
import api from '../services/api' // Assuming standard api/axios setup in the project

const usePredictionsStore = create((set, get) => ({
  forecast: null,
  nextFestival: null,
  hasEnoughData: false,
  modelType: 'sarima_v1',
  upgradeAvailable: false,
  recordsToUpgrade: null,
  isUpgrading: false,
  isLoading: false,
  error: null,
  
  fetchPredictions: async (productId) => {
    set({ isLoading: true, error: null })
    try {
      const res = await api.get(`/predictions/seasonal?product_id=${productId}`)
      set({
        forecast: res.data.forecast,
        nextFestival: res.data.next_festival,
        hasEnoughData: res.data.has_enough_data,
        modelType: res.data.model_type,
        upgradeAvailable: res.data.upgrade_available,
        recordsToUpgrade: res.data.records_to_upgrade,
        isLoading: false
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  triggerUpgrade: async (productId) => {
    set({ isUpgrading: true })
    try {
      const res = await api.post('/predictions/trigger-upgrade', { product_id: productId })
      set({
        upgradeAvailable: !res.data.upgrade_queued,
        isUpgrading: false
      })
      // Re-fetch after short delay to pick up new model_type
      setTimeout(() => get().fetchPredictions(productId), 5000)
    } catch (err) {
      set({ error: err.message, isUpgrading: false })
    }
  },
  
  clearPredictions: () => set({ forecast: null, nextFestival: null })
}))

export default usePredictionsStore
