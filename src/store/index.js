/**
 * Vuex 状态管理
 * 管理全局状态：当前分类、收藏、使用记录、搜索状态等
 */
import { createStore as createVuexStore } from 'vuex'
import { getFavorites, toggleFavorite as storageToggleFavorite, getRecords, addRecord, addSearchHistory, getSearchHistory, clearRecords as storageClearRecords, clearSearchHistory as storageClearSearchHistory } from '@/utils/storage'

export function createStore() {
  return createVuexStore({
    state: {
      currentCategory: 'hot',
      searchQuery: '',
      favorites: [],
      records: [],
      searchHistory: []
    },

    mutations: {
      SET_CATEGORY(state, category) {
        state.currentCategory = category
      },

      SET_SEARCH_QUERY(state, query) {
        state.searchQuery = query
      },

      SET_FAVORITES(state, list) {
        state.favorites = list
      },

      SET_RECORDS(state, list) {
        state.records = list
      },

      SET_SEARCH_HISTORY(state, list) {
        state.searchHistory = list
      }
    },

    actions: {
      /** 页面加载时从存储异步读取状态 */
      hydrate({ commit }) {
        commit('SET_FAVORITES', getFavorites())
        commit('SET_RECORDS', getRecords())
        commit('SET_SEARCH_HISTORY', getSearchHistory())
      },

      switchCategory({ commit }, category) {
        commit('SET_CATEGORY', category)
      },

      searchTools({ commit, state }, query) {
        commit('SET_SEARCH_QUERY', query)
        if (query && query.trim()) {
          addSearchHistory(query.trim())
          commit('SET_SEARCH_HISTORY', getSearchHistory())
        }
      },

      toggleFavorite({ commit, state }, toolId) {
        storageToggleFavorite(toolId)
        commit('SET_FAVORITES', getFavorites())
      },

      recordUsage({ commit }, { toolId, toolName }) {
        const records = addRecord(toolId, toolName)
        commit('SET_RECORDS', records)
      },

      clearRecords({ commit }) {
        storageClearRecords()
        commit('SET_RECORDS', [])
      },

      clearSearchHistory({ commit }) {
        storageClearSearchHistory()
        commit('SET_SEARCH_HISTORY', [])
      },

      refreshFavorites({ commit }) {
        commit('SET_FAVORITES', getFavorites())
      }
    },

    getters: {
      currentCategory: state => state.currentCategory,
      searchQuery: state => state.searchQuery,
      favorites: state => state.favorites,
      favoritesCount: state => state.favorites.length,
      records: state => state.records,
      recentRecords: state => state.records.slice(0, 5),
      isFavorited: state => (toolId) => state.favorites.includes(toolId)
    }
  })
}
