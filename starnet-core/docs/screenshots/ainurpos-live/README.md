# AinurPOS Live System Documentation

**Captured:** 2026-07-04  
**System:** CloudShop POS (AinurPOS Web v4.0.1)  
**URL:** https://web.ainurpos.com.ua  
**Language:** Ukrainian

---

## Quick Reference

This directory contains comprehensive documentation of the AinurPOS live system for the purpose of cloning the interface and features in the StarNet Core cashier application.

### Main Documentation

📄 **[FEATURE_MATRIX.md](./FEATURE_MATRIX.md)** - Complete feature list, UI specifications, and implementation guide

---

## Screenshot Index

### Authentication & Access
- `01-login-page.webp` - Login interface with email/password fields
- `02-account-blocked-dialog.webp` - Account status notification modal

### Main POS Interface
- `04-main-pos-screen.webp` - Primary POS interface showing product grid and cart panel
- `05-cart-with-product.webp` - Cart panel with single item added
- `06-cart-multi-items.webp` - Cart with multiple items and related product suggestions

### Navigation & Menus
- `07-menu-opened.webp` - Main hamburger menu with shift management, settings, reports
- `13-actions-menu-hold-sale.webp` - Footer actions menu (hold sale, cancel, user options)

### Customer Management
- `09-customer-search.webp` - Customer search dialog (search by name, phone, email, card)

### Product & Pricing
- `10-item-edit-discount.webp` - Product edit modal with price adjustment and discount controls

### Payment Processing
- `11-payment-screen.webp` - Payment interface with cash method selected
- `12-payment-card-method.webp` - Payment interface with card/non-cash method selected

### History & Reports
- `03-cash-register-history.webp` - Cash register transaction history view
- `08-receipt-journal.webp` - Receipt history with search filters and action buttons

### Settings & Configuration
- `14-settings-page.webp` - Main settings: theme, sound, language selection
- `15-settings-printer.webp` - Printer configuration: receipt vs A4, margins, font size
- `16-settings-complete.webp` - Additional settings: product sorting, zero stock display
- `17-equipment-settings.webp` - Hardware integrations: barcode scanner, scale, cloud storage

---

## Key Features Documented

### ✅ Core POS Functionality
- Product grid with category navigation
- Real-time search (name, barcode, SKU, description)
- Shopping cart with quantity controls
- Multi-item cart management
- Quick-add related products

### ✅ Payment & Checkout
- Multiple payment methods (Cash, Card, Deferred)
- Split payment support
- Quick amount buttons
- Customer attachment
- Receipt printing toggle
- Comment/notes field

### ✅ Customer Management
- Customer search (name, phone, email, loyalty card)
- Customer selection and attachment to sales
- Discount application

### ✅ Product Management
- Price adjustment
- Item-level discounts (percentage and fixed amount)
- Quantity controls
- Product images (with placeholder support)

### ✅ Shift Management
- Cash register selection
- Shift open/close
- Cash register balance tracking
- Multiple cashier support

### ✅ Receipt & Returns
- Receipt journal with search
- Receipt printing and reprinting
- Return/refund processing
- Transaction history

### ✅ Sales Operations
- Hold sale (park transaction)
- Recall held sales
- Cancel sale
- Transaction comments

### ✅ Settings & Configuration
- Theme selection (Light/Dark/Auto)
- Language support (8 languages)
- Printer configuration (A4/Receipt)
- Product display options
- Sound settings
- Equipment integrations

---

## UI Specifications Summary

### Color Scheme
- **Primary:** Blue (#2E7BD6)
- **Accent:** Orange (#FF8C00)
- **Success:** Green (#28A745)
- **Error:** Red (#DC3545)
- **Background:** White/Light Gray (#F5F5F5)

### Layout
- **Dual-panel design:** Product grid (left) + Cart panel (right, 380px fixed)
- **Fixed header:** 64px with navigation and tools
- **Fixed footer:** 60px with shift info and sale button
- **Responsive:** Mobile-friendly with adaptive grid

### Components
- **Product Cards:** 140×200px with image, name, code, price
- **Cart Items:** Compact list with quantity badges
- **Buttons:** Large touch targets (min 44px)
- **Modals:** Centered overlays with backdrop

---

## Implementation Priority

### Phase 1: MVP (Core POS)
1. Product grid and search
2. Cart management
3. Cash payment only
4. Basic receipt printing
5. Shift open/close

### Phase 2: Enhanced
1. Multiple payment methods
2. Customer management
3. Discounts
4. Hold/recall sales
5. Receipt journal

### Phase 3: Advanced
1. Returns/refunds
2. Barcode scanner integration
3. Offline support
4. Hardware integrations
5. Multi-register sync

---

## Technology Recommendations

### Frontend
- **Framework:** React 18+ with TypeScript
- **State:** Redux Toolkit
- **UI Library:** Custom components + Material-UI base
- **Styling:** Tailwind CSS or Styled Components

### Backend
- **API:** REST or GraphQL
- **Database:** PostgreSQL
- **Real-time:** WebSocket for register sync

### Integrations
- **Printing:** ESC/POS thermal printer support
- **Barcode:** USB/Bluetooth scanner support
- **Offline:** Service Workers + IndexedDB

---

## Usage Notes

1. **Viewing Screenshots:**
   - All screenshots are in WebP format for optimal quality/size ratio
   - View directly in browser or use any modern image viewer

2. **Reference Documentation:**
   - See `FEATURE_MATRIX.md` for complete feature descriptions
   - Each screenshot is cross-referenced in the feature matrix

3. **Implementation Guide:**
   - Follow the phase priorities in FEATURE_MATRIX.md
   - Use the UI specifications for exact color/spacing values
   - Refer to component breakdown for interaction patterns

---

## Contact & Support

For questions about this documentation or the StarNet Core implementation:
- **Project:** StarNet Core Cashier App
- **Documentation Date:** 2026-07-04
- **Status:** Complete, ready for implementation

---

## File Inventory

```
ainurpos-live/
├── README.md (this file)
├── FEATURE_MATRIX.md (complete documentation)
├── 01-login-page.webp
├── 02-account-blocked-dialog.webp
├── 03-cash-register-history.webp
├── 04-main-pos-screen.webp
├── 05-cart-with-product.webp
├── 06-cart-multi-items.webp
├── 07-menu-opened.webp
├── 08-receipt-journal.webp
├── 09-customer-search.webp
├── 10-item-edit-discount.webp
├── 11-payment-screen.webp
├── 12-payment-card-method.webp
├── 13-actions-menu-hold-sale.webp
├── 14-settings-page.webp
├── 15-settings-printer.webp
├── 16-settings-complete.webp
└── 17-equipment-settings.webp

Total: 19 files (17 screenshots + 2 documentation files)
```

---

**Documentation Complete** ✅
