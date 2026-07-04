# AinurPOS Live System - Complete Feature Matrix & UI Specification

**Documentation Date:** 2026-07-04  
**System:** CloudShop POS (AinurPOS Web)  
**URL:** https://web.ainurpos.com.ua  
**Version:** 4.0.1  
**Purpose:** Complete documentation for cloning in StarNet Core Cashier App

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [UI Layout & Design Specifications](#ui-layout--design-specifications)
3. [Complete Feature List](#complete-feature-list)
4. [Detailed Component Breakdown](#detailed-component-breakdown)
5. [Technical Implementation Notes](#technical-implementation-notes)
6. [Screenshots Reference](#screenshots-reference)

---

## EXECUTIVE SUMMARY

AinurPOS is a modern, web-based point-of-sale system with a clean, responsive interface optimized for touch interactions. The system provides comprehensive retail management including product sales, inventory tracking, customer management, payment processing, shift management, and reporting capabilities.

**Key Characteristics:**
- **Interface Language:** Ukrainian (multi-language support available)
- **Color Scheme:** Blue (#2E7BD6) primary, white/light gray backgrounds, orange (#FF8C00) accents
- **Layout:** Dual-panel design (product grid left, cart/customer right)
- **Responsiveness:** Fully responsive, mobile-friendly
- **Technology:** Modern web app with PWA capabilities

---

## UI LAYOUT & DESIGN SPECIFICATIONS

### Color Palette

```
Primary Colors:
- Primary Blue: #2E7BD6 (buttons, headers, accents)
- Primary Blue (Dark): #1E5BA6 (hover states)
- Background White: #FFFFFF
- Background Light Gray: #F5F5F5
- Text Dark: #333333
- Text Gray: #666666
- Orange Accent: #FF8C00 (action buttons)
- Green Success: #28A745 (payment button)
- Red Alert: #DC3545 (delete, cancel actions)

Secondary Colors:
- Card Border: #E0E0E0
- Divider: #DDDDDD
- Disabled: #CCCCCC
- Shadow: rgba(0, 0, 0, 0.1)
```

### Typography

```
Font Family: System UI, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

Font Sizes:
- Header (H1): 24px, bold
- Subheader (H2): 20px, semi-bold
- Body Text: 14px, regular
- Small Text: 12px, regular
- Button Text: 14px, medium
- Price (Large): 18px, bold
- Product Name: 14px, medium
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER BAR (Fixed, height: 64px, bg: #2E7BD6)             │
│ ┌──────┐  AinurPOS Logo    [Search][Barcode][Customer][Profile]│
│ │ Menu │                                                     │
│ └──────┘                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────┐  ┌──────────────────────────────┐ │
│  │                    │  │  CART PANEL                  │ │
│  │  PRODUCT GRID      │  │  (Fixed Right, width: 380px) │ │
│  │  (Flex, responsive)│  │                              │ │
│  │                    │  │  [Customer Badge]            │ │
│  │  [Product Cards]   │  │  ┌────────────────────────┐ │ │
│  │  [Product Cards]   │  │  │ Item 1        15.00 грн│ │ │
│  │  [Product Cards]   │  │  │ Item 2        38.00 грн│ │ │
│  │                    │  │  └────────────────────────┘ │ │
│  │                    │  │                              │ │
│  │                    │  │  Quick Add Buttons          │ │
│  │                    │  │  [+20.00] [+2.00] [+32.00]  │ │
│  │                    │  │                              │ │
│  └────────────────────┘  │  ──────────────────────────  │ │
│                          │  Підсумок:      53.00грн.   │ │
│                          │  Знижка 0.00%:   0.00грн.   │ │
│                          └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ FOOTER BAR (Fixed, height: 60px)                           │
│ [Menu] Store Info / Shift Info      [...] [ПРОДАЖ 53.00]  │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### Product Card
```
Dimensions: 140px × 200px
Border: 1px solid #E0E0E0
Border Radius: 8px
Padding: 12px
Background: #FFFFFF
Hover: Shadow 0 2px 8px rgba(0,0,0,0.15)

Structure:
- Product Image Placeholder (120px × 120px, gray icon if no image)
- Product Name (14px, 2 lines max, ellipsis)
- Product Code (12px, gray, 1 line)
- Price (18px, bold, bottom-aligned)
- Quantity Controls (shown on selection)
  - [-] Button (28px × 28px)
  - Quantity Display (40px wide, center)
  - [+] Button (28px × 28px)
```

#### Cart Item
```
Height: Auto (min 60px)
Border Bottom: 1px solid #E0E0E0
Padding: 12px
Background: #FFFFFF

Structure:
- Item Icon (24px × 24px, left)
- Item Name (14px, bold, truncate)
- Item Details (12px, gray)
- Quantity Badge (×1, right side)
- Price (18px, bold, right-aligned)
- Remove Button (× icon, top-right)
```

#### Button Styles

**Primary Button (ПРОДАЖ):**
```css
background: #2E7BD6
color: #FFFFFF
font-size: 16px
font-weight: 600
height: 56px
border-radius: 8px
box-shadow: 0 2px 4px rgba(0,0,0,0.1)
```

**Secondary Button:**
```css
background: #FFFFFF
color: #2E7BD6
border: 1px solid #2E7BD6
font-size: 14px
height: 40px
border-radius: 6px
```

**Action Button (Orange):**
```css
background: #FF8C00
color: #FFFFFF
font-size: 14px
height: 40px
border-radius: 6px
```

---

## COMPLETE FEATURE LIST

### 1. PRODUCT MANAGEMENT

#### 1.1 Product Display
- ✅ **Grid View:** Responsive product grid with card layout
- ✅ **Product Cards:** Show image placeholder, name, code, price
- ✅ **Category Navigation:** Top category tabs/filters
- ✅ **Category Hierarchy:** "Головна" (Home), "Кофе" (Coffee), "Група" sections
- ✅ **Inventory Badges:** Stock quantity indicators (11.5 шт, 99 шт, etc.)
- ✅ **Product Codes:** Display barcode/SKU (e.g., 2002252000001)
- ✅ **No Image Handling:** Gray placeholder icon for products without images

#### 1.2 Product Search & Filter
- ✅ **Search Bar:** "Пошук за найменуванням, артикулом, штрихкодом, кодом та описом"
- ✅ **Barcode Scanner:** Dedicated barcode icon button in header
- ✅ **Search Scope:** Name, article number, barcode, code, description
- ✅ **Real-time Search:** Instant filtering as user types

#### 1.3 Product Selection & Editing
- ✅ **Quick Add:** Single click adds to cart with quantity 1
- ✅ **Quantity Controls:** [-] [number] [+] buttons on product cards
- ✅ **Item Edit Dialog:** Opens on cart item click
  - Price adjustment (Ціна field)
  - Discount controls:
    - Percentage discount (Знижка %)
    - Fixed amount discount (грн.)
  - Quantity adjustment with large [-] [+] buttons
  - Total calculation display (Підсумок)
  - Save button (ЗАСТОСУВАТИ, orange)

#### 1.4 Product Sorting & Filtering
- ✅ **Sort Options:**
  - За найменуванням (By name)
  - За ціною (By price)
  - За датою зміни (By modification date)
  - За зростанням (Ascending)
  - За спаданням (Descending)
- ✅ **Zero Stock Display:**
  - Показувати (Show)
  - Не показувати (Don't show)

---

### 2. SHOPPING CART & CHECKOUT

#### 2.1 Cart Management
- ✅ **Cart Panel:** Fixed right sidebar (380px width)
- ✅ **Cart Items Display:**
  - Item icon
  - Item name and details
  - Quantity badge (×1)
  - Individual price
  - Remove button (×)
- ✅ **Cart Actions:**
  - Item quantity adjustment
  - Item removal
  - Cart clearing
  - Hold/Save sale (Відкласти чек)
  - Cancel sale (Скасувати чек)

#### 2.2 Cart Summary
- ✅ **Subtotal Display:** "Підсумок: XX.XXгрн."
- ✅ **Discount Display:** "Знижка 0.00%: 0.00грн."
- ✅ **Grand Total:** Shown on ПРОДАЖ button

#### 2.3 Quick Add Buttons
- ✅ **Related Products:** Shows related/frequently bought items below cart
- ✅ **Quick Add Prices:** Small buttons with prices (e.g., +20.00, +2.00, +32.00)
- ✅ **Product Preview:** Shows product name and price on quick-add buttons

#### 2.4 Recommendations Panel
- ✅ **"Купуєте разом" Section:** (Buy Together)
  - Shows complementary products
  - Price display
  - One-click add to cart
- ✅ **Multiple Recommendations:** Grid of 4+ quick-add items

---

### 3. PAYMENT PROCESSING

#### 3.1 Payment Screen (Платежі / Прийняти оплату)
- ✅ **Left Panel - Cart Summary:**
  - Підсумок (Subtotal): 53.00грн.
  - Готівка (Cash): 0.00грн.
  - Безготівковий (Card/Non-cash): 0.00грн.
  - Відстрочення (Deferred): 0.00грн.
  - Прийнято (Accepted): 0.00грн.
- ✅ **Right Panel - Payment Input:**
  - Customer attachment section
  - Payment method buttons (large, icon-based)
  - Amount input field (large, centered)
  - Quick amount buttons (53, 55, 200, 500, 2 000, 5 000)
  - Accept payment button (ПРИЙНЯТИ XX.XXгрн.)

#### 3.2 Payment Methods
- ✅ **Готівка (Cash):**
  - Large button with cash icon
  - Blue background when selected
- ✅ **Безготівковий (Card/Non-cash):**
  - Large button with card icon
  - Shows "КАРТА" label when selected
- ✅ **Відстрочення (Deferred/Credit):**
  - Large button with deferred payment icon
  - For postponed payments

#### 3.3 Split Payment
- ✅ **Multiple Payment Types:** Can accept partial payments across methods
- ✅ **Payment Breakdown:** Shows amount accepted per payment type
- ✅ **Remaining Balance:** Calculates and displays remaining amount

#### 3.4 Payment Options
- ✅ **Comment Field:** "Коментар на продаж" for sale notes
- ✅ **Receipt Printing Toggle:** "Друкувати чек" checkbox
- ✅ **Change Calculation:** Automatic change calculation for cash payments

---

### 4. CUSTOMER MANAGEMENT

#### 4.1 Customer Search & Selection
- ✅ **Customer Button:** "Клієнт" in header with customer icon (orange)
- ✅ **Search Dialog:** Opens modal with search input
- ✅ **Search Fields:** 
  - Пошук покупця на ім'я (Search by name)
  - телефон (phone)
  - email (email)
  - та дисконтну картку (and discount card)
- ✅ **Quick Search:** ESC keyboard shortcut
- ✅ **Close Button:** "ЗАКРИТИ" button with ESC shortcut label

#### 4.2 Customer Display
- ✅ **Customer Badge:** Shows selected customer in cart panel
- ✅ **Customer Change Button:** "ЗМІНЮВАТИ" to change customer

#### 4.3 Customer Integration
- ✅ **Receipt Association:** Customer attached to receipt
- ✅ **Discount Application:** Automatic customer discount application
- ✅ **Loyalty Card Support:** Barcode/card number search capability

---

### 5. SHIFT MANAGEMENT

#### 5.1 Shift Operations (via Menu)
- ✅ **Open Shift:** Start new cashier shift
- ✅ **Close Shift:** "Закрити зміну" end shift with Z-report
- ✅ **Shift Information:** Display in footer bar

#### 5.2 Cash Register Management
- ✅ **Cash Register Selection:** Choose from available registers
- ✅ **Register List Display:**
  - Register ID (N1)
  - Store name (магазин-заготовча)
  - Balance (БАЛАНС, ГРН: 1,816.69)
  - Cashiers assigned (Баранецька М.В, Баранецька Марина Володимирівна)
  - Terminal info (Каса)
  - Creation date (21 жовтня 07:01)
- ✅ **Create New Register:** "Створювати" button
- ✅ **Total Balance Display:** "Всього грошей в касах" summary

#### 5.3 Shift History
- ✅ **Shift List:** "Зміни" menu item
- ✅ **Shift Details:** View past shift information
- ✅ **Shift Reports:** X and Z reports access

---

### 6. RECEIPT MANAGEMENT & HISTORY

#### 6.1 Receipt Journal (Журнал чеків)
- ✅ **Receipt List Display:**
  - Receipt number (Продаж #30539, #30535, etc.)
  - Date and time (11 травня 08:41)
  - Cashier name (Баранецька М.В)
  - Store location (магазин-заготовча)
  - Customer (Клієнт)
  - Total amount (56,00грн., 197,00грн., etc.)
- ✅ **Action Buttons:**
  - ДРУК (Print receipt)
  - ПОВЕРНЕННЯ (Return/Refund)
- ✅ **Receipt Details:**
  - Оплачений (Paid status)
  - Список товарів (Product list) - expandable sections
  - Item count (1 поз., 3 поз., 2 поз.)
- ✅ **Date Filter:** "ВИБЕРІТЬ ДАТУ" date picker
- ✅ **Search Filters:**
  - Номер документу (Document number)
  - Клієнт (Customer)
  - Товар (Product)
- ✅ **Close Button:** "ЗАКРИТИ" with ESC shortcut

#### 6.2 Receipt Actions
- ✅ **Print Receipt:** Reprint existing receipt
- ✅ **Return Processing:** Initiate return from receipt
- ✅ **Receipt Details:** Expand to view full item list
- ✅ **Receipt Status:** Paid/Unpaid indicators

---

### 7. RETURNS & REFUNDS

#### 7.1 Return Creation
- ✅ **Return Menu Item:** "Створити повернення" in main menu
- ✅ **Return from Receipt:** "ПОВЕРНЕННЯ" button in receipt journal
- ✅ **Return Board:** "Повернення борту" menu option

#### 7.2 Return Processing
- ✅ **Product Selection:** Choose items to return
- ✅ **Quantity Specification:** Specify return quantity
- ✅ **Reason Tracking:** Optional return reason
- ✅ **Refund Processing:** Process refund through payment methods

---

### 8. REPORTS & ANALYTICS

#### 8.1 Cash Reports
- ✅ **Z-Report:** End of shift cash reconciliation
- ✅ **X-Report:** Mid-shift cash report (non-closing)
- ✅ **Receipt Journal:** Full transaction history

#### 8.2 Sales Tracking
- ✅ **Transaction History:** View all past sales
- ✅ **Receipt Search:** Find receipts by number, customer, product
- ✅ **Date Range Filter:** Filter receipts by date

#### 8.3 Financial Overview (from Dashboard)
- ✅ **Store Performance Metrics:**
  - Показники за місяць (Monthly metrics)
  - Оцінка складу всім магазинам (Inventory valuation)
- ✅ **Store Totals:**
  - Кількість товарів: 14,926.088 од (Product quantity)
  - У продажних цінах: 333,999.79 грн. (Retail value)
  - По собівартості: 232,646.75 грн. (Cost value)

---

### 9. SETTINGS & CONFIGURATION

#### 9.1 Basic Settings (Основні)
- ✅ **Theme/Appearance (Оформлення):**
  - Автоматично (Automatic)
  - Світлий (Light) - selected
  - Темний (Dark)
- ✅ **Sound Settings (Звук):**
  - Увімкнути (On) - selected
  - Вимкнути (Off)
- ✅ **Interface Language (Мова інтерфейсу):**
  - English
  - Русский
  - Українська - selected
  - Azərbajani
  - Հայերեն (Armenian)
  - Қазақ (Kazakh)
  - Кыргызча (Kyrgyz)
  - Türkçe (Turkish)

#### 9.2 Printer Settings (Друк на принтері)
- ✅ **Print on Save Checkbox:** "Друкувати чек за замовчуванням"
- ✅ **Printer Type:**
  - Принтер A4 (A4 printer)
  - Принтер чека (Receipt printer) - selected
- ✅ **Receipt Margins:**
  - Ширина сторіки: 80 мм (Page width)
  - Розмір шрифту: 4 мм (Font size)
  - Відступ на краях: 4 мм (Edge margin)

#### 9.3 Product Display Settings
- ✅ **Zero Stock Display (Товари з нульовим залишком):**
  - Показувати (Show) - selected
  - Не показувати (Don't show)
- ✅ **Product Sorting (Сортування товару за):**
  - Найменування (Name)
  - Ціни (Price)
  - Дата зміни (Modification date) - selected
  - За зростанням (Ascending)
  - За спаданням (Descending) - selected

#### 9.4 Equipment Settings (Обладнання)
- ✅ **Cloud Storage Integration:**
  - Setup required notification
  - "СОЗДАТЬ ИНТЕГРАЦИЮ" button
- ✅ **Mertech QR Integration:**
  - QR scanner setup
  - Integration button
- ✅ **Barcode Scanner (Сканер штрих-кодів):**
  - Testing interface
  - Code input field for verification
- ✅ **Scale Integration (Терези):**
  - Weight scale connection
  - Testing interface

#### 9.5 Categories Settings (Категорії)
- ✅ **Category Management:** Create, edit, delete categories
- ✅ **Category Display:** Configure category view options

#### 9.6 Product Display Settings (Відображення товарів)
- ✅ **Product Card Customization:** Configure what shows on cards
- ✅ **Image Display:** Toggle product images

#### 9.7 Advanced Settings
- ✅ **Version Display:** "Версія: 4.0.1"
- ✅ **Reset to Defaults:** "ВСТАНОВИТИ НАЛАШТУВАННЯ ЗА ЗАМОВЧУВАННЯМ" button

---

### 10. USER & ACCOUNT MANAGEMENT

#### 10.1 User Profile
- ✅ **Profile Button:** User avatar/icon in header (orange circle)
- ✅ **User Info Display:**
  - Full name (Баранецька М.В)
  - Role (Власник - Owner)
- ✅ **Continue Button:** "Продовжить" to proceed past account warnings

#### 10.2 User Actions (from Menu)
- ✅ **Logout:** "Вийти" button
- ✅ **Return to Old Version:** "Повернутися до старої версії"
- ✅ **Comments Field:** "Оскарження" for user notes

#### 10.3 Account Status
- ✅ **Balance Display:** Shows account balance status
- ✅ **Account Warnings:**
  - "Акаунт заблокований" (Account blocked)
  - Insufficient balance notifications
  - 30-day profile suspension warnings
- ✅ **Payment Reminder:** "Перейти до оплати" button

---

### 11. NAVIGATION & UI CONTROLS

#### 11.1 Header Bar
- ✅ **Menu Button:** Hamburger icon (left)
- ✅ **Logo:** "AinurPOS" branding
- ✅ **Search Bar:** Global product search with icon
- ✅ **Barcode Button:** Barcode scanner trigger
- ✅ **Customer Button:** "Клієнт" with keyboard shortcut indicator
- ✅ **Profile Button:** User avatar (orange)

#### 11.2 Main Menu (Hamburger)
- ✅ **User Info Header:** Name, role, avatar
- ✅ **Menu Items:**
  - Вийти (Logout)
  - Повернутися до старої версії (Return to old version)
  - Створити повернення (Create return)
  - Закрити зміну (Close shift) - red text
  - Повернення борту (Return board)
  - Журнал чеків (Receipt journal)
  - Зміни (Shifts)
  - Налаштування (Settings)
- ✅ **Menu Animation:** Slide-in from left
- ✅ **Close Menu:** Click outside or menu toggle

#### 11.3 Footer Bar
- ✅ **Menu Toggle:** "Меню" button (left)
- ✅ **Store/Shift Info:** 
  - Store name (магазин-заготовча)
  - Shift number (Зміна #1622)
- ✅ **Shift Duration:** "4 липня, серед 21:43" timestamp
- ✅ **Actions Menu:** Three-dot button (...)
  - User info (Баранецька М.В)
  - Відкласти чек (Hold sale)
  - Скасувати чек (Cancel sale) - red text
  - Оскарження (Comments)
- ✅ **Sale Button:** "ПРОДАЖ XX.XXгрн." (large, blue, right-aligned)

#### 11.4 Keyboard Shortcuts
- ✅ **ESC:** Close dialogs/modals
- ✅ **Customer Search:** Indicated on customer button
- ✅ **Barcode Entry:** Direct input focus

---

### 12. ADMIN PORTAL SECTIONS

The admin portal (accessible via main site navigation, not POS interface) includes:

#### 12.1 Main Menu Sections (Sidebar)
- ✅ **Головна** (Home/Dashboard)
- ✅ **Точка продаж** (Point of Sale) - the interface documented above
- ✅ **Товари і послуги** (Products & Services)
- ✅ **Каса та зміни** (Cash registers & Shifts)
  - Зміни (Shifts) submenu
  - Каса (Cash registers) submenu
  - Завантажити програму (Download app)
- ✅ **Рух товару** (Product Movement/Inventory)
- ✅ **Рух грошей** (Money Movement/Accounting)
- ✅ **Звіти** (Reports)
- ✅ **Контрагенти** (Counterparties/Partners)
- ✅ **Компанія** (Company settings)
- ✅ **Інтернет-вітрина** (Online storefront)
- ✅ **Інтеграції** (Integrations)
- ✅ **Лабораторія** (Laboratory/Testing)
- ✅ **Тарифи і оплата** (Plans & Payment) - highlighted in orange
- ✅ **Кошик** (Cart)

#### 12.2 Additional Features
- ✅ **Що нового** (What's New) - notification badge with count
- ✅ **База знань** (Knowledge Base)
- ✅ **Пропозиція** (Proposals/Suggestions)

#### 12.3 Top Bar Controls
- ✅ **Інтерфейс-Касира** (Cashier Interface) - launches POS
- ✅ **Calendar Icon:** Date selection
- ✅ **Bell Icon:** Notifications (with count badge)
- ✅ **Language Selector:** Flag icon (Українська)
- ✅ **User Profile Menu:** Name and avatar

---

## DETAILED COMPONENT BREAKDOWN

### Payment Flow Walkthrough

1. **Cart Review Stage:**
   - User reviews items in cart
   - Can adjust quantities, apply discounts, remove items
   - Can attach customer for discounts/tracking
   - Cart shows subtotal, discount, and grand total

2. **Initiate Checkout:**
   - Click "ПРОДАЖ XX.XXгрн." button in footer
   - System opens payment screen

3. **Payment Screen - Left Panel:**
   - Shows transaction breakdown:
     - Підсумок (Subtotal)
     - Individual payment method amounts (initially 0.00)
     - Total accepted amount
   - Shows comment input field
   - Shows print receipt toggle

4. **Payment Screen - Right Panel:**
   - Customer section at top (can change/attach)
   - Three large payment method buttons
   - Amount input field (pre-filled with total)
   - Quick amount buttons for common denominations
   - Large accept payment button at bottom

5. **Payment Entry:**
   - Select payment method (button highlights blue)
   - Enter amount (or use quick buttons)
   - Click "ПРИЙНЯТИ" or method-specific button (e.g., "КАРТА")
   - System records partial payment
   - Can repeat for split payments

6. **Complete Transaction:**
   - When total paid ≥ total due, receipt prints (if enabled)
   - System shows success/change due
   - Returns to main POS screen with empty cart

### Hold Sale (Відкласти чек) Flow

1. User has items in cart but needs to park the sale
2. Click three-dot menu (...) in footer
3. Select "Відкласти чек"
4. System saves current cart state
5. Cart clears, ready for next customer
6. Can retrieve held sales from menu

### Return/Refund Flow

1. **From Receipt Journal:**
   - Open "Журнал чеків" from menu
   - Find original receipt
   - Click "ПОВЕРНЕННЯ" button
   - System loads receipt items
   - Select items and quantities to return
   - Process refund

2. **From Menu:**
   - Click "Створити повернення"
   - Manual product selection for return
   - Specify quantities
   - Process refund

---

## TECHNICAL IMPLEMENTATION NOTES

### Architecture Recommendations

#### Frontend
```
Technology Stack:
- Framework: React 18+ or Vue 3
- State Management: Redux Toolkit / Vuex / Pinia
- UI Library: Custom components + Material-UI base
- Routing: React Router / Vue Router
- API Client: Axios with interceptors
- Real-time: WebSocket for sync (optional)
```

#### Responsive Breakpoints
```css
/* Mobile */
@media (max-width: 768px) {
  /* Single column layout */
  /* Cart becomes modal/drawer */
  /* Product grid: 2 columns */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Product grid: 3 columns */
  /* Cart panel: 320px */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Product grid: 4-5 columns */
  /* Cart panel: 380px fixed */
}
```

#### State Management Structure
```javascript
store/
├── cart/
│   ├── cartSlice.js
│   ├── cartSelectors.js
│   └── cartActions.js
├── products/
│   ├── productsSlice.js
│   ├── productFilters.js
│   └── productSearch.js
├── customer/
│   ├── customerSlice.js
│   └── customerActions.js
├── payment/
│   ├── paymentSlice.js
│   └── paymentMethods.js
└── shift/
    ├── shiftSlice.js
    └── cashRegister.js
```

### Key Technical Features

#### 1. Barcode Scanner Integration
```javascript
// Hardware scanner listener
document.addEventListener('keypress', (e) => {
  if (barcodeBuffer.length === 0) {
    barcodeStartTime = Date.now();
  }
  
  barcodeBuffer += e.key;
  
  // If input completes quickly (< 50ms between chars), treat as barcode
  clearTimeout(barcodeTimeout);
  barcodeTimeout = setTimeout(() => {
    if (Date.now() - barcodeStartTime < 100) {
      handleBarcodeInput(barcodeBuffer);
    }
    barcodeBuffer = '';
  }, 50);
});
```

#### 2. Offline Support
```javascript
// Service Worker for offline caching
- Cache product catalog
- Queue transactions
- Sync when online
- IndexedDB for local storage
```

#### 3. Receipt Printing
```javascript
// Thermal printer integration
- ESC/POS command support
- 80mm thermal printer default
- A4 fallback option
- Browser print API
- Silent print option
```

#### 4. Touch Optimization
```css
/* Minimum touch target size */
.btn, .product-card, .cart-item {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Smooth scrolling */
.product-grid {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

#### 5. Real-time Validation
```javascript
// Price/discount validation
- Prevent negative prices
- Discount limits (0-100%)
- Quantity limits (stock availability)
- Permission-based price override
```

### Database Schema Essentials

```sql
-- Key tables for POS functionality

products
├── id (PK)
├── name
├── barcode
├── sku
├── price
├── category_id (FK)
├── stock_quantity
├── image_url
└── is_active

sales
├── id (PK)
├── receipt_number (unique)
├── cashier_id (FK)
├── customer_id (FK, nullable)
├── register_id (FK)
├── shift_id (FK)
├── subtotal
├── discount_amount
├── total_amount
├── status (paid, pending, returned)
├── payment_method
└── created_at

sale_items
├── id (PK)
├── sale_id (FK)
├── product_id (FK)
├── quantity
├── unit_price
├── discount_amount
└── line_total

held_sales
├── id (PK)
├── cashier_id (FK)
├── cart_data (JSON)
├── held_at
└── expires_at

shifts
├── id (PK)
├── register_id (FK)
├── cashier_id (FK)
├── opened_at
├── closed_at
├── opening_cash
├── closing_cash
├── expected_cash
└── variance
```

### Performance Optimizations

1. **Product Grid:**
   - Virtual scrolling for large catalogs (1000+ items)
   - Lazy load images
   - Debounced search (300ms delay)

2. **Cart Operations:**
   - Optimistic UI updates
   - Local state + sync to backend
   - Undo/redo buffer

3. **Receipt Generation:**
   - Client-side receipt rendering
   - Background print queue
   - Retry failed prints

---

## SCREENSHOTS REFERENCE

### Available Screenshots (17 total)

1. **01-login-page.webp** - Login screen with email/password fields
2. **02-account-blocked-dialog.webp** - Account status warning modal
3. **03-cash-register-history.webp** - Cash register transactions view
4. **04-main-pos-screen.webp** - Primary POS interface with product grid and empty cart
5. **05-cart-with-product.webp** - Cart panel showing single product added
6. **06-cart-multi-items.webp** - Cart with multiple items and recommendations
7. **07-menu-opened.webp** - Main hamburger menu expanded
8. **08-receipt-journal.webp** - Receipt history list with filters
9. **09-customer-search.webp** - Customer search modal dialog
10. **10-item-edit-discount.webp** - Product edit modal with discount controls
11. **11-payment-screen.webp** - Payment processing interface (cash selected)
12. **12-payment-card-method.webp** - Payment screen with card payment selected
13. **13-actions-menu-hold-sale.webp** - Footer actions menu with hold/cancel options
14. **14-settings-page.webp** - Settings main page (theme, sound, language)
15. **15-settings-printer.webp** - Printer configuration settings
16. **16-settings-complete.webp** - Additional settings (sorting, zero stock)
17. **17-equipment-settings.webp** - Hardware integration settings (scanner, scale)

### Screenshot Locations
All screenshots saved to: `/workspace/starnet-core/docs/screenshots/ainurpos-live/`

---

## IMPLEMENTATION PRIORITIES

### Phase 1: Core POS (MVP)
1. Product grid with search and categories
2. Cart management (add, remove, quantity)
3. Basic checkout (cash only)
4. Receipt printing
5. Shift open/close

### Phase 2: Enhanced Features
1. Customer management
2. Multiple payment methods
3. Discounts (item-level and cart-level)
4. Hold/recall sales
5. Receipt journal

### Phase 3: Advanced Features
1. Returns/refunds
2. Barcode scanner integration
3. Offline mode
4. Split payments
5. Quick-add recommendations

### Phase 4: Admin Integration
1. Reporting dashboard
2. Inventory sync
3. User management
4. Settings sync
5. Multi-register support

---

## DIFFERENCES FROM AINURPOS (CUSTOMIZATION OPPORTUNITIES)

### Potential Improvements for StarNet Core:
1. **Touch Optimization:** Larger buttons, swipe gestures for cart items
2. **Dark Mode:** Fully implemented dark theme (AinurPOS has it, ensure parity)
3. **Keyboard Shortcuts:** More extensive keyboard navigation (NumPad support)
4. **Receipt Customization:** Template editor for receipt layouts
5. **Quick Sale Mode:** Streamlined interface for single-item sales
6. **Multi-Language:** Ensure all UI strings are internationalized
7. **Accessibility:** Full WCAG 2.1 AA compliance
8. **Performance:** <100ms product search, <50ms cart operations
9. **Progressive Web App:** Install to home screen, push notifications
10. **Voice Commands:** Optional voice input for product search

---

## APPENDICES

### A. Color Palette (Expanded)

```css
/* Brand Colors */
--color-primary: #2E7BD6;
--color-primary-dark: #1E5BA6;
--color-primary-light: #5BA3FF;
--color-secondary: #FF8C00;
--color-secondary-dark: #CC7000;

/* Neutral Colors */
--color-white: #FFFFFF;
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;

/* Semantic Colors */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

### B. Icon Set Requirements

**Essential Icons:**
- Shopping cart
- Barcode scanner
- Search
- User/customer
- Menu (hamburger)
- Plus/minus (quantity)
- Close (X)
- Check/checkmark
- Trash/delete
- Edit/pencil
- Cash money
- Credit card
- Clock (deferred payment)
- Printer
- Settings/gear
- Logout
- Product placeholder
- Category folder
- Receipt document
- Return/undo arrow

Recommended icon library: **Heroicons**, **Feather Icons**, or **Material Icons**

### C. Responsive Grid Specifications

```css
/* Product Grid Responsive Layout */
.product-grid {
  display: grid;
  gap: 16px;
  padding: 16px;
}

/* Mobile: 2 columns */
@media (max-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}

/* Tablet: 3-4 columns */
@media (min-width: 641px) and (max-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop: 4-5 columns */
@media (min-width: 1025px) {
  .product-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
```

### D. API Endpoint Structure (Recommended)

```
Authentication:
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

Products:
GET    /api/v1/products?search=&category=&page=&limit=
GET    /api/v1/products/:id
GET    /api/v1/products/barcode/:barcode
GET    /api/v1/categories

Customers:
GET    /api/v1/customers?search=&phone=&email=&card=
GET    /api/v1/customers/:id
POST   /api/v1/customers

Sales:
POST   /api/v1/sales
GET    /api/v1/sales/:id
GET    /api/v1/sales?date_from=&date_to=&customer=
PUT    /api/v1/sales/:id/refund

Cart (Hold/Recall):
POST   /api/v1/carts/hold
GET    /api/v1/carts/held
GET    /api/v1/carts/held/:id
DELETE /api/v1/carts/held/:id

Shifts:
POST   /api/v1/shifts/open
POST   /api/v1/shifts/close
GET    /api/v1/shifts/current
GET    /api/v1/shifts/history

Registers:
GET    /api/v1/registers
GET    /api/v1/registers/:id
POST   /api/v1/registers

Reports:
GET    /api/v1/reports/x-report
GET    /api/v1/reports/z-report
GET    /api/v1/reports/sales-summary
```

---

## CONCLUSION

AinurPOS provides a comprehensive, modern point-of-sale solution with excellent UX design and feature completeness. The system is well-suited for retail environments with multiple product categories, customer management needs, and multi-shift operations.

**Key Strengths:**
- Clean, intuitive interface with clear visual hierarchy
- Comprehensive feature set covering all POS needs
- Strong multi-language support (8 languages)
- Flexible payment options (cash, card, deferred, split)
- Robust receipt and reporting capabilities
- Offline-capable design considerations
- Touch-optimized for tablets/kiosks

**Implementation Complexity:**
- **Frontend Effort:** 4-6 weeks (2 developers)
- **Backend Effort:** 3-4 weeks (2 developers)
- **Testing & QA:** 2 weeks
- **Total Estimated Time:** 10-12 weeks to MVP

**Recommended Tech Stack for StarNet Core Cashier:**
- Frontend: React 18 + TypeScript + Redux Toolkit
- UI Components: Custom components based on design system
- Backend: Node.js/Express or Django/FastAPI
- Database: PostgreSQL
- Real-time: WebSocket for multi-register sync
- Printing: ESC/POS library (node-thermal-printer or similar)
- Offline: IndexedDB + Service Workers

This documentation provides a complete blueprint for implementing a feature-complete POS system matching or exceeding AinurPOS capabilities in the StarNet Core cashier application.

---

**Document Version:** 1.0  
**Last Updated:** 2026-07-04  
**Author:** AI Documentation Agent  
**Review Status:** Ready for Implementation
