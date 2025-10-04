import { defineStore } from 'pinia'
import { getRegions } from '@/api/request'

export const useRegionStore = defineStore('region', {
  state: () => ({
    regions: null,
    _regionMap: null, // id -> name string
    _regionPathMap: null, // id -> { province, city, district }
    loading: false,
  }),
  getters: {
    regionMap: (state) => {
      if (state._regionMap) return state._regionMap
      if (!state.regions) return null

      const map = new Map()
      for (const province in state.regions) {
        for (const city in state.regions[province]) {
          for (const district in state.regions[province][city]) {
            const id = state.regions[province][city][district]
            map.set(id, `${province} ${city} ${district}`)
          }
        }
      }
      state._regionMap = map
      return state._regionMap
    },
    regionPathMap: (state) => {
      if (state._regionPathMap) return state._regionPathMap
      if (!state.regions) return null

      const map = new Map()
      for (const province in state.regions) {
        for (const city in state.regions[province]) {
          for (const district in state.regions[province][city]) {
            const id = state.regions[province][city][district]
            map.set(id, { province, city, district })
          }
        }
      }
      state._regionPathMap = map
      return state._regionPathMap
    },
    getRegionNameById: (state) => {
      return (regionId) => {
        if (!state.regionMap) return '加载中...'
        return state.regionMap.get(regionId) || '未知区域'
      }
    },
    getRegionPathById: (state) => {
      return (regionId) => {
        if (!state.regionPathMap) return null
        return state.regionPathMap.get(regionId)
      }
    },
    getRegionIdsByProvince: (state) => (provinceName) => {
      if (!state.regions || !provinceName) return []
      const provinceData = state.regions[provinceName]
      if (!provinceData) return []
      const ids = []
      for (const city in provinceData) {
        for (const district in provinceData[city]) {
          ids.push(provinceData[city][district])
        }
      }
      return ids
    },
    getRegionIdsByCity: (state) => (provinceName, cityName) => {
      if (!state.regions || !provinceName || !cityName) return []
      const provinceData = state.regions[provinceName]
      if (!provinceData) return []
      const cityData = provinceData[cityName]
      if (!cityData) return []
      return Object.values(cityData)
    },
  },
  actions: {
    async fetchRegionsIfNeeded() {
      if (this.regions || this.loading) {
        return
      }
      this.loading = true
      try {
        this.regions = await getRegions()
        // Trigger getters to build maps
        this.regionMap
        this.regionPathMap
      } catch (error) {
        console.error('Failed to fetch regions', error)
      } finally {
        this.loading = false
      }
    },
  },
})
