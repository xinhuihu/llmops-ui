import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue, { addI18nMessages, useLocale } from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon'
import enUS from '@arco-design/web-vue/es/locale/lang/en-us'

import App from '@/App.vue'
import router from '@/router'

import '@arco-design/web-vue/dist/arco.css'
import '@/assets/styles/main.css'

// 全局将 Arco 组件内置文案（上传、分页、空状态等）切换为英文
addI18nMessages({ 'en-US': enUS })
useLocale('en-US')

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ArcoVue)
app.use(ArcoVueIcon)

app.mount('#app')
