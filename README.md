# 💰 攤派金額計算器 / Money Allocation Calculator

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.22-FF3E00.svg)](https://kit.svelte.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一個用於計算折扣後金額攤派的 Web 應用程式。當外送訂單有折扣（固定金額或比例折扣）時，可以依照每個人的原始金額比例，公平地分配折扣後的總金額，並處理台幣無小數的分配問題。

A web application for calculating fair money allocation after discounts. When food delivery orders have discounts (fixed amount or percentage), it distributes the discounted total amount proportionally based on each person's original amount, handling the integer-only currency distribution problem.

## ✨ 功能特色 / Features

- 🎯 **比例分配算法** - 依照原始金額比例公平分配折扣後金額
- 💵 **整數處理** - 自動處理台幣無小數的分配問題，確保總金額正確
- 📊 **詳細計算過程** - 顯示每個人的比例、理論值、餘數和最終分配金額
- 🎨 **現代化 UI** - 使用 SvelteKit 和 Tailwind CSS 打造的響應式介面
- ✅ **輸入驗證** - 完整的表單驗證和錯誤提示
- 🔄 **動態成員管理** - 可以新增或移除參與者

## 🛠️ 技術棧 / Tech Stack

- **前端框架**: [SvelteKit](https://kit.svelte.dev/) - 現代化的全端框架
- **語言**: [TypeScript](https://www.typescriptlang.org/) - 型別安全的 JavaScript
- **樣式**: [Tailwind CSS](https://tailwindcss.com/) - 實用優先的 CSS 框架
- **UI 元件**: [shadcn-svelte](https://www.shadcn-svelte.com/) - 高品質的 UI 元件庫
- **圖示**: [Lucide Svelte](https://lucide.dev/) - 現代化的圖示庫
- **套件管理**: [Bun](https://bun.sh/) - 快速的 JavaScript 執行環境和套件管理器

## 📋 計算邏輯 / Algorithm

### 分配步驟

1. **計算比例**: 根據每個人的原始金額計算其在總金額中的比例
2. **分配整數部分**: 先將折扣後總金額的整數部分按比例分配
3. **處理餘數**: 將剩餘金額依照餘數大小（小數部分）依序分配

### 範例 / Example

假設原始總金額是 550 元，折扣後總金額是 500 元：

- **A** 的原始金額：250 元
- **B** 的原始金額：200 元  
- **C** 的原始金額：100 元

**計算過程**:

1. 計算理論分配值：
   - A: 500 × 250/550 = 227.27 元
   - B: 500 × 200/550 = 181.81 元
   - C: 500 × 100/550 = 90.90 元

2. 分配整數部分：
   - A: 227 元
   - B: 181 元
   - C: 90 元
   - 剩餘: 500 - 227 - 181 - 90 = 2 元

3. 依餘數大小分配剩餘金額：
   - C 的餘數 0.90（最大）→ 分配 1 元
   - B 的餘數 0.81（次大）→ 分配 1 元
   - A 的餘數 0.27（最小）→ 無需再分配

**最終結果**:

- A: 227 元
- B: 182 元
- C: 91 元
- 總計: 500 元 ✓

## 🚀 快速開始 / Quick Start

### 前置需求 / Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0（如果使用 npm/yarn）

### 安裝 / Installation

```bash
# 使用 Bun（推薦）
bun install

# 或使用 npm
npm install
```

### 開發 / Development

```bash
# 啟動開發伺服器
bun run dev

# 或使用 npm
npm run dev
```

應用程式將在 `http://localhost:5173` 啟動。

### 建置 / Build

```bash
# 建置生產版本
bun run build

# 預覽生產版本
bun run preview
```

## 📖 使用說明 / Usage

1. 輸入折扣後的總金額
2. 新增參與者並輸入每個人的姓名和原始金額
3. 點擊「計算」按鈕
4. 查看詳細的分配結果，包括：
   - 每個人的原始金額
   - 分配比例
   - 理論分配值
   - 最終分配金額

## 🎯 使用場景 / Use Cases

- 🍕 **外送訂單分帳** - 多人一起訂外送，有折扣時公平分帳
- 🎉 **聚餐分帳** - 餐廳用餐後有優惠券或折扣時的分帳計算
- 💼 **團體採購** - 團購時有折扣的分帳計算
- 📦 **共同購買** - 任何需要按比例分配折扣金額的場景

## 🔍 關鍵字 / Keywords

`money allocation` `金額分配` `攤派計算` `discount calculator` `分帳計算器` `proportional distribution` `比例分配` `外送分帳` `food delivery split` `SvelteKit` `TypeScript` `Taiwan currency` `台幣計算` `整數分配` `fair distribution`

## 📝 授權 / License

本專案採用 [MIT License](LICENSE) 授權。

## 🤝 貢獻 / Contributing

歡迎提交 Issue 和 Pull Request！

## 📧 聯絡方式 / Contact

如有問題或建議，歡迎在 GitHub 上開啟 Issue。

---

**Made with ❤️ using SvelteKit and TypeScript**
