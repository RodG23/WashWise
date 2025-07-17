import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import db from "./database.js";
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';

//todo verificar funcoes que estao a ser passadas para o front mas nao usadas

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
    const now = new Date();
    const createdAt = now.toLocaleString("sv-SE").replace("T", " ");
    const stmt = db.prepare(`
      INSERT INTO receipts (client_id, products_list, state, total_price, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      receipt.client_id,
      JSON.stringify(receipt.products),
      receipt.state,
      receipt.total_price,
      receipt.date,
      createdAt
    );
    //console.log(receipt.products);

    return { success: true, receipt_id: info.lastInsertRowid, client_id: receipt.client_id };
  } catch (error) {
    console.error("Erro ao guardar o talão: ", error);
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
    printer.leftRight("Lavandaria 3 Marias", `Nº: ${receipt.receipt_id}`);
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
    printer.println(receipt.date);
    printer.newLine();
  
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
    console.error("Erro ao guardar e imprimir o talão:", error);
    return { success: false, error: error.message };
  }
}


//operações de clientes
ipcMain.handle("get-clientes", () => {
    return db.prepare("SELECT * FROM clients").all();
  });

ipcMain.handle("get-clientes-search", () => {
  return db.prepare("SELECT id, name, address FROM clients").all();
});

ipcMain.handle("get-clientes-search-name", (event, searchTerm) => {
  const query = "SELECT id, name, number, address FROM clients WHERE name LIKE ?";
  return db.prepare(query).all(`%${searchTerm}%`);
});

ipcMain.handle("get-clientes-search-receipt", (event, searchTerm) => {
  
  const query = `
    SELECT 
      c.id,
      c.name,
      c.number,
      c.address
    FROM receipts r
    JOIN clients c ON r.client_id = c.id
    WHERE r.id = ?;
  `;
  
  return db.prepare(query).all(searchTerm);
});

ipcMain.handle("get-clientes-search-number", (event, searchTerm) => {

  const query = `
    SELECT 
      id, name, address, number
    FROM clients
    WHERE number LIKE ?;
  `;

  return db.prepare(query).all(`${searchTerm}%`);
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
  if (!cliente.name || !cliente.number || !cliente.address) {
    return { success: false, message: "Por favor, preencha todos os campos." };
  }

  try {
    const stmt = db.prepare("INSERT INTO clients (name, number, address) VALUES (?, ?, ?)");
    stmt.run(cliente.name, cliente.number, cliente.address);

    return { success: true, message: "Cliente criado com sucesso!" };
  } catch (error) {
    console.error("Erro ao adicionar cliente:", error);
    return { success: false, message: "Erro ao criar cliente." };
  }
});

ipcMain.handle("remove-client", async (event, clientId) => {
  try {
    // nao elimina se tiver taloes
    const checkClientInReceipts = db.prepare("SELECT COUNT(*) AS count FROM receipts WHERE client_id = ?").get(clientId);
    
    if (checkClientInReceipts.count > 0) {
      return { success: false, message: "Cliente possui talões associados." };
    }

    // Remove o cliente da tabela de clientes
    const removeClientQuery = db.prepare("DELETE FROM clients WHERE id = ?");
    const result = removeClientQuery.run(clientId);

    // Verifica se a exclusão foi bem-sucedida
    if (result.changes > 0) {
      return { success: true, message: "Cliente excluído com sucesso!" };
    } else {
      return { success: false, message: "Cliente não encontrado." };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("edit-client", async (event, client) => {
  if (!client.name || !client.number || !client.address) {
    return { success: false, message: "Por favor, preencha todos os campos." };
  }

  const { id, name, number, address } = client;

  try {
    const query = `
      UPDATE clients
      SET name = ?, number = ?, address = ?
      WHERE id = ?
    `;
    const result =db.prepare(query).run(name, number, address, id); // Passando os dados para o UPDATE
    
    if (result.changes > 0) {
      return { success: true, message: "Cliente atualizado com sucesso!" };
    } else {
      return { success: false, message: "Cliente não encontrado." };
    }
  } catch (error) {
    console.error("Erro ao editar cliente:", error);
    return { success: false, message: "Ocorreu um erro inesperado." };
  }
});

ipcMain.handle("get-last-receipt", () => {
  try {
    const item = db.prepare("SELECT * FROM receipts ORDER BY id DESC limit 1").get();
    return {success: true, item: item};
  } catch (error) {
    console.error("Erro ao obter último item:", error);
    return {success: false, message: "Erro ao obter último talão" };
  }
});


//operações de peças
ipcMain.handle("get-produtos-ref", (event, searchTerm) => {
  const query = `
    SELECT 
      ref,
      type,
      color,
      style,
      description,
      price
    FROM products
    WHERE ref LIKE ?;
  `;

  return db.prepare(query).all(`${searchTerm}%`);
});

ipcMain.handle("get-produtos-description", (event, searchTerm) => {
  const searchTermStr = String(searchTerm).toLowerCase(); // pesquisa case-insensitive
  
  const query = `
    SELECT 
      ref, 
      type, 
      color, 
      style, 
      description, 
      price
    FROM products
    WHERE LOWER(description) LIKE ?;
  `;
  
  const result = db.prepare(query).all(`%${searchTermStr}%`);
  return result;
});

ipcMain.handle("remove-ref", async (event, productRef) => {
  try {
    // Remove a peça da tabela de produtos
    const removeProductQuery = db.prepare("DELETE FROM products WHERE ref = ?");
    const result = removeProductQuery.run(productRef);

    // Verifica se a exclusão foi bem-sucedida
    if (result.changes > 0) {
      return { success: true, message: "Peça excluída com sucesso!" };
    } else {
      return { success: false, message: "Peça não encontrada." };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle("add-ref", (event, product) => {
  // Verifica se todos os campos necessários foram preenchidos
  if (!product.prodRef || !product.type || !product.color || !product.description || !product.price) {
    return { success: false, message: "Por favor, preencha todos os campos." };
  }

  const floatPrice = Number(product.price);
  if (isNaN(floatPrice)) {
    return { success: false, message: "O valor fornecido não é válido." };
  }

  try {
    // Verifica se já existe uma peça com a mesma referência
    const checkExistingRef = db.prepare("SELECT COUNT(*) AS count FROM products WHERE ref = ?").get(product.prodRef);

    if (checkExistingRef.count > 0) {
      return { success: false, message: "Já existe uma peça com esta referência." };
    }

    // Prepara a instrução SQL para inserir a peça
    const stmt = db.prepare("INSERT INTO products (ref, type, color, style, description, price) VALUES (?, ?, ?, ?, ?, ?)");
    stmt.run(product.prodRef, product.type, product.color, product.style || "", product.description, floatPrice);

    return { success: true, message: "Peça criada com sucesso!" };
  } catch (error) {
    console.error("Erro ao adicionar peça:", error);
    return { success: false, message: "Erro ao criar peça." };
  }
});

ipcMain.handle("edit-ref", (event, product) => {
  const { prodRef, type, color, style, description, price, oldProdRef } = product;

  // Verifica se todos os campos necessários foram preenchidos
  if (!product.prodRef || !product.type || !product.color || !product.description || !product.price) {
    return { success: false, message: "Por favor, preencha todos os campos." };
  }

  // Converte o preço para número real
  const floatPrice = parseFloat(price);
  if (isNaN(floatPrice)) {
    return { success: false, message: "O preço fornecido não é válido." };
  }

  try {
    // Se a ref foi alterada, verificamos se a nova ref já existe na base de dados
    if (product.prodRef !== product.oldProdRef) {
      const refCheck = db.prepare("SELECT COUNT(*) AS count FROM products WHERE ref = ?").get(prodRef);
      if (refCheck.count > 0) {
        return { success: false, message: "Já existe uma peça com a nova referência." };
      }
    }

    // Prepara a instrução SQL para atualizar os dados da peça
    const stmt = db.prepare(`
      UPDATE products
      SET ref = ?, type = ?, color = ?, style = ?, description = ?, price = ?
      WHERE ref = ?
    `);

    // Executa a atualização na base de dados
    const result = stmt.run(prodRef, type, color, style || "", description, floatPrice, oldProdRef);

    // Verifica se a atualização foi bem-sucedida
    if (result.changes > 0) {
      return { success: true, message: "Peça editada com sucesso!" };
    } else {
      return { success: false, message: "Peça não encontrada." };
    }
  } catch (error) {
    console.error("Erro ao editar peça:", error);
    return { success: false, message: "Erro ao editar peça." };
  }
});


//operacoes taloes
ipcMain.handle("get-receipt-by-id", (event, receiptId) => {
  try {
    const query = `
      SELECT * FROM receipts
      WHERE id = ?
    `;
    const receipt = db.prepare(query).get(receiptId);

    if (receipt) {
      return { success: true, receipt };
    } else {
      return { success: false, message: "Talão não existe." };
    }
  } catch (error) {
    console.error("Erro ao procurar talão pelo ID:", error);
    return { success: false, message: "Erro ao procurar talão pelo ID." };
  }
});

ipcMain.handle("get-receipts-by-client", (event, clientId) => {
  try {
    const query = `
      SELECT r.*
      FROM receipts r
      WHERE r.client_id = ?
    `;
    const receipts = db.prepare(query).all(clientId);

    if (receipts.length > 0) {
      return { success: true, receipts };
    } else {
      return { success: false, message: "Nenhum talão encontrado para este cliente." };
    }
  } catch (error) {
    console.error("Erro ao procurar talões pelo ID do cliente:", error);
    return { success: false, message: "Erro ao procurar talões pelo ID do cliente." };
  }
});

ipcMain.handle("get-receipts-by-date", (event, startDate, endDate) => {
  try {
    const formattedStartDate = startDate + " 00:00:00"; // Data de início com hora inicial
    const formattedEndDate = endDate + " 23:59:59";   // Data de fim com hora final

    const query = `
      SELECT * FROM receipts
      WHERE created_at BETWEEN ? AND ?
    `;
    const receipts = db.prepare(query).all(formattedStartDate, formattedEndDate);

    if (receipts.length > 0) {
      return { success: true, receipts };
    } else {
      return { success: false, message: "Nenhum talão encontrado neste intervalo." };
    }
  } catch (error) {
    console.error("Erro ao procurar talões por intervalo de datas:", error);
    return { success: false, message: "Erro ao procurar talões por intervalo de datas." };
  }
});




