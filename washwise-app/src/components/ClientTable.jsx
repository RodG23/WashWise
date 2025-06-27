import React, { useState } from "react";
import { TbUserEdit } from "react-icons/tb";
import { AiTwotoneDelete } from "react-icons/ai";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ClientTable = ({ filteredClients, updateFilteredClients, selectedClientId, onClientSelect }) => {
  const numberOfClientsToRender = 8;

  // Preenche com linhas vazias caso haja menos clientes que o número desejado
  const clientsWithEmptyRows = [
    ...filteredClients,
    ...Array(Math.max(0, numberOfClientsToRender - filteredClients.length)).fill(null),
  ];

  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false); // Controla se a exclusão foi confirmada
  const [clientToDelete, setClientToDelete] = useState(null); // Armazena o cliente que está marcado para exclusão
  const [timeoutID, setTimeoutID] = useState(null); // Armazena o ID do timeout para a exclusão

  const handleDeleteClick = (client) => {
    if (clientToDelete && clientToDelete.id === client.id && isDeleteConfirmed) {
      // Se o cliente já estiver confirmado para exclusão, realiza a exclusão
      window.api.removeClient(client.id)  // Chama a função de remoção de cliente no backend (main process)
        .then(response => {
          if (response.success) {
            toast.success(response.message,{
                    toastId: "delete-client-success",
                  });
            updateFilteredClients((prevClients) => prevClients.filter((item) => item.id !== client.id));
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
          console.error("Erro ao remover cliente:", error);
      });      
      setIsDeleteConfirmed(false); // Reseta o estado após a exclusão
      setClientToDelete(null); // Reseta o cliente a ser excluído
    } else {
      // Primeiro clique para confirmar
      setIsDeleteConfirmed(true);
      setClientToDelete(client);

      // Se já havia um timeout limpa
      if (timeoutID) clearTimeout(timeoutID);

      // Cria um novo timeout de 3s
      const id = setTimeout(() => {
        setIsDeleteConfirmed(false);
        setClientToDelete(null);
      }, 3000);

      setTimeoutID(id); // Armazena o ID do timeout
    }
  };

  return (
    <div className="overflow-auto rounded-2xl h-[90%] w-[85%] flex text-3xl scrollbar-hidden">
      <table className="w-full h-full">
        <thead>
          <tr className="bg-[#D9D9D9] sticky top-0 z-10">
            <th className="w-1/3 p-2 font-normal text-left border-r-4 border-b-4 border-[#B8B8B8] pt-5 pb-5 pl-5">
              Nome
            </th>
            <th className="w-1/3 p-2 font-normal text-left border-r-0 border-b-4 border-[#B8B8B8] pl-5">
              Endereço
            </th>
            <th className="w-1/6 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
            <th className="w-1/6 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
          </tr>
        </thead>
        <tbody>
          {clientsWithEmptyRows.map((client, index) => (
            <tr key={index}>
              <td className="p-2 pl-5 text-3xl text-left font-normal border-r-4 border-b-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%] cursor-default">
                {client?.name || ""}
              </td>
              <td className="p-2 pl-5 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8] cursor-default">
                {client?.address || ""}
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-end">
                  {client && (
                    <TbUserEdit
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100 ${selectedClientId === client.id ? "text-blue-900 opacity-100" : "text-black"}`}
                      onClick={() => onClientSelect(client)} // Chama a função de seleção
                    />
                  )}
                </div>
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {client && (
                    <AiTwotoneDelete
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100
                        ${clientToDelete && clientToDelete.id === client.id && isDeleteConfirmed ? "text-red-800 opacity-100" : "text-black"}`}
                      onClick={() => handleDeleteClick(client)}
                    />
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientTable;
