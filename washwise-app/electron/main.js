import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

//todo adicionar aos recibos data de criacao e usar essa data para meter no talao, nao fazer ua nova
//todo no print and save chama o save e depois chama o print no react tambem, faz o recibo la
//todo refresh dos render ao guardar talao

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), // Comunicação segura
      contextIsolation: true,
      nodeIntegration: true,
    },
  });
  mainWindow.webContents.openDevTools();
  mainWindow.loadURL("http://localhost:5173"); // Vite usa a porta 5173 por padrão

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

async function saveReceipt(receipt) {
  try {
    const stmt = db.prepare(`
      INSERT INTO receipts (client_id, products_list, state, total_price, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      receipt.client_id,
      JSON.stringify(receipt.products),
      receipt.state,
      receipt.total_price,
      receipt.date
    );
    return { success: true, receipt_id: info.lastInsertRowid, client_id: receipt.client_id };
  } catch (error) {
    console.error("Erro ao guardar o talão:", error);
    return { success: false, error: error.message };
  }
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
    await printer.printImage("logo_.png");
    printer.newLine();
    printer.newLine();

    // Cabeçalho - Logo e informações
    printer.alignLeft();
    printer.bold(true);
    printer.leftRight("Lavandaria 3 Marias", `ID: ${receipt.receipt_id}`);
    printer.bold(false);
    // Mantém negrito para morada e telefone
    printer.println("Av. 25 de Abril, 241");

    // ID na segunda linha, alinhado à direita
    printer.leftRight("4830-512 Póvoa de Lanhoso", new Date().toLocaleDateString('pt-PT'));

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
      let description = peca.ref.description;
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

    // Informações de levantamento
    printer.alignLeft();
    printer.bold(true);
    printer.print("Levantamento: ");
    printer.bold(false);
    printer.println(receipt.date);
    printer.newLine();
    
    // Removed extra newlines to minimize gap before cutting
    
    // Use partialCut instead of cut if available (creates a cleaner edge)
    // If your printer supports it, this will cut closer to the text
    printer.cut(); // Fall back to regular cut if partialCut not supported

      
    console.log(printer.getText());
  
    try {
      await printer.execute();
      console.log('Print success.');
    } catch (error) {
      console.error('Print error:', error);
    }

  return { success: true };
  } catch (error) {
    console.error("Erro ao guardar e imprimir o talão:", error);
    return { success: false, error: error.message };
  }
}

ipcMain.handle("get-clientes", () => {
    return db.prepare("SELECT * FROM clients").all();
  });

ipcMain.handle("get-refs", () => {
  return db.prepare("SELECT * FROM products").all();
});

ipcMain.handle("save-receipt", async (event, receipt) => {
  return saveReceipt(receipt);
});

ipcMain.handle("save-print-receipt", async (event, receipt) => {
  const saveResult = await saveReceipt(receipt);
  if (!saveResult.success) return saveResult;
  return printReceipt({...receipt, receipt_id: saveResult.receipt_id});
});
  
ipcMain.handle("add-cliente", (event, cliente) => {
const stmt = db.prepare("INSERT INTO clients (nome, numero, morada) VALUES (?, ?, ?)");
stmt.run(cliente.nome, cliente.numero, cliente.morada);
return { success: true };
});