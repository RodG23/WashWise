import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

//todo adicionar aos recibos data de criacao
//todo no print and save chama o save e depois chama o print no react tambem, faz o recibo la

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

ipcMain.handle("get-clientes", () => {
    return db.prepare("SELECT * FROM clients").all();
  });

ipcMain.handle("get-refs", () => {
  return db.prepare("SELECT * FROM products").all();
});

ipcMain.handle("save-receipt", async (event, receipt) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO receipts (client_id, products_list, state, total_price, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      receipt.client_id,
      JSON.stringify(receipt.products), // Guardamos como string JSON
      receipt.state,
      receipt.total_price,
      receipt.date
    );
    return { success: true };
  } catch (error) {
    console.error("Erro ao guardar o talão:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("save-print-receipt", async (event, receipt) => {
  try {
    const stmt = db.prepare(`
      INSERT INTO receipts (client_id, products_list, state, total_price, date)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      receipt.client_id,
      JSON.stringify(receipt.products), // Guardamos como string JSON
      receipt.state,
      receipt.total_price,
      receipt.date
    );

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
    
      // Cabeçalho - Logo e informações
      printer.alignLeft();
      printer.bold(true);
      printer.setTextDoubleHeight(); // Aumenta tamanho da letra para Lavandaria 3 Marias
      printer.println("Lavandaria 3 Marias");
      printer.setTextNormal(); // Retorna ao tamanho normal
      // Mantém negrito para morada e telefone
      printer.println("Av. 25 de Abril, 241");

      // ID na segunda linha, alinhado à direita
      printer.leftRight("4830-512 Póvoa de Lanhoso", "ID: 1");

      // Data na linha do telefone, alinhado à direita
      printer.leftRight("Tlf: 253 634 051", new Date().toLocaleDateString('pt-PT'));
      printer.bold(false);
      printer.newLine();

      // Informações do Cliente
      printer.alignLeft();
      printer.bold(true);
      printer.print("Cliente: ");
      printer.bold(false);
      printer.println("Ricardo Pereira");
      printer.newLine();
      printer.newLine();

      // Cabeçalho da tabela com linhas em todas as bordas
      printer.bold(true);
      printer.tableCustom([
        { text: "Quantidade", align: "LEFT", width: 0.4, bold: true },
        { text: "Peça", align: "LEFT", width: 0.6, bold: true }
      ]);
      printer.bold(false);
      printer.drawLine(); // Linha superior da tabela

      // Conteúdo da tabela - produtos
      receipt.products.forEach(peca => {
        printer.tableCustom([
          { text: peca.quantity.toString(), align: "LEFT", width: 0.4 },
          { text: peca.ref.description, align: "LEFT", width: 0.6 }
        ]);
        printer.drawLine(); // Linha após cada produto
      });

      printer.newLine();

      // Informações de levantamento
      printer.alignLeft();
      printer.bold(true);
      printer.print("Levantamento: ");
      printer.bold(false);
      printer.println(receipt.date);
      printer.newLine();

      // Rodapé
      printer.alignCenter();
      printer.println("Powered by WashWise");

      // Corte do papel após a impressão
      printer.cut();
      printer.openCashDrawer();
    
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
});
  
ipcMain.handle("add-cliente", (event, cliente) => {
const stmt = db.prepare("INSERT INTO clients (nome, numero, morada) VALUES (?, ?, ?)");
stmt.run(cliente.nome, cliente.numero, cliente.morada);
return { success: true };
});