/// <reference types="vite/client" />

declare module 'vue-virtual-scroller' {
  import type { DefineComponent } from 'vue'

  export const DynamicScroller: DefineComponent<Record<string, any>>
  export const DynamicScrollerItem: DefineComponent<Record<string, any>>
  export const RecycleScroller: DefineComponent<Record<string, any>>
  export const RecycleScrollerItem: DefineComponent<Record<string, any>>

  const VueVirtualScroller: { install: (app: any) => void }
  export default VueVirtualScroller
}
