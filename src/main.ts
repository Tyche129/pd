// src/main.ts
import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 引入样式依赖
import '@fortawesome/fontawesome-free/css/all.min.css'
// 💡 修改这里：引入通用的 css 文件
import 'github-markdown-css/github-markdown.css' 
import 'highlight.js/styles/github-dark.css'

createApp(App).mount('#app')