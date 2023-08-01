// setup/windicss.ts

import { defineWindiSetup } from '@slidev/types'

// ビルトインのWindi CSSの設定を拡張する
export default defineWindiSetup(() => ({
  shortcuts: {
    // デフォルトの背景をカスタマイズします
    'bg-main': 'bg-[#F5F3FF] text-[#4D1D95] dark:bg-[#4D1D95] dark:text-[#F5F3FF]',
  }
}))