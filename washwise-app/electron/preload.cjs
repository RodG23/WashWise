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
  });