<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { useHistory } from './hooks/useHistory'

// 初始化配置 Marked
marked.use({
  extensions: [
    {
      name: 'code',
      renderer(token) {
        // 这里的 token 包含了 code 和 lang
        const lang = token.lang || 'plaintext'
        const validLanguage = hljs.getLanguage(lang) ? lang : 'plaintext'
        const highlighted = hljs.highlight(token.text, { language: validLanguage }).value
        return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`
      }
    }
  ],
  async: false,
  breaks: true,
  gfm: true
})

// 核心状态管理
const editorContent = ref('')
const currentDocId = ref<string | null>(null)
const currentDocName = ref('未命名文档')
const mdLinkInput = ref('')
const isPreviewOnly = ref(false)
const saveStatus = ref('就绪')

// 💡 状态控制锁：默认禁止编辑时触发新建历史条目
const allowCreateHistory = ref(false)

const editorRef = ref<HTMLTextAreaElement | null>(null)
const previewContainerRef = ref<HTMLDivElement | null>(null)

// 引入历史记录管理 Hook
const { historyList, addToHistory, deleteHistoryItem, clearAllHistory } = useHistory()

// 计算属性
const wordCount = computed(() => editorContent.value.length)
const parsedHtml = computed(() => marked.parse(editorContent.value))

// 自动生成标题逻辑
const generateDefaultTitle = (content: string) => {
  const firstLine = content.split('\n')[0].replace(/^#+/, '').trim()
  if (firstLine.length > 0 && firstLine.length < 40) return firstLine
  return `笔记_${new Date().toLocaleDateString()}`
}

// 自动保存至本地草稿 (同步滚动)
const triggerRender = () => {
  localStorage.setItem('pd_content_dark', editorContent.value)
  saveStatus.value = "自动保存中..."
  setTimeout(() => saveStatus.value = "已保存", 400)
  syncScroll()
}

// 滚动同步
const syncScroll = () => {
  if (isPreviewOnly.value || !editorRef.value || !previewContainerRef.value) return
  const editor = editorRef.value
  const preview = previewContainerRef.value
  
  if (!editor.scrollHeight || editor.clientHeight === 0) return
  const scrollRatio = editor.scrollTop / (editor.scrollHeight - editor.clientHeight)
  const destScrollTop = scrollRatio * (preview.scrollHeight - preview.clientHeight)
  preview.scrollTop = isNaN(destScrollTop) ? 0 : destScrollTop
}

// 监听编辑器输入（防抖）
let historyDebounce: NodeJS.Timeout | null = null
watch(editorContent, (newContent) => {
  triggerRender() // 无论什么时候打字，都会自动更新网页草稿缓存
  
  if (historyDebounce) clearTimeout(historyDebounce)
  historyDebounce = setTimeout(() => {
    if (!newContent || !newContent.trim()) return

    if (currentDocId.value) {
      // 1. 如果已经打开或绑定了某篇历史文件，只进行原地覆盖更新
      addToHistory(newContent, currentDocName.value, currentDocId.value)
    } else if (allowCreateHistory.value && newContent.trim().length > 10) {
      // 2. 只有当明确点了“新建文件”解开锁之后，才允许在这里唯一一次创建新文件条目
      const title = generateDefaultTitle(newContent)
      const savedId = addToHistory(newContent, title, null)
      if (savedId) {
        currentDocId.value = savedId
        currentDocName.value = title
      }
      // 💡 创建完毕立刻上锁，接下来日常打字不再触发新建
      allowCreateHistory.value = false
    }
  }, 800)
})

// 功能操作：新建文件
const createNewFile = () => {
  if (editorContent.value.trim().length > 0) {
    if (!confirm("新建文件会丢失当前未保存的内容，确定继续吗？")) return
  }
  editorContent.value = "# 崭新的文档 ✨\n\n在这里书写你的灵感..."
  currentDocId.value = null
  currentDocName.value = "未命名文档"
  
  // 💡 显式解锁：允许在接下来的输入中在历史记录列表中创建一条全新记录
  allowCreateHistory.value = true 
  
  saveStatus.value = "已创建新文件"
  editorRef.value?.focus()
}

// 触发文件输入选择
const triggerFileInput = () => {
  document.getElementById('fileInput')?.click()
}

// 功能操作：导入本地 .md 文件
const importFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    const content = ev.target?.result as string
    editorContent.value = content
    const fileName = file.name.replace(/\.md$|\.markdown$|\.txt$/i, '') || "导入文档"
    currentDocName.value = fileName
    
    // 💡 明确行为：直接触发 Hook 创建全新历史，并把返回的 ID 直接绑定，随后锁死创建权限
    const savedId = addToHistory(content, fileName, null)
    currentDocId.value = savedId
    allowCreateHistory.value = false
    
    saveStatus.value = `已导入: ${file.name}`
  }
  reader.readAsText(file, 'UTF-8')
  target.value = '' 
}

// 功能操作：从链接导入远程文件
const importFromLink = async () => {
  let url = mdLinkInput.value.trim()
  if (!url) {
    alert("请输入有效的链接地址")
    return
  }
  if (url.includes('github.com') && url.includes('/blob/')) {
    url = url.replace('/blob/', '/raw/')
  }
  saveStatus.value = "正在加载远程文档..."
  try {
    const response = await fetch(url, { cache: "no-cache" })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text()
    
    editorContent.value = text
    let fileName = "远程文档"
    const urlParts = url.split('/')
    const lastPart = urlParts.pop() || "document"
    fileName = lastPart.endsWith('.md') ? lastPart.slice(0, -3) : lastPart.substring(0, 30)
    
    currentDocName.value = fileName
    
    // 💡 明确行为：远端拉取成功，直接将其持久化为新历史卡片，绑定 ID 并上锁
    const savedId = addToHistory(text, fileName, null)
    currentDocId.value = savedId
    allowCreateHistory.value = false
    
    saveStatus.value = `已打开链接: ${fileName}`
    mdLinkInput.value = ''
    if (isPreviewOnly.value) isPreviewOnly.value = false
    editorRef.value?.focus()
  } catch (err: any) {
    alert(`无法加载链接内容: ${err.message}`)
    saveStatus.value = "链接加载失败"
  }
}

// 打开一条选中的历史文件
const openHistoryDoc = (id: string) => {
  const item = historyList.value.find(h => h.id === id)
  if (item) {
    editorContent.value = item.content
    currentDocId.value = item.id
    currentDocName.value = item.name
    allowCreateHistory.value = false // 既然是打开旧文件，当然禁止创建新条目
    
    addToHistory(item.content, item.name, item.id) // 刷新它在列表里的最后编辑时间
    saveStatus.value = `已打开: ${item.name}`
    if (isPreviewOnly.value) isPreviewOnly.value = false
    editorRef.value?.focus()
  }
}

// 删除某条记录
const handleDeleteHistory = (id: string) => {
  deleteHistoryItem(id)
  if (currentDocId.value === id) {
    currentDocId.value = null
    currentDocName.value = "未命名文档"
  }
  saveStatus.value = "已删除历史记录"
}

// 清空所有历史
const handleClearAllHistory = () => {
  if (confirm("⚠️ 清空所有历史记录不可恢复，确定要清空吗？")) {
    clearAllHistory()
    currentDocId.value = null
    currentDocName.value = "未命名文档"
    allowCreateHistory.value = false
    saveStatus.value = "历史已清空"
  }
}

// 导出 Markdown 文件
const exportFile = () => {
  const blob = new Blob([editorContent.value], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = currentDocName.value !== "未命名文档" ? `${currentDocName.value}.md` : `PD_${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}

// 导出 HTML
const exportHTML = () => {
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Exported HTML</title></head><body>${parsedHtml.value}</body></html>`
  const blob = new Blob([fullHTML], { type: "text/html" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = "export.html"
  link.click()
  URL.revokeObjectURL(link.href)
}

// 工具栏快捷代码注入
const insertText = (before: string, after: string) => {
  if (!editorRef.value) return
  const textarea = editorRef.value
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const val = editorContent.value
  
  editorContent.value = val.substring(0, start) + before + val.substring(start, end) + after + val.substring(end)
  
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + before.length, end + before.length)
  }, 0)
}

// 初始化加载环境
onMounted(() => {
  const saved = localStorage.getItem('pd_content_dark')
  // 恢复草稿，此时属于常规页面刷新，不产生任何历史文件
  editorContent.value = saved || "# PD Pro\n\n在这里书写你的灵感..."
  currentDocId.value = null
  currentDocName.value = "未命名文档"
  allowCreateHistory.value = false // 锁死
  
  setTimeout(syncScroll, 100)
})
</script>

<template>
  <div class="app-container" :class="{ 'preview-only': isPreviewOnly }">
    <aside>
      <div class="brand"><i class="fas fa-feather"></i><span>PD Pro</span></div>

      <button class="nav-btn" @click="createNewFile">
        <i class="fas fa-file-circle-plus"></i><span>新建文件</span>
      </button>
      <button class="nav-btn" @click="triggerFileInput">
        <i class="fas fa-upload"></i><span>导入 .md 文件</span>
      </button>
      <button class="nav-btn" @click="exportFile">
        <i class="fas fa-download"></i><span>导出 .md</span>
      </button>
      <button class="nav-btn" @click="exportHTML">
        <i class="fas fa-download"></i><span>导出 .html</span>
      </button>
      <button class="nav-btn" @click="isPreviewOnly = !isPreviewOnly">
        <i class="fas fa-eye"></i><span>预览模式</span>
      </button>

      <div class="import-link-area">
        <input v-model="mdLinkInput" type="text" class="link-input" placeholder="粘贴 .md 文件链接" spellcheck="false">
        <button class="import-link-btn" @click="importFromLink"><i class="fas fa-link"></i> 打开</button>
      </div>

      <div class="history-section">
        <div class="history-title">
          <span><i class="far fa-clock"></i> 历史文档</span>
          <button v-if="historyList.length" class="clear-history-btn" @click="handleClearAllHistory">清空</button>
        </div>
        <div class="history-list">
          <div v-if="!historyList.length" class="empty-history">暂无历史记录</div>
          <div v-for="item in historyList" :key="item.id" class="history-item">
            <div class="history-info" @click="openHistoryDoc(item.id)">
              <div class="history-name" :title="item.name">
                📄 {{ item.name.length > 24 ? item.name.slice(0, 24) + '...' : item.name }}
              </div>
              <div class="history-meta">
                <span><i class="far fa-calendar-alt"></i> {{ new Date(item.timestamp).toLocaleDateString() }}</span>
                <span>{{ item.content.length }} 字</span>
              </div>
            </div>
            <div class="history-actions">
              <button class="history-del" @click.stop="handleDeleteHistory(item.id)"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        </div>
      </div>

      <input type="file" id="fileInput" accept=".md, .txt, .markdown" style="display:none" @change="importFile">
      <div class="footer-meta">
        <div>字数: {{ wordCount }}</div>
      </div>
    </aside>

    <main>
      <div class="workspace-card">
        <div class="edit-toolbar">
          <button class="tool-btn" title="粗体" @click="insertText('**','**')"><i class="fas fa-bold"></i></button>
          <button class="tool-btn" title="斜体" @click="insertText('*','*')"><i class="fas fa-italic"></i></button>
          <button class="tool-btn" title="居中" @click="insertText('<center>', '</center>')"><i class="fas fa-align-center"></i></button>
          <button class="tool-btn" title="代码块" @click="insertText('```\n','\n```')"><i class="fas fa-code"></i></button>
          <button class="tool-btn" title="链接" @click="insertText('[', '](https://)')"><i class="fas fa-link"></i></button>
          <div style="flex:1"></div>
          <div class="save-status">{{ saveStatus }}</div>
        </div>
        
        <div class="split-view">
          <textarea 
            ref="editorRef" 
            v-model="editorContent" 
            id="editor" 
            spellcheck="false" 
            placeholder="在此输入 Markdown..."
            @scroll="syncScroll"
          ></textarea>
          <div ref="previewContainerRef" class="preview-pane">
            <article class="markdown-body markdown-dark" v-html="parsedHtml"></article>
          </div>
        </div>
      </div>
    </main>

    <button v-if="isPreviewOnly" id="exitPreview" @click="isPreviewOnly = false">
      <i class="fas fa-edit"></i> 退出预览
    </button>
  </div>
</template>