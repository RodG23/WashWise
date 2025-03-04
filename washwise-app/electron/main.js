import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import puppeteer from 'puppeteer';
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
    const html = `
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              width: 80mm; /* Largura do papel */
              min-height: 100mm; /* Altura mínima */
              padding: 5mm;
            }
            .header {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
            }
            .header .left {
              width: 60%;
            }
            .header .right {
              text-align: right;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              font-size: 12px;
            }
            .table th, .table td {
              border-bottom: 1px dashed #000; /* Linha tracejada */
              padding: 4px;
              text-align: left;
            }
            .levantamento, .cliente {
              margin-top: 10px;
              font-size: 12px;
            }
            footer {
              text-align: center;
              margin-top: 10px;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="left">
              <p><strong>Lavandaria 3 Marias</strong></p>
              <p>Av. 25 de Abril, 241</p>
              <p>4830-512 Póvoa de Lanhoso</p>
              <p>Tlf: 253 634 051</p>
            </div>
            <div class="right">
              <p><strong>ID: 1</strong></p>
              <p>12-03-2025</p>
            </div>
          </div>
          <div class="cliente">
            <p><strong>Cliente:</strong> Ricardo Pereira</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Qtd</th>
                <th>Peça</th>
              </tr>
            </thead>
            <tbody>
              ${receipt.products.map(peca => `
                <tr>
                  <td>${peca.quantity}</td>
                  <td>${peca.ref.description}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="levantamento">
            <p><strong>Levantamento:</strong> ${receipt.date}</p>
          </div>
          <footer>
            <p>Powered by WashWise</p>
          </footer>
        </body>
      </html>
    `;

    // Gerar o PDF usando Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html); // Definir o conteúdo HTML gerado

    // Gerar e salvar o PDF
    const filePath = path.join(app.getPath('desktop'), 'talão-lavandaria.pdf');
    console.log(filePath);
    await page.pdf({ path: filePath, format: 'A6', printBackground: true }); // Tamanho 10x15 cm
    await browser.close();

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