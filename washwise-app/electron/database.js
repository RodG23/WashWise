import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { app } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho para a base de dados no diretório do Electron
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "washwise.db");
//console.log(dbPath);
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
    description_normalized TEXT,
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

  CREATE VIRTUAL TABLE IF NOT EXISTS products_fts 
  USING fts5(description_normalized, content='products', content_rowid='rowid');


  CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
  CREATE INDEX IF NOT EXISTS idx_clients_number ON clients(number);
  CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
  CREATE INDEX IF NOT EXISTS idx_products_description ON products(description);

  CREATE TRIGGER IF NOT EXISTS unique_number_except_s
  BEFORE INSERT ON clients
  FOR EACH ROW
  WHEN NEW.number != 'S'
  BEGIN
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM clients WHERE number = NEW.number AND number != 'S')
        THEN RAISE(ABORT, 'Número de telefone já existe')
    END;
  END;

  CREATE TRIGGER IF NOT EXISTS unique_number_except_s_update
  BEFORE UPDATE OF number ON clients
  FOR EACH ROW
  WHEN NEW.number != 'S'
  BEGIN
    SELECT
      CASE
        WHEN EXISTS (SELECT 1 FROM clients WHERE number = NEW.number AND number != 'S' AND id != NEW.id)
        THEN RAISE(ABORT, 'Número de telefone já existe')
    END;
  END;

  CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, description_normalized)
    VALUES (new.rowid, new.description_normalized);
  END;

  CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, description_normalized)
    VALUES('delete', old.rowid, old.description_normalized);
  END;

  CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, description_normalized)
    VALUES('delete', old.rowid, old.description_normalized);
    INSERT INTO products_fts(rowid, description_normalized)
    VALUES (new.rowid, new.description_normalized);
  END;
`);

// ==========================================
// Migrações — correm no arranque, por ordem, e são seguras de repetir.
// Não há servidor nem consola de BD nesta máquina: é aqui que a BD do cliente
// é atualizada, na primeira vez que a app abre depois de uma atualização.
// ==========================================

//colunas atuais de uma tabela (o SQLite não tem ADD COLUMN IF NOT EXISTS)
function temColuna(tabela, coluna) {
  return db.prepare(`PRAGMA table_info(${tabela})`).all().some((c) => c.name === coluna);
}

// --- Numeração anual de talões + marcação ---
// O id continua a ser a chave interna (edições, remoções, FK) e nunca dá reset;
// o number é o número de negócio, que recomeça em 1 a cada ano novo.
const migrar = db.transaction(() => {
  if (!temColuna("receipts", "year")) {
    db.exec("ALTER TABLE receipts ADD COLUMN year INTEGER");
  }
  if (!temColuna("receipts", "number")) {
    db.exec("ALTER TABLE receipts ADD COLUMN number INTEGER");
  }
  if (!temColuna("receipts", "marked")) {
    db.exec("ALTER TABLE receipts ADD COLUMN marked INTEGER NOT NULL DEFAULT 0");
  }

  // Histórico: número de negócio = id antigo. É o número que os clientes têm
  // no papel, por isso os talões antigos continuam a ser encontrados.
  db.prepare(`
    UPDATE receipts
       SET year = CAST(strftime('%Y', created_at) AS INTEGER),
           number = id
     WHERE year IS NULL OR number IS NULL
  `).run();

  // Rede de segurança para created_at que o strftime não leia
  db.prepare(`
    UPDATE receipts
       SET year = CAST(substr(created_at, 1, 4) AS INTEGER)
     WHERE year IS NULL AND CAST(substr(created_at, 1, 4) AS INTEGER) > 1900
  `).run();

  const orfaos = db.prepare(
    "SELECT COUNT(*) AS n FROM receipts WHERE year IS NULL OR number IS NULL"
  ).get().n;
  if (orfaos > 0) {
    console.warn(`Atenção: ${orfaos} talão(ões) sem ano legível em created_at.`);
  }

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS receipts_year_number ON receipts (year, number)");

  // Contadores por ano: os números nunca são reutilizados, mesmo apagando talões
  db.exec(`
    CREATE TABLE IF NOT EXISTS year_counters (
      year        INTEGER PRIMARY KEY,
      last_number INTEGER NOT NULL
    )
  `);

  db.prepare(`
    INSERT INTO year_counters (year, last_number)
    SELECT year, MAX(number) FROM receipts WHERE year IS NOT NULL GROUP BY year
    ON CONFLICT(year) DO NOTHING
  `).run();
});

// --- Data real de entrega + clientes "Sem Talão" ---
// Equivalentes às migrações 004 e 005 da lavandaria. Lá são ficheiros .sql
// aplicados à mão no Postgres; aqui correm no arranque, que é a única forma de
// chegar à base de dados daquela máquina.
const migrarEntregaECliente = db.transaction(() => {
  // delivery_date é TEXT "AAAA-MM-DD": o SQLite não tem tipo DATE. O texto
  // livre da coluna `date` continua a ser o que se mostra e se imprime; esta
  // coluna serve só para filtrar por um dia de calendário.
  if (!temColuna("receipts", "delivery_date")) {
    db.exec("ALTER TABLE receipts ADD COLUMN delivery_date TEXT");
  }
  db.exec("CREATE INDEX IF NOT EXISTS receipts_delivery_date_idx ON receipts (delivery_date)");

  // Propriedade do CLIENTE, não do talão: muda o formato da etiqueta impressa,
  // inclusive em reimpressões de talões antigos. 0/1, que o SQLite não tem BOOLEAN.
  if (!temColuna("clients", "no_receipt")) {
    db.exec("ALTER TABLE clients ADD COLUMN no_receipt INTEGER NOT NULL DEFAULT 0");
  }

  // Preenchimento histórico, com os mesmos critérios da lavandaria (decidido a
  // 12-09-2026: não divergir). Só talões com um DIA DA SEMANA escrito, desde
  // 01-08-2026, e só os que estão por entregar. Todo o resto fica NULL de
  // propósito: uma data inventada é pior do que um vazio honesto.
  // Aqui a engomadoria escreve muito "15dias"/"10dias" e datas soltas, por isso
  // apanha poucos talões — enche-se com os novos.
  //
  // Regra do dia (a mesma do deliveryDateFor): a próxima ocorrência, SEMPRE no
  // futuro. delta = ((alvo - dia_da_semana + 6) % 7) + 1, entre 1 e 7.
  // Sem conversão de fuso, ao contrário do Postgres: o created_at já é gravado
  // em hora local ("AAAA-MM-DD HH:MM:SS", com espaço).
  // Só escreve onde delivery_date IS NULL, por isso é seguro repetir.
  const DIA_ALVO = `
    CASE
      WHEN trim("date") LIKE '2ª%'   THEN 1
      WHEN trim("date") LIKE '3ª%'   THEN 2
      WHEN trim("date") LIKE '4ª%'   THEN 3
      WHEN trim("date") LIKE '5ª%'   THEN 4
      WHEN trim("date") LIKE '6ª%'   THEN 5
      WHEN trim("date") LIKE 'sab%'  THEN 6
      WHEN trim("date") LIKE 'sº%'    THEN 6
    END`;

  db.prepare(`
    UPDATE receipts
       SET delivery_date = date(
             substr(created_at, 1, 10),
             '+' || (((${DIA_ALVO} - CAST(strftime('%w', created_at) AS INTEGER) + 6) % 7) + 1) || ' days'
           )
     WHERE delivery_date IS NULL
       AND state IN ('Pendente', 'Pago')
       AND substr(created_at, 1, 10) >= '2026-08-01'
       AND (${DIA_ALVO}) IS NOT NULL
  `).run();
});

// Por ordem: a numeração anual primeiro, a data de entrega e o Sem Talão
// depois — a mesma ordem dos ficheiros .sql da lavandaria (002/003, 004/005).
migrar();
migrarEntregaECliente();

console.log("Base de dados carregada!");

// Exportar para ser usado pelo Electron
export default db;
