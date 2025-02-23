const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("api", {
    getClientes: () => ipcRenderer.invoke("get-clientes"),
    addCliente: (cliente) => ipcRenderer.invoke("add-cliente", cliente),
    getRefs: () => ipcRenderer.invoke("get-refs"),
  });