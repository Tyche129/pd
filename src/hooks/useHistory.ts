import { ref } from 'vue'
import { HistoryItem } from '../types'

const HISTORY_KEY = 'pd_history_docs'

export function useHistory() {
  const historyList = ref<HistoryItem[]>([])

  const getHistoryList = (): HistoryItem[] => {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  // 初始化加载历史列表
  historyList.value = getHistoryList()

  const saveHistoryList = (list: HistoryItem[]) => {
    historyList.value = list
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  }

  const addToHistory = (docContent: string, docTitle: string, sourceId: string | null = null) => {
    if (!docContent || !docContent.trim()) return null

    const contentPreview = docContent.substring(0, 200)
    const timeStamp = Date.now()
    const id = sourceId || `doc_${timeStamp}`
    const docName = docTitle.trim() || `文档 ${new Date().toLocaleString()}`

    let list = [...historyList.value]
    
    // 如果传入了有效的 sourceId，说明是已经绑定的历史文档，去队列里查重更新
    const existingIndex = sourceId ? list.findIndex(item => item.id === sourceId) : -1

    let finalId = id
    if (existingIndex !== -1) {
      // 找到了旧历史条目：直接原地更新它并置顶
      const existingItem = list[existingIndex]
      existingItem.timestamp = timeStamp
      existingItem.content = docContent
      existingItem.name = docName
      existingItem.preview = contentPreview
      list.splice(existingIndex, 1)
      list.unshift(existingItem)
      finalId = existingItem.id
    } else {
      // 只有在明确新建或导入触发、或者确实没找到该 ID 时，才允许新增
      const newRecord: HistoryItem = {
        id,
        name: docName,
        content: docContent,
        preview: contentPreview,
        timestamp: timeStamp
      }
      list.unshift(newRecord)
      if (list.length > 50) list.pop() // 最多限制 50 条
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