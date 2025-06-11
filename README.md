# WashWise - Laundry Management App
WashWise is a desktop application for laundry management, built with Electron, React, and SQLite. It provides a seamless way to manage customers, products, and orders while working completely offline, ensuring reliability and fast operations.

## Tech Stack
- Electron (Desktop App) 
- React (Frontend)
- SQLite (Local Database)

## Features

- Customer management (add, edit, delete)
- Laundry item management
- Create and edit service orders
- ESC/POS receipt printing
- Local data storage with SQLite
- 100% offline functionality


## Screenshots

### New Order Screen (empty state)

Initial screen to create a new order, search for customers and items, add products and define the ready-for-pickup day.

![New order empty](washwise-app/public/general.png)

### New Order Screen (with items added)

Displays customer and item selection, quantity, optional notes per item, and pick-up day selection. The "Save and Print" button generates and prints the receipt automatically.

![Order filled](washwise-app/public/filled.png)

## How to run

1. Clone the repository:
```bash
git clone https://github.com/RodG23/WashWise.git
```

2. Install dependencies:
```bash
cd washwise-app
npm install
```

3. Run Frontend:
```bash
npm run dev
```

4. Run desktop app:
```bash
npm run electron
```
<br/>

---

WashWise is designed to simplify and streamline laundry business operations.

![Status](https://img.shields.io/badge/status-in%20development-yellow)

