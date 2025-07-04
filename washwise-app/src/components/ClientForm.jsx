import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente de Formulário para Criação ou Edição de Cliente
const ClientForm = ({ selectedClientEdit, isEditing, handleNewClient, updateFilteredClients, activeTab }) => {
  const [name, setName] = useState(selectedClientEdit?.name || "");
  const [id, setId] = useState(selectedClientEdit?.id || "");
  const [number, setNumber] = useState(selectedClientEdit?.number || "");
  const [address, setAddress] = useState(selectedClientEdit?.address || "");
  const [isNewClientActive, setIsNewClientActive] = useState(true); // Para controlar o estado dos botões

  useEffect(() => {
    if (activeTab !== "Clientes") {
      handleNewClient();
    }
  }, [activeTab]);

  // Quando o cliente selecionado mudar, atualiza os campos do formulário
  useEffect(() => {
    if (selectedClientEdit) {
      setId(selectedClientEdit.id);
      setName(selectedClientEdit.name);
      setNumber(selectedClientEdit.number);
      setAddress(selectedClientEdit.address);
      setIsNewClientActive(false); // Desabilitar "Novo Cliente" quando estiver a editar
    } else {
      // Limpar os campos se não houver cliente selecionado (modo de criação)
      setId("");
      setName("");
      setNumber("");
      setAddress("");
      setIsNewClientActive(true); // Ativar "Novo Cliente" quando não estiver a editar
    }
  }, [selectedClientEdit]);

  const handleSave = () => {
    const clientData = { id, name, number, address };
    if (isEditing) {
      window.api.editClient(clientData)
        .then(response => {
          if (response.success) {
            toast.success(response.message ,{
              toastId: "edit-client-success",
            });
            updateFilteredClients(prevClients => prevClients.map(client => client.id === id ? { ...client, name, number, address } : client));
            handleNewClient(); // Limpa os dados do cliente após a edição
          } else {
            toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
            handleNewClient(); // Limpa os dados do cliente após a edição
          }
        })
        .catch(error => {
          console.error("Erro ao editar cliente:", error);
        });
    } else {
      window.api.addCliente(clientData)
        .then(response => {
          if (response.success) {
            toast.success(response.message ,{
              toastId: "create-client-success",
            });
          } else {
            toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
          }
        })
        .catch(error => {
          console.error("Erro ao criar cliente:", error);
        });
    }
    // Limpar campos após salvar
    setId("");
    setName("");
    setNumber("");
    setAddress("");
    setIsNewClientActive(true); // Ativa o botão "Novo Cliente" novamente após salvar
  };

  const handleNewClientClick = () => {
    // Limpar os campos quando clicar em "Novo Cliente"
    handleNewClient(); // Limpa o cliente selecionado no App
    setId("");
    setName("");
    setNumber("");
    setAddress("");
    setIsNewClientActive(true); // Ativar "Novo Cliente"
  };

  return (
    <div className="w-[90%] rounded-2xl flex flex-col justify-center overflow-clip">
      <div className="grid grid-cols-2 text-center font-normal text-3xl rounded-t-2xl w-full">
        {/* Botões lado a lado */}
        <div className="rounded-t-2xl">
          <button
            onClick={handleNewClientClick}
            disabled={isNewClientActive} // Desabilita o botão "Novo Cliente" se estiver no modo de edição
            className={`p-5 w-full h-full rounded-2xl shadow-sm justify-center overflow-clip border-3 border-r-0 rounded-r-none border-[#928787] hover:bg-stone-400 bg-[#C1C0C0] ${isNewClientActive ? "bg-stone-400 rounded-t-2xl hover:none" : "bg-[#C1C0C0] rounded-t-2xl cursor-pointer"}`}
          >
            Novo Cliente
          </button>
        </div>
          <div className="rounded-t-2xl">
          <button
            disabled={!selectedClientEdit} // Desabilita o botão "Editar Cliente" se não houver um cliente selecionado
            className={`w-full h-full p-2 shadow-sm rounded-2xl justify-center overflow-clip border-3 border-l-0 rounded-l-none border-[#928787] bg-[#C1C0C0] ${selectedClientEdit ? "bg-stone-400" : "bg-[#C1C0C0] "}`}
          >
            Editar Cliente
          </button>
        </div>
      </div>

      <div className="space-y-10 w-[70%] mx-auto pt-4">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Nome:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Nome do cliente"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Número:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Número de telefone"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Endereço:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Endereço"
          />
        </div>

        <div className="flex justify-center mt-14">
          <button
            onClick={handleSave}
            className="p-5 pt-3 pb-3 text-center font-normal text-3xl shadow-sm rounded-2xl justify-center overflow-clip border-3  border-[#928787] bg-[#C1C0C0] hover:bg-stone-400 transition duration-200 active:scale-95"
          >
            {isEditing ? "Guardar Cliente" : "Criar Cliente"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientForm;
