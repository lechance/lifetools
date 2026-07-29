/**
 * Vuex 状态管理
 * 管理全局状态：当前分类、收藏、使用记录、搜索状态等
 */
import { createStore as createVuexStore } from 'vuex'
import { getFavorites, toggleFavorite, isFavorited, getRecords, addRecord, addSearchHistory, getSearchHistory } from '@/utils/storage'

export function createStore() {
  return createVuexStore({
    state: {
      // 当前选中的分类 key
      currentCategory: 'hot',
      // 搜索关键词
      searchQuery: '',
      // 收藏的工具 ID 列表
      favorites: getFavorites(),
      // 使用记录列表
      records: getRecords(),
      // 搜索历史
      searchHistory: getSearchHistory()
    },

    mutations: {
      /** 设置当前分类 */
      SET_CATEGORY(state, category) {
        state.currentCategory = category
      },

      /** 设置搜索关键词 */
      SET_SEARCH_QUERY(state, query) {
        state.searchQuery = query
      },

      /** 切换收藏状态 */
      TOGGLE_FAVORITE(state, toolId) {
        const result = toggleFavorite(toolId)
        if (result) {
          if (!state.favorites.includes(toolId)) {
            state.favorites.push(toolId)
          }
        } else {
          const index = state.favorites.indexOf(toolId)
          if (index > -1) {
            state.favorites.splice(index, 1)
          }
        }
      },

      /** 刷新收藏列表（从存储重新加载） */
      REFRESH_FAVORITES(state) {
        state.favorites = getFavorites()
      },

      /** 添加使用记录 */
      ADD_RECORD(state, { toolId, toolName }) {
        const records = addRecord(toolId, toolName)
        state.records = records
      },

      /** 清空使用记录 */
      CLEAR_RECORDS(state) {
        const { clearRecords } = require('@/utils/storage')
        clearRecords()
        state.records = []
      },

      /** 添加搜索历史 */
      ADD_SEARCH_HISTORY(state, keyword) {
        addSearchHistory(keyword)
        state.searchHistory = getSearchHistory()
      },

      /** 清空搜索历史 */
      CLEAR_SEARCH_HISTORY(state) {
        const { clearSearchHistory } = require('@/utils/storage')
        clearSearchHistory()
        state.searchHistory = []
      }
    },

    actions: {
      /** 切换分类 */
      switchCategory({ commit }, category) {
        commit('SET_CATEGORY', category)
      },

      /** 搜索工具 */
      searchTools({ commit }, query) {
        commit('SET_SEARCH_QUERY', query)
        if (query && query.trim()) {
          commit('ADD_SEARCH_HISTORY', query.trim())
        }
      },

      /** 收藏/取消收藏工具 */
      toggleFavorite({ commit }, toolId) {
        commit('TOGGLE_FAVORITE', toolId)
      },

      /** 记录工具使用 */
      recordUsage({ commit }, { toolId, toolName }) {
        commit('ADD_RECORD', { toolId, toolName })
      }
    },

    getters: {
      /** 当前分类 key */
      currentCategory: state => state.currentCategory,

      /** 搜索关键词 */
      searchQuery: state => state.searchQuery,

      /** 收藏列表 */
      favorites: state => state.favorites,

      /** 收藏数量 */
      favoritesCount: state => state.favorites.length,

      /** 使用记录 */
      records: state => state.records,

      /** 最近使用记录（最近5条） */
      recentRecords: state => state.records.slice(0, 5),

      /** 检查工具是否已收藏 */
      isFavorited: state => (toolId) => {
        return state.favorites.includes(toolId)
      }
    }
  })
}
