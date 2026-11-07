import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
//import db from "./database.js";
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import { screen } from "electron";
import fs from 'fs';
import fsp from "fs/promises";
//import Database from "better-sqlite3";
import { http, getApiState, onApiStateChange } from './http.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "washwise.db");
const isDev = !app.isPackaged;
//DevTools + janela redimensionavel so em dev e so com WW_DEVTOOLS=1 (para testar resolucoes)
const devTools = isDev && !!process.env.WW_DEVTOOLS;
let mainWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.size;

  // Splash window
  const splash = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    autoHideMenuBar: true,
    show: true,
    icon: path.join(app.getAppPath(), '../renderer', 'ww_logo_t.png'),
  });

  // Caminho absoluto da imagem
  let logoBase64;
  if (!isDev) {
    logoBase64 = fs.readFileSync(path.join(app.getAppPath(), '../renderer', 'ww_logo_s.png')).toString('base64');
  } else {
    logoBase64 = ""; 
  }


  // HTML inline do splash
  const splashHTML = `
    <html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh;overflow:hidden;">
      <img src="data:image/png;base64,${logoBase64}" style="width:400px;height:400px;object-fit:contain" />
    </body></html>
  `

  splash.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHTML))

  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    show: false,
    resizable: devTools,
    minimizable: true,
    maximizable: devTools,
    autoHideMenuBar: true,
    icon: path.join(app.getAppPath(), '../renderer', 'ww_logo_t.png'),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  // Carrega o frontend Vite (ou ficheiro estático em produção)
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '../renderer', 'index.html'));
  }

  //mainWindow.webContents.openDevTools();
  if (devTools) mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Quando estiver pronto, mostra e fecha o splash
  mainWindow.webContents.on("did-finish-load", () => {
    // Garante que a splash fica pelo menos 1 segundo visível
    setTimeout(() => {
      splash.destroy();
      mainWindow.show();
    }, 1000);
  });


  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  // Segunda instância: fecha-se logo
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(createWindow);

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
//sqlite
// async function backupDatabase() {
//   try {
//     const table_date = new Date().toLocaleDateString('pt-PT').replaceAll("/","-");
//     const sourceDb = new Database(dbPath, { readonly: true });
//     //const desktopPath = app.getPath('desktop');
//     const backupPath = path.join("F:\\", `backup-${table_date}.db`);
    
//     await sourceDb.backup(backupPath); // espera o backup terminar
//     sourceDb.close();

//     return { success: true, path: backupPath };
//   } catch (err) {
//     console.error('Erro durante o backup:', err);
//     return { success: false, message: err.message };
//   }
// }

// async function add_column() {
//   try {
//     const sourceDb = new Database(dbPath);
//     console.log(dbPath);
//     const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

//     const products = sourceDb.prepare("SELECT ref, description FROM products").all();
//     const updateStmt = sourceDb.prepare("UPDATE products SET description_normalized = ? WHERE ref = ?");

//     products.forEach(p => updateStmt.run(normalize(p.description), p.ref));
//     return { success: true, path: backupPath };
//   } catch (err) {
//     console.error('Erro durante o backup:', err);
//     return { success: false, message: err.message };
//   }
// }

//sqlite
// async function saveReceipt(receipt) {
//   try {
//     const now = new Date();
//     const createdAt = now.toLocaleString("sv-SE").replace("T", " ");
//     const stmt = db.prepare(`
//       INSERT INTO receipts (client_id, products_list, state, total_price, date, created_at)
//       VALUES (?, ?, ?, ?, ?, ?)
//     `);
//     const info = stmt.run(
//       receipt.client_id,
//       JSON.stringify(receipt.products),
//       receipt.state,
//       Math.trunc(receipt.total_price*100)/100,
//       receipt.date,
//       createdAt
//     );
//     //console.log(receipt.products);

//     return { success: true, receipt_id: info.lastInsertRowid, client_id: receipt.client_id };
//   } catch (error) {
//     console.error("Erro ao guardar o talão: ", error);
//     return { success: false, error: error.message };
//   }
// }
// Dia de levantamento (texto) -> data real de entrega (AAAA-MM-DD).
// Regra: a proxima ocorrencia do dia, SEMPRE no futuro. Um talao feito numa
// quinta com "5ª" e para a quinta seguinte, nao para o proprio dia.
// Devolve null para tudo o que nao seja um dia da semana ("15 Dias", "Outro",
// datas escritas a mao) — um talao sem data de entrega e valido.
const WEEKDAYS = { '2ª': 1, '3ª': 2, '4ª': 3, '5ª': 4, '6ª': 5, 'Sab': 6, 'Sº': 6 };

function deliveryDateFor(dateText, base = new Date()) {
  if (!dateText) return null;
  // corta o modificador: "5ª (Sem falta)" -> "5ª"
  const dia = String(dateText).split('(')[0].trim();
  const alvo = WEEKDAYS[dia];
  if (alvo === undefined) return null;

  // 1..7 dias a frente; delta 0 (mesmo dia) vira 7 pela regra acima
  const delta = ((alvo - base.getDay() + 6) % 7) + 1;

  // meia-noite local + setDate(): somar dias assim e imune as mudancas de hora
  // de marco e outubro, ao contrario de somar milissegundos
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  d.setDate(d.getDate() + delta);

  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mm + '-' + dd;
}

// Copia do textoLevantamento do src/utils/datas.js — o renderer e o main
// correm em processos diferentes e nao partilham modulos. Mexer nos dois.
const MESES_TALAO = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const DIAS_TALAO = ['Dom', '2ª', '3ª', '4ª', '5ª', '6ª', 'Sab'];

// "5ª" + 2026-05-15 -> "5ª (15 Mai)"; com modificador -> "5ª (15 Mai) - Sem falta".
// O dia da semana vem sempre da data real, para o dia e a data nunca se
// contradizerem; do texto gravado so se aproveita o modificador. Sem data real
// (taloes antigos) fica o texto tal como foi gravado.
function textoLevantamento(dateText, deliveryDate) {
  const texto = dateText || '';
  if (!deliveryDate) return texto;

  // serve "2026-05-15" (calculada ca) e "2026-05-15T00:00:00.000Z" (da API)
  const iso = String(deliveryDate).slice(0, 10);
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return texto;

  // data construida em hora local: com new Date(texto) o dia da semana podia
  // escorregar por causa do fuso
  const dia = DIAS_TALAO[new Date(y, m - 1, d).getDay()];
  const data = Number(d) + ' ' + MESES_TALAO[m - 1];

  const partes = texto.split('(');
  const modificador = partes.length > 1 ? partes[1].replace(')', '').trim() : '';

  return dia + ' (' + data + ')' + (modificador ? ' - ' + modificador : '');
}

async function saveReceipt(receipt) {
  const payload = {
    client_id: receipt.client_id,
    products: receipt.products,
    state: receipt.state,
    total_price: receipt.total_price,
    date: receipt.date,
    // Do calendario vem ja pronta; do dia da semana e calculada aqui, no unico
    // ponto por onde passam Guardar e Guardar+Imprimir, e em hora local do posto
    // — nao no Postgres, que pode nao estar em Lisboa
    delivery_date: receipt.delivery_date || deliveryDateFor(receipt.date)
  };
  const r = await http.post('/receipts', payload);
  if (!r.success) return { success:false, message:r.message };
  // a data vai de volta porque e aqui que ela e decidida nos dias da semana, e
  // o talao impresso tem de mostrar a que ficou gravada — nao uma recalculada
  return { success:true, receipt_id:r.data.receipt_id, client_id:r.data.client_id, year:r.data.year, number:r.data.number, delivery_date:payload.delivery_date };
}

async function printReceipt(receipt) {
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // 'star' or 'epson'
      interface: String.raw`\\.\COM3`,
      options: {
        timeout: 1000,
      },
      width: 48, // Number of characters in one line - default: 48
      characterSet: CharacterSet.SLOVENIA, // Character set - default: SLOVENIA
      breakLine: BreakLine.WORD, // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
      removeSpecialCharacters: false, // Removes special characters - default: false
      lineCharacter: '-', // Use custom character for drawing lines - default: -
    });
  
    const isConnected = await printer.isPrinterConnected();
    console.log('Printer connected:', isConnected);
  
    printer.alignCenter();
    await printer.printImage(path.join(app.getAppPath(), '../renderer', 'logo_.png'));
    printer.newLine();
    printer.newLine();

    // Cabeçalho - Logo e informações
    printer.alignLeft();
    //printer.bold(true);
    printer.setTypeFontB();
    printer.setTextSize(1,1);

    const textLeft = "Lavandaria 3 Marias";
    const textRight = `Nº: ${receipt.receipt_id}`;    
    const spacesCount = 32 - textLeft.length - textRight.length;
    const spaces = spacesCount > 0 ? ' '.repeat(spacesCount) : '';
    
    // Linha final
    const line = textLeft + spaces + textRight;
    printer.println(line);
    printer.setTypeFontA();
    printer.setTextNormal();
    //printer.bold(false);
    // Mantém negrito para morada e telefone
    printer.println("Av. 25 de Abril, 241");

    // ID na segunda linha, alinhado à direita
    printer.leftRight("4830-512 Póvoa de Lanhoso", receipt.table_date);

    // Data na linha do telefone, alinhado à direita
    printer.println("Tlf: 253 634 051");
    
    printer.newLine();
    printer.newLine();

    // Informações do Cliente
    printer.alignLeft();
    printer.bold(true);
    printer.print("Cliente: ");
    printer.bold(false);
    printer.println(receipt.client_name);
    printer.newLine();
    
    const col1Width = 15; // Width for quantity column
    const col2Width = 33; // Width for product description column

    // Top border (not bold)
    printer.println('┌' + ''.padEnd(col1Width - 2, '─') + '┬' + ''.padEnd(col2Width - 2, '─') + '┐');

    // Header row with bold text only
    printer.print('│ ');
    printer.bold(true);
    printer.print('Quantidade'.padEnd(col1Width - 3, ' '));
    printer.bold(false);
    printer.print('│ ');
    
    printer.bold(true);
    printer.print('Peça'.padEnd(col2Width - 3, ' '));
    printer.bold(false);
    printer.print('│');
    printer.println('');

    // Header separator (not bold)
    printer.println('├' + ''.padEnd(col1Width - 2, '─') + '┼' + ''.padEnd(col2Width - 2, '─') + '┤');

    // Content rows
    receipt.products.forEach(peca => {
      printer.print('│ ' + peca.quantity.toString().padEnd(col1Width - 3, ' ') + '│ ');
      
      // Handle product descriptions that might be too long
      let description = peca.description;
      if (description.length > col2Width - 4) {
        description = description.substring(0, col2Width - 7) + '...';
      }
      
      printer.print(description.padEnd(col2Width - 3, ' ') + '│');
      printer.println('');
      
      // Row separator (except after the last item)
      if (receipt.products.indexOf(peca) < receipt.products.length - 1) {
        printer.println('├' + ''.padEnd(col1Width - 2, '─') + '┼' + ''.padEnd(col2Width - 2, '─') + '┤');
      }
    });

    // Bottom border
    printer.println('└' + ''.padEnd(col1Width - 2, '─') + '┴' + ''.padEnd(col2Width - 2, '─') + '┘');

    printer.newLine();

    //Notas
    // Notas (caso existam)
    const notasComTexto = receipt.products
    .map((peca) => ({ description: peca.description, note: peca.note?.trim() }))
    .filter((peca) => peca.note && peca.note.length > 0);

    if (notasComTexto.length > 0) {
    printer.alignLeft();
    printer.bold(true);
    printer.println("Obs:");
    printer.bold(false);

    notasComTexto.forEach((peca) => {
      // Se a nota for muito longa, corta e adiciona "..."
      let nota = peca.note;

      printer.println(`- ${peca.description}: ${nota}`);
    });

    printer.newLine();
    }


    // Informações de levantamento
    printer.alignLeft();
    printer.bold(true);
    printer.print("Levantamento: ");
    printer.bold(false);
    printer.println(textoLevantamento(receipt.date, receipt.delivery_date));
    printer.newLine();
    printer.newLine();

    printer.alignCenter();
    printer.underline(true);
    printer.println("Os artigos devem ser levantados no prazo máximo de 3 meses. Decorrido este período, não assumimos qualquer responsabilidade pela sua guarda.");
    printer.underline(false);
    printer.alignLeft();
  
    printer.cut();

    console.log(printer.getText());
  
    try {
      await printer.execute();
      console.log('Print success.');
    } catch (error) {
      console.error('Print error:', error);
    }

  return { success: true };
  } catch (error) {
    console.error("Erro ao imprimir o talão:", error);
    return { success: false, error: error.message };
  }
}

// Clientes "Sem Talao": a etiqueta sai com o nome em grande e o numero pequeno
// ao canto, em vez do numero em grande. O nome e propriedade do cliente, nao do
// talao — mudar o tipo vale tambem para reimpressoes de taloes antigos.
//
// Larguras reais do papel (ESC/POS GS ! n, 48 caracteres a 1x):
//   setTextSize(2,2) = 3x -> 16 caracteres por linha
//   setTextSize(1,1) = 2x -> 24 caracteres por linha
// A mediana dos nomes e 14, mas um quarto passa dos 16; por isso acima desse
// limite desce-se um degrau em vez de partir o nome em quatro linhas. A palavra
// mais comprida da base tem 15 letras, logo o BreakLine.WORD nunca corta uma
// palavra ao meio.
const NOME_LARGURA_3X = 16;

async function printNumber(id, name, state, noReceipt = false) {
  try {
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // 'star' or 'epson'
      interface: String.raw`\\.\COM3`,
      options: {
        timeout: 1000,
      },
      width: 48, // Number of characters in one line - default: 48
      characterSet: CharacterSet.SLOVENIA, // Character set - default: SLOVENIA
      breakLine: BreakLine.WORD, // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
      removeSpecialCharacters: false, // Removes special characters - default: false
      lineCharacter: '-', // Use custom character for drawing lines - default: -
    });
  
    const isConnected = await printer.isPrinterConnected();
    console.log('Printer connected:', isConnected);

    printer.println();
    printer.println();

    // O texto e o mesmo nos dois formatos; so muda o que vai em grande
    const texto = state === "Pago" ? `${name} - Pago` : name;

    if (noReceipt) {
      // Sem Talao: numero pequeno encostado a direita, nome em grande ao centro
      printer.alignRight();
      printer.setTextSize(1,1);
      printer.println(String(id));
      printer.setTextNormal();
      printer.newLine();

      printer.alignCenter();
      // desce de 3x para 2x quando o nome nao cabe numa linha, em vez de o
      // partir em varias linhas de letra grande
      const escala = texto.length > NOME_LARGURA_3X ? 1 : 2;
      printer.setTextSize(escala, escala);
      printer.bold(true);
      printer.println(texto.toUpperCase());
      printer.bold(false);
      printer.setTextNormal();
    } else {
      // Formato de sempre: numero em grande, nome pequeno por baixo
      printer.alignCenter();
      printer.setTextSize(7,7);
      printer.println(id);
      printer.newLine();
      printer.setTextSize(1,1);
      printer.println(texto);
    }
    printer.cut();

    try {
      await printer.execute();
      console.log('Print success.');
    } catch (error) {
      console.error('Print error:', error);
    }

  return { success: true };
  } catch (error) {
    console.error("Erro ao imprimir o talão:", error);
    return { success: false, error: error.message };
  }
} 

//impressão livre: número opcional no topo à direita + texto em grande
//copies: nº de vias; o ciclo fica aqui para todas irem num só execute()
async function printCustom(number, text, copies = 1) {
  try {
    const total = Math.min(100, Math.max(1, parseInt(copies, 10) || 1));
    const printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: String.raw`\\.\COM3`,
      options: {
        timeout: 1000,
      },
      width: 48,
      characterSet: CharacterSet.SLOVENIA,
      breakLine: BreakLine.WORD,
      removeSpecialCharacters: false,
      lineCharacter: '-',
    });

    const isConnected = await printer.isPrinterConnected();
    console.log('Printer connected:', isConnected);

    for (let i = 0; i < total; i++) {
      printer.println();

      if (number) {
        printer.alignRight();
        printer.setTextSize(1,1);
        printer.println(String(number));
        printer.setTextNormal();
      }

      printer.newLine();

      printer.alignCenter();
      printer.setTextSize(2,2);
      printer.bold(true);
      String(text).toUpperCase().split('\n').forEach((line) => printer.println(line));
      printer.bold(false);
      printer.setTextNormal();
      printer.alignLeft();

      printer.cut(); //cada via sai separada
    }

    try {
      await printer.execute();
      console.log('Print success.');
    } catch (error) {
      console.error('Print error:', error);
    }

    return { success: true };
  } catch (error) {
    console.error("Erro na impressão livre:", error);
    return { success: false, error: error.message };
  }
}

ipcMain.handle("print-custom", async (event, number, text, copies) => {
  return printCustom(number, text, copies);
});

//devolve o estado atual
ipcMain.handle('api-state', () => ({ state: getApiState() }));

//subscreve mudanças de estado do Availability e broadcast para todas as janelas via canal 'api-state'.
onApiStateChange((s) => {
    BrowserWindow.getAllWindows().forEach(w => w.webContents.send('api-state', s));
});

//operações de clientes
//sqlite
// ipcMain.handle("get-clientes-search-name", (event, searchTerm) => {
//   try {
//     const query = "SELECT id, name, number, address FROM clients WHERE name LIKE ?";
//     const result = db.prepare(query).all(`%${searchTerm}%`);

//     if (result.length === 0) {
//       return { success: false, message: "Nenhum cliente encontrado." };
//     }

//     return { success: true, data: result };
//   } catch (error) {
//     return { success: false, message: "Erro interno ao procurar clientes." };
//   }
// });
ipcMain.handle("get-clientes-search-name", async (_e, term) => {
  const r = await http.get(`/clients/search?name=${encodeURIComponent(term)}`); //encode adiciona %20 pe
  if (!r.success) return { success:false, message:r.message };
  return { success:true, data:r.data };
});


//sqlite
// ipcMain.handle("get-clientes-search-receipt", (event, searchTerm) => {
//   try {
//     const query = `
//       SELECT 
//         c.id,
//         c.name,
//         c.number,
//         c.address
//       FROM receipts r
//       JOIN clients c ON r.client_id = c.id
//       WHERE r.id = ?;
//     `;

//     const result = db.prepare(query).all(searchTerm);

//     if (result.length === 0) {
//       return { success: false, message: "Talão não existe." };
//     }

//     return { success: true, data: result };
//   } catch (error) {
//     return { success: false, message: "Erro interno ao procurar cliente pelo talão." };
//   }
// });
ipcMain.handle('get-clientes-search-receipt', async (_e, id, year) => {
  const yearParam = year ? `&year=${encodeURIComponent(year)}` : '';
  const r = await http.get(`/clients/search?receipt_id=${encodeURIComponent(id)}${yearParam}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, data:r.data };
});

//sqlite
// ipcMain.handle("get-clientes-search-number", (event, searchTerm) => {
//   try {
//     const query = `
//       SELECT 
//         id, name, address, number
//       FROM clients
//       WHERE number LIKE ?;
//     `;

//     const result = db.prepare(query).all(`${searchTerm}%`);

//     if (result.length === 0) {
//       return { success: false, message: "Nenhum cliente encontrado com esse número." };
//     }

//     return { success: true, data: result };
//   } catch (error) {
//     return { success: false, message: "Erro interno ao procurar clientes por número." };
//   }
// });
ipcMain.handle('get-clientes-search-number', async (_e, term) => {
  const r = await http.get(`/clients/search?number_prefix=${encodeURIComponent(term)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, data:r.data };
});



//operações de taloes
//sqlite
// ipcMain.handle("backup-db", async () => {
//   return await backupDatabase();
// });
ipcMain.handle("backup-db", async () => {
  try {
    const r = await http.post("/admin/backup");
    if (!r.success) return { success: false, message: r.message };

    const backupPath = r.data.path;
    const destDir = "F:\\washwise\\backups";
    const userDataBackups = path.join(userDataPath, "backups");
    const fileName = path.basename(backupPath); // extrai só o nome
    const localBackupPath = path.join(userDataBackups, fileName);

    try {
      // Garante que a pasta na pen existe
      await fsp.mkdir(destDir, { recursive: true });

      const destPath = path.join(destDir, fileName);

      // Copia o ficheiro para a pen
      await fsp.copyFile(localBackupPath, destPath);

      console.log(`Backup copiado para: ${destPath}`);
    } catch (copyErr) {
      console.error("Falha ao copiar backup para a pen:", copyErr);
      return { success: false, message: "Backup realizado, mas impossível guardar em destino pretendido!" }
    }

    return { success: true, path: r.data.path };
  } catch (err) {
    console.error("Erro ao fazer backup:", err);
    return { success: false, message: "Falha ao contactar o servidor para backup." };
  }
});

ipcMain.handle("save-receipt", async (event, receipt) => {
  return saveReceipt(receipt);
});

ipcMain.handle("save-print-receipt", async (event, receipt) => {
  const saveResult = await saveReceipt(receipt);
  const table_date = new Date().toLocaleDateString('pt-PT');
  if (!saveResult.success) return saveResult;
  //no talão impresso sai o número de negócio (numeração anual), não o id interno.
  //a delivery_date vem do saveReceipt: no ecrã só vem preenchida quando o dia
  //foi escolhido no calendário
  return printReceipt({...receipt, receipt_id: saveResult.number, table_date: table_date, delivery_date: saveResult.delivery_date});
});

ipcMain.handle("print-receipt", async (event, receipt) => {
  const products = typeof receipt.products_list === "string"
    ? JSON.parse(receipt.products_list)
    : receipt.products_list;
  return printReceipt({...receipt, receipt_id: receipt.number, client_name: receipt.name, products});
});

ipcMain.handle("print-number", async (event, id, name, state, noReceipt) => {
  return printNumber(id, name, state, noReceipt);
});
  
//sqlite
// ipcMain.handle("add-cliente", async (event, cliente) => {
//   if (!cliente.name || !cliente.number || !cliente.address) {
//     return { success: false, message: "Por favor, preencha todos os campos." };
//   }

//   try {
//     const stmt = db.prepare("INSERT INTO clients (name, number, address) VALUES (?, ?, ?)");
//     stmt.run(cliente.name, cliente.number, cliente.address);

//     return { success: true, message: "Cliente criado com sucesso!" };
//   } catch (error) {
//     console.error("Erro ao adicionar cliente:", error);

//     if (error.message.includes("Número de telefone já existe")) {
//       return { success: false, message: "Número de telefone já existe!" };
//     }

//     return { success: false, message: "Erro ao criar cliente." };
//   }
// });
ipcMain.handle('add-cliente', async (_e, cliente) => {
  const r = await http.post('/clients', cliente);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Cliente criado com sucesso!' };
});

//sqlite
// ipcMain.handle("remove-client", async (event, clientId) => {
//   try {
//     // nao elimina se tiver taloes
//     const checkClientInReceipts = db.prepare("SELECT COUNT(*) AS count FROM receipts WHERE client_id = ?").get(clientId);
    
//     if (checkClientInReceipts.count > 0) {
//       return { success: false, message: "Cliente possui talões associados." };
//     }

//     // Remove o cliente da tabela de clientes
//     const removeClientQuery = db.prepare("DELETE FROM clients WHERE id = ?");
//     const result = removeClientQuery.run(clientId);

//     // Verifica se a exclusão foi bem-sucedida
//     if (result.changes > 0) {
//       return { success: true, message: "Cliente excluído com sucesso!" };
//     } else {
//       return { success: false, message: "Cliente não encontrado." };
//     }
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// });
ipcMain.handle('remove-client', async (_e, id) => {
  const r = await http.del(`/clients/${id}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Cliente excluído com sucesso!' };
});

//sqlite
// ipcMain.handle("edit-client", async (event, client) => {
//   if (!client.name || !client.number || !client.address) {
//     return { success: false, message: "Por favor, preencha todos os campos." };
//   }

//   const { id, name, number, address } = client;

//   try {
//     const query = `
//       UPDATE clients
//       SET name = ?, number = ?, address = ?
//       WHERE id = ?
//     `;
//     const result =db.prepare(query).run(name, number, address, id); // Passando os dados para o UPDATE
    
//     if (result.changes > 0) {
//       return { success: true, message: "Cliente atualizado com sucesso!" };
//     } else {
//       return { success: false, message: "Cliente não encontrado." };
//     }
//   } catch (error) {
//     console.error("Erro ao editar cliente:", error);

//     if (error.message.includes("Número de telefone já existe")) {
//       return { success: false, message: "Número de telefone já existe!" };
//     }

//     return { success: false, message: "Ocorreu um erro inesperado." };
//   }
// });
ipcMain.handle('edit-client', async (_e, client) => {
  const r = await http.put(`/clients/${client.id}`, client);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Cliente atualizado com sucesso!' };
});

//sqlite
// ipcMain.handle("get-next-receipt-id", () => {
//   try {
//     const row = db.prepare(`
//       SELECT COALESCE(seq, 0) + 1 AS next_id
//       FROM sqlite_sequence
//       WHERE name = 'receipts'
//     `).get();

//     return { success: true, nextId: row.next_id };
//   } catch (error) {
//     console.error("Erro ao obter próximo id:", error);
//     return { success: false, message: "Erro ao obter próximo número do talão" };
//   }
// });
ipcMain.handle('get-next-receipt-id', async () => {
  const r = await http.get('/receipts/next-id');
  if (!r.success) return { success:false, message:r.message };
  return { success:true, nextId:r.data.nextId };
});

//operações de peças
//sqlite
// ipcMain.handle("get-refs", () => {
//   try {
//     const rows = db.prepare("SELECT * FROM products").all();
//     return {
//       success: true,
//       data: rows
//     };
//   } catch (error) {
//     console.error("Erro ao procurar referências:", error);
//     return {
//       success: false,
//       message: error.message
//     };
//   }
// });
ipcMain.handle('get-refs', async () => {
  const r = await http.get('/products');
  if (!r.success) return { success:false, message:r.message };
  return { success:true, data:r.data };
});

//sqlite
// ipcMain.handle("get-produtos-ref", (event, searchTerm) => {
//   try {
//     const query = `
//       SELECT 
//         ref,
//         type,
//         color,
//         style,
//         description,
//         price
//       FROM products
//       WHERE ref LIKE ?;
//     `;

//     const result = db.prepare(query).all(`${searchTerm}%`);

//     if (result.length === 0) {
//       return { success: false, message: "Nenhuma peça encontrada com essa referência." };
//     }

//     return { success: true, data: result };
//   } catch (error) {
//     return { success: false, message: "Erro interno ao procurar produtos por referência." };
//   }
// });
ipcMain.handle('get-produtos-ref', async (_e, term) => {
  const r = await http.get(`/products?ref=${encodeURIComponent(term)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, data:r.data };
});

//sql
// ipcMain.handle("get-produtos-description", (event, searchTerm) => {
//   try {
//     console.log(searchTerm);
//     const searchTermStr = String(searchTerm).normalize("NFD")
//       .replace(/[\u0300-\u036f]/g, "").replace(/[-_]/g, " ").toLowerCase(); // pesquisa case-insensitive

//     console.log(searchTermStr);

//     const tokens = searchTermStr
//       .split(/\s+/)
//       .filter(t => t.length > 0)
//       .map(t => t + "*")
//       .join(" AND ");

//       console.log(tokens);

//     const query = `
//       SELECT 
//         p.ref, 
//         p.type, 
//         p.color, 
//         p.style, 
//         p.description, 
//         p.price
//       FROM products p
//       JOIN products_fts fts ON p.rowid = fts.rowid
//       WHERE fts.description_normalized MATCH '${tokens}';
//     `;

//     const result = db.prepare(query).all();

//     if (result.length === 0) {
//       return { success: false, message: "Nenhuma peça encontrado com esse nome." };
//     }

//     return { success: true, data: result };
//   } catch (error) {
//     return { success: false, message: "Erro interno ao procurar produtos por nome." };
//   }
// });
ipcMain.handle('get-produtos-description', async (_e, term) => {
  const r = await http.get(`/products?q=${encodeURIComponent(term)}`);
  if (!r.success) return { success:false, message:r.message || 'Nenhuma peça encontrada com esse nome.' };
  return { success:true, data:r.data };
});

//sqlite
// ipcMain.handle("remove-ref", async (event, productRef) => {
//   try {
//     // Remove a peça da tabela de produtos
//     const removeProductQuery = db.prepare("DELETE FROM products WHERE ref = ?");
//     const result = removeProductQuery.run(productRef);

//     // Verifica se a exclusão foi bem-sucedida
//     if (result.changes > 0) {
//       return { success: true, message: "Peça excluída com sucesso!" };
//     } else {
//       return { success: false, message: "Peça não encontrada." };
//     }
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// });
ipcMain.handle('remove-ref', async (_e, ref) => {
  const r = await http.del(`/products/${encodeURIComponent(ref)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Peça excluída com sucesso!' };
});

//sqlite
// ipcMain.handle("add-ref", (event, product) => {
//   // Verifica se todos os campos necessários foram preenchidos
//   if (!product.prodRef || !product.type || !product.color || !product.description || !product.price) {
//     return { success: false, message: "Por favor, preencha todos os campos." };
//   }

//   const floatPrice = Number(product.price);
//   if (isNaN(floatPrice) || floatPrice <= 0) {
//     return { success: false, message: "O valor fornecido não é válido." };
//   }

//   try {
//     // Verifica se já existe uma peça com a mesma referência
//     const checkExistingRef = db.prepare("SELECT COUNT(*) AS count FROM products WHERE ref = ?").get(product.prodRef);

//     if (checkExistingRef.count > 0) {
//       return { success: false, message: "Já existe uma peça com esta referência." };
//     }

//     const normalizedDescription = product.description
//       .normalize("NFD")
//       .replace(/[\u0300-\u036f]/g, "").toLowerCase(); // remove acentos

//     // Prepara a instrução SQL para inserir a peça
//     const stmt = db.prepare("INSERT INTO products (ref, type, color, style, description, price, description_normalized) VALUES (?, ?, ?, ?, ?, ?, ?)");
//     stmt.run(product.prodRef, product.type, product.color, product.style || "", product.description, floatPrice, normalizedDescription);

//     return { success: true, message: "Peça criada com sucesso!" };
//   } catch (error) {
//     console.error("Erro ao adicionar peça:", error);
//     return { success: false, message: "Erro ao criar peça." };
//   }
// });
ipcMain.handle('add-ref', async (_e, product) => {
  const floatPrice = Number(product.price);
  if (isNaN(floatPrice) || floatPrice <= 0) {
    return { success: false, message: "O valor fornecido não é válido." };
  }

  const normalizedDescription = product.description
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase(); // remove acentos

  const payload = {
    ref: product.prodRef,
    type: product.type,
    color: product.color,
    style: product.style ?? '',
    description: product.description,
    description_normalized:normalizedDescription,
    price: product.price
  };
  const r = await http.post('/products', payload);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Peça criada com sucesso!' };
});

//sqlite
// ipcMain.handle("edit-ref", (event, product) => {
//   const { prodRef, type, color, style, description, price, oldProdRef } = product;

//   // Verifica se todos os campos necessários foram preenchidos
//   if (!product.prodRef || !product.type || !product.color || !product.description || !product.price) {
//     return { success: false, message: "Por favor, preencha todos os campos." };
//   }

//   // Converte o preço para número real
//   const floatPrice = Number(product.price);
//   if (isNaN(floatPrice) || floatPrice <= 0) {
//     return { success: false, message: "O preço fornecido não é válido." };
//   }

//   try {
//     // Se a ref foi alterada, verificamos se a nova ref já existe na base de dados
//     if (product.prodRef !== product.oldProdRef) {
//       const refCheck = db.prepare("SELECT COUNT(*) AS count FROM products WHERE ref = ?").get(prodRef);
//       if (refCheck.count > 0) {
//         return { success: false, message: "Já existe uma peça com a nova referência." };
//       }
//     }
    
//     const normalizedDescription = product.description
//       .normalize("NFD")
//       .replace(/[\u0300-\u036f]/g, "").toLowerCase(); // remove acentos

//     // Prepara a instrução SQL para atualizar os dados da peça
//     const stmt = db.prepare(`
//       UPDATE products
//       SET ref = ?, type = ?, color = ?, style = ?, description = ?, price = ?, description_normalized = ?
//       WHERE ref = ?
//     `);

//     // Executa a atualização na base de dados
//     const result = stmt.run(prodRef, type, color, style || "", description, floatPrice, normalizedDescription, oldProdRef);

//     // Verifica se a atualização foi bem-sucedida
//     if (result.changes > 0) {
//       return { success: true, message: "Peça editada com sucesso!" };
//     } else {
//       return { success: false, message: "Peça não encontrada." };
//     }
//   } catch (error) {
//     console.error("Erro ao editar peça:", error);
//     return { success: false, message: "Erro ao editar peça." };
//   }
// });
ipcMain.handle('edit-ref', async (_e, product) => {
  const floatPrice = Number(product.price);
  if (isNaN(floatPrice) || floatPrice <= 0) {
    return { success: false, message: "O valor fornecido não é válido." };
  }

  const normalizedDescription = product.description
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const payload = {
    ref: product.prodRef,
    type: product.type,
    color: product.color,
    style: product.style ?? '',
    description: product.description,
    description_normalized:normalizedDescription,
    price: product.price,
    ...(product.version ? { version: product.version } : {})
  };
  const r = await http.put(`/products/${encodeURIComponent(product.oldProdRef)}`, payload);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Peça editada com sucesso!' };
});

//operacoes taloes
//sqlite
// ipcMain.handle("get-receipt-by-id", (event, receiptId) => {
//   try {
//     const query = `
//       SELECT r.*, c.name
//       FROM receipts r
//       INNER JOIN clients c ON r.client_id = c.id
//       WHERE r.id = ?
//     `;
//     const receipt = db.prepare(query).get(receiptId);

//     if (receipt) {
//       return { success: true, receipt };
//     } else {
//       return { success: false, message: "Talão não existe." };
//     }
//   } catch (error) {
//     console.error("Erro ao procurar talão pelo ID:", error);
//     return { success: false, message: "Erro ao procurar talão pelo ID." };
//   }
// });
ipcMain.handle('get-receipt-by-id', async (_e, id) => {
  const r = await http.get(`/receipts/${id}`);
  console.log(r);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipt:r.data.receipt };
});

//talões pela data real de entrega (um dia só)
ipcMain.handle('get-receipts-by-delivery-date', async (_e, date) => {
  const r = await http.get(`/receipts/by-delivery-date?date=${encodeURIComponent(date)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipts:r.data.receipts };
});

//anos com talões registados
ipcMain.handle('get-receipt-years', async () => {
  const r = await http.get('/receipts/years');
  if (!r.success) return { success:false, message:r.message };
  return { success:true, years:r.data.years };
});

//pesquisa pelo número de negócio (numeração anual)
ipcMain.handle('get-receipt-by-year-number', async (_e, number, year) => {
  const r = await http.get(`/receipts/by-year-number?number=${encodeURIComponent(number)}&year=${encodeURIComponent(year)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipt:r.data.receipt };
});

//sqlite
// ipcMain.handle("get-receipts-by-client", (event, clientId) => {
//   try {
//     const query = `
//       SELECT r.*, c.name
//       FROM receipts r
//       INNER JOIN clients c ON r.client_id = c.id
//       WHERE r.client_id = ?
//     `;
//     const receipts = db.prepare(query).all(clientId);

//     if (receipts.length > 0) {
//       return { success: true, receipts };
//     } else {
//       return { success: false, message: "Nenhum talão encontrado para este cliente." };
//     }
//   } catch (error) {
//     console.error("Erro ao procurar talões pelo ID do cliente:", error);
//     return { success: false, message: "Erro ao procurar talões pelo ID do cliente." };
//   }
// });
ipcMain.handle('get-receipts-by-client', async (_e, clientId) => {
  const r = await http.get(`/clients/${clientId}/receipts`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipts:r.data.receipts };
});

//sqlite
// ipcMain.handle("get-receipts-by-number", (event, clientNumber) => {
//   try {
//     const query = `
//       SELECT r.*, c.name, c.number AS client_number
//       FROM receipts r
//       INNER JOIN clients c ON r.client_id = c.id
//       WHERE c.number = ?
//     `;
//     const receipts = db.prepare(query).all(clientNumber);

//     if (receipts.length > 0) {
//       return { success: true, receipts };
//     } else {
//       return { success: false, message: "Nenhum talão encontrado para este número." };
//     }
//   } catch (error) {
//     console.error("Erro ao procurar talões pelo número do cliente:", error);
//     return { success: false, message: "Erro ao procurar talões pelo número do cliente." };
//   }
// });
ipcMain.handle('get-receipts-by-number', async (_e, number) => {
  const r = await http.get(`/receipts/by-number?number=${encodeURIComponent(number)}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipts:r.data.receipts };
});

//sqlite
// ipcMain.handle("get-receipts-by-date", (event, startDate, endDate) => {
//   try {
//     if(startDate > endDate) {
//       return { success: false, message: "Intervalo de datas inválido." };
//     }

//     const formattedStartDate = startDate + " 00:00:00"; // Data de início com hora inicial
//     const formattedEndDate = endDate + " 23:59:59";   // Data de fim com hora final

//     const query = `
//       SELECT r.*, c.name 
//       FROM receipts r
//       INNER JOIN clients c ON r.client_id = c.id
//       WHERE created_at BETWEEN ? AND ?
//     `;
//     const receipts = db.prepare(query).all(formattedStartDate, formattedEndDate);

//     if (receipts.length > 0) {
//       return { success: true, receipts };
//     } else {
//       return { success: false, message: "Nenhum talão encontrado neste intervalo." };
//     }
//   } catch (error) {
//     console.error("Erro ao procurar talões por intervalo de datas:", error);
//     return { success: false, message: "Erro ao procurar talões por intervalo de datas." };
//   }
// });
ipcMain.handle('get-receipts-by-date', async (_e, startDate, endDate) => {
  const r = await http.get(`/receipts/by-date?startDate=${startDate}&endDate=${endDate}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, receipts:r.data };
});

//sqlite
// ipcMain.handle("edit-receipt", (event, updatedFields) => {

//   // Verifica se todos os campos necessários foram preenchidos
//   if ((!updatedFields.total_price && updatedFields.total_price !== 0) || !updatedFields.products_list || !updatedFields.state || !updatedFields.id) {
//     return { success: false, message: "Por favor, preencha todos os campos." };
//   }    
  
//   try {

//     const stmt = db.prepare(`
//       UPDATE receipts
//       SET total_price = ?, products_list = ?, state = ?
//       WHERE id = ?
//     `);

//     const result = stmt.run(updatedFields.total_price, updatedFields.products_list, updatedFields.state, updatedFields.id);

//     // Verifica se a atualização foi bem-sucedida
//     if (result.changes > 0) {
//       return { success: true, message: "Talão editado com sucesso!" };
//     } else {
//       return { success: false, message: "Erro ao editar talão." };
//     }
//   } catch (error) {
//     console.error("Erro ao editar talão:", error);
//     return { success: false, message: "Erro ao editar talão." };
//   }
// });
// edit-receipt
ipcMain.handle('edit-receipt', async (_e, fields) => {
  const payload = {
    total_price: fields.total_price,
    products_list: fields.products_list, // já é JSON no app antigo
    state: fields.state,
    version: fields.version
  };
  const r = await http.put(`/receipts/${fields.id}`, payload);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Talão editado com sucesso!' };
});

//sql
// ipcMain.handle("remove-receipt", async (event, receiptId) => {
//   try {
//     const query = db.prepare("DELETE FROM receipts WHERE id = ?");
//     const result = query.run(receiptId);

//     // Verifica se a exclusão foi bem-sucedida
//     if (result.changes > 0) {
//       return { success: true, message: "Talão excluído com sucesso!" };
//     } else {
//       return { success: false, message: "Talão não encontrado." };
//     }
//   } catch (error) {
//     return { success: false, message: error.message };
//   }
// });
ipcMain.handle('set-receipt-marked', async (_e, id, marked) => {
  const r = await http.patch(`/receipts/${id}/marked`, { marked: !!marked });
  if (!r.success) return { success:false, message:r.message };
  return { success:true, marked: r.data?.marked };
});

ipcMain.handle('remove-receipt', async (_e, id) => {
  const r = await http.del(`/receipts/${id}`);
  if (!r.success) return { success:false, message:r.message };
  return { success:true, message:'Talão excluído com sucesso!' };
});


