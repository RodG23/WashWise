import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para a base de dados no diretório do Electron
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "washwise.db");
const db = new Database(dbPath);

// Criar tabelas se não existirem
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    address TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    ref TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    style TEXT,
    description TEXT NOT NULL,
    price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    products_list TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('Pendente', 'Pago', 'Entregue')),
    total_price REAL NOT NULL,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );

  CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
  CREATE INDEX IF NOT EXISTS idx_clients_number ON clients(number);
  CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
  CREATE INDEX IF NOT EXISTS idx_products_description ON products(description);
`);

console.log("Base de dados carregada!");

// Exportar para ser usado pelo Electron
export default db;
