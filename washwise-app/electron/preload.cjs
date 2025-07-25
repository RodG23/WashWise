const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    getClientes: () => ipcRenderer.invoke("get-clientes"),
    getClientesSearch: () => ipcRenderer.invoke("get-clientes-search"),
    addCliente: (cliente) => ipcRenderer.invoke("add-cliente", cliente),
    getRefs: () => ipcRenderer.invoke("get-refs"),
    saveReceipt: (receipt) => ipcRenderer.invoke("save-receipt", receipt),
    saveAndPrintReceipt: (receipt) => ipcRenderer.invoke("save-print-receipt", receipt),
    getClientesSearchName: (searchTerm) => ipcRenderer.invoke("get-clientes-search-name", searchTerm),
    getClientesSearchReceipt: (searchTerm) => ipcRenderer.invoke("get-clientes-search-receipt", searchTerm),
    getClientesSearchNumber: (searchTerm) => ipcRenderer.invoke("get-clientes-search-number", searchTerm),
    removeClient: (clientId) => ipcRenderer.invoke("remove-client", clientId),
    editClient: (client) => ipcRenderer.invoke("edit-client", client),
    getProdutosRef: (searchTerm) => ipcRenderer.invoke("get-produtos-ref", searchTerm),
    getProdutosDescription: (searchTerm) => ipcRenderer.invoke("get-produtos-description", searchTerm),
    removeRef: (productRef) => ipcRenderer.invoke("remove-ref", productRef),
    addRef: (product) => ipcRenderer.invoke("add-ref", product),
    editRef: (product) => ipcRenderer.invoke("edit-ref", product),
    getLastReceipt: () => ipcRenderer.invoke("get-last-receipt"),
    getReceiptById: (receiptId) => ipcRenderer.invoke("get-receipt-by-id", receiptId),
    getReceiptsByDate: (startDate, endDate) => ipcRenderer.invoke("get-receipts-by-date", startDate, endDate),
    getReceiptsByClient: (clientId) => ipcRenderer.invoke("get-receipts-by-client", clientId),
  });