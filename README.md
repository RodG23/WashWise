# WashWise - Laundry Management App (Single PC)

WashWise is a desktop application for laundry and ironing shop management, built with Electron, React and SQLite. This is the **single-PC edition**: everything runs on one computer with a local database, no server and no network required.

> Looking for the multi-workstation edition (shared PostgreSQL server)? See the [`main`](https://github.com/RodG23/WashWise/tree/main) branch.

## Tech Stack
- Electron (Desktop App)
- React + Tailwind CSS (Frontend)
- SQLite via better-sqlite3 (Local Database, migrations run automatically on startup)
- ESC/POS thermal printing

## Features

- **Customers** - add, edit and search by name or phone number; customers can be flagged as *"no receipt"*, which prints a name label instead of the usual number ticket
- **Items** - catalogue of garments and services with reference, type, colour, style and price
- **Orders** - receipts numbered per year, with quantity, notes per item and paid/pending/collected states
- **Pick-up date** - choose a weekday (with modifiers such as *"without fail"*) or an exact date from a calendar, with a `+7` shortcut
- **Search and filters** - by receipt number, customer, phone, date range, year, state, marking and pick-up day
- **Order marking** - tick receipts to keep track of them while working through a list
- **Search inside an order** - find an item by description or note in large orders
- **Printing** - full receipt, number label and free-text printing with up to 100 copies
- **One-click database backup**
- 100% offline


## Screenshots

### New Order Tab (empty state)

Initial screen to create a new order, search for customers and items, add products and define the ready-for-pickup day.

![New order empty](washwise-app/public/general.png)

### New Order Tab (with items added)

Displays customer and item selection, quantity, optional notes per item, and pick-up day selection. The "Save and Print" button generates and prints the receipt automatically.

![Order filled](washwise-app/public/filled.png)

### Client Management Tab

Displays customer management with search and filter functionality. The table lists registered customers, while the side panel allows creating or editing customer records with name, phone number, and address details.

![Clients](washwise-app/public/clients.png)

![Clients_filled](washwise-app/public/clients_filled.png)

### Product Management Tab

Displays item management with search and filter functionality. The table lists existing items, while the side panel allows creating or editing entries with reference, type, color, style, and value.

![Products](washwise-app/public/products.png)

![Products_filled](washwise-app/public/products_filled.png)

## How to run (for development)

1. Clone the repository on the `SinglePC` branch:
```bash
git clone -b SinglePC https://github.com/RodG23/WashWise.git
```

2. Install dependencies and rebuild the SQLite driver for Electron:
```bash
cd washwise-app
npm install
npx electron-rebuild -f -w better-sqlite3
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

## How to install (for Windows)

Download the installer from the [Releases page](https://github.com/RodG23/WashWise/releases/tag/eng-v1.2.0) and run it. The database is created automatically on first launch.

 [![Download](https://img.shields.io/badge/download-installer%201.2.0-green)](https://github.com/RodG23/WashWise/releases/tag/eng-v1.2.0)


---

WashWise is designed to simplify and streamline laundry business operations.

![Status](https://img.shields.io/badge/status-In%20production-brightgreen)
