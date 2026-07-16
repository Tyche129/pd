import { ref } from 'vue'
import { HistoryItem } from '../types'

const HISTORY_KEY = 'pd_history_docs'

// 💡 将状态定义在函数外部，使其成为全局单例，确保 App.vue 里任何地方使用的都是同一个响应式源
const historyList = ref<HistoryItem[]>([])

export function useHistory() {

  const getHistoryList = (): HistoryItem[] => {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  // 初始化加载历史列表（仅在第一次加载时初始化）
  if (historyList.value.length === 0) {
    historyList.value = getHistoryList()
  }

  const saveHistoryList = (list: HistoryItem[]) => {
    // 💡 显式地深拷贝或重建数组，确保触发 Vue 的响应式更新
    historyList.value = [...list]
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  }

  const addToHistory = (docContent: string, docTitle: string, sourceId: string | null = null) => {
    if (!docContent || !docContent.trim()) return null

    const contentPreview = docContent.substring(0, 200)
    const timeStamp = Date.now()
    const id = sourceId || `doc_${timeStamp}`
    const docName = docTitle.trim() || `文档 ${new Date().toLocaleString()}`

    // 💡 使用 map 深拷贝重建对象，防止 Vue 无法追踪内部属性修改
    let list = historyList.value.map(item => ({ ...item }))

    const existingIndex = sourceId ? list.findIndex(item => item.id === sourceId) : -1

    let finalId = id
    if (existingIndex !== -1) {
      // 找到了旧历史条目：原地更新并置顶
      const existingItem = list[existingIndex]
      existingItem.timestamp = timeStamp
      existingItem.content = docContent
      existingItem.name = docName
      existingItem.preview = contentPreview

      list.splice(existingIndex, 1)
      list.unshift(existingItem)
      finalId = existingItem.id
    } else {
      const newRecord: HistoryItem = {
        id,
        name: docName,
        content: docContent,
        preview: contentPreview,
        timestamp: timeStamp
      }
      list.unshift(newRecord)
      if (list.length > 50) list.pop()
    }

    saveHistoryList(list)
    return finalId
  }

  const deleteHistoryItem = (id: string) => {
    const newList = historyList.value.filter(item => item.id !== id)
    saveHistoryList(newList)
  }

  const clearAllHistory = () => {
    saveHistoryList([])
  }

  return {
    historyList,
    addToHistory,
    deleteHistoryItem,
    clearAllHistory
  }
}