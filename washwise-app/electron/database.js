import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para a base de dados no diretório do Electron
const dbPath = path.join(__dirname, "../washwise.db");
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
    client_id INTEGER,
    products_list TEXT NOT NULL,
    state TEXT NOT NULL,
    total_price REAL NOT NULL,
    date TEXT NOT NULL,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

console.log("Base de dados carregada!");

// Exportar para ser usado pelo Electron
export default db;
