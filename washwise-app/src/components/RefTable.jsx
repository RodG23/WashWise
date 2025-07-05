import React, { useState } from "react";
import { BiSolidEditAlt } from "react-icons/bi";
import { AiTwotoneDelete } from "react-icons/ai";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const RefTable = ({ filteredRefs, updateFilteredRefs, selectedRefId, onRefSelect }) => {
  const numberOfRefsToRender = 8;

  // Preenche com linhas vazias caso haja menos peças que o número desejado
  const refsWithEmptyRows = [
    ...filteredRefs,
    ...Array(Math.max(0, numberOfRefsToRender - filteredRefs.length)).fill(null),
  ];

  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false); // Controla se a exclusão foi confirmada
  const [refToDelete, setRefToDelete] = useState(null); // Armazena a peça que está marcada para exclusão
  const [timeoutID, setTimeoutID] = useState(null); // Armazena o ID do timeout para a exclusão

  const handleDeleteClick = (ref) => {
    if (refToDelete && refToDelete.ref === ref.ref && isDeleteConfirmed) {
      // Se a peça já estiver confirmada para exclusão, realiza a exclusão
      window.api.removeRef(ref.ref)  // Chamaz a função de remoção de peça no backend (main process)
        .then(response => {
          if (response.success) {
            toast.success(response.message,{
                    toastId: "delete-ref-success",
                  });
            updateFilteredRefs((prevRefs) => prevRefs.filter((item) => item.ref !== ref.ref));
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
          console.error("Erro ao remover peça:", error);
      });      
      setIsDeleteConfirmed(false); // Reseta o estado após a exclusão
      setRefToDelete(null); // Reseta a peça a ser excluída
    } else {
      // Primeiro clique para confirmar
      setIsDeleteConfirmed(true);
      setRefToDelete(ref);

      // Se já havia um timeout limpa
      if (timeoutID) clearTimeout(timeoutID);

      // Cria um novo timeout de 3s
      const id = setTimeout(() => {
        setIsDeleteConfirmed(false);
        setRefToDelete(null);
      }, 3000);

      setTimeoutID(id); // Armazena o ID do timeout
    }
  };

  return (
    <div className="overflow-auto rounded-2xl h-[90%] w-[85%] flex text-3xl scrollbar-hidden">
      <table className="w-full h-full">
        <thead>
          <tr className="bg-[#D9D9D9] sticky top-0 z-10">
            <th className="w-1/6 p-2 font-normal text-left border-r-4 border-b-4 border-[#B8B8B8] pt-5 pb-5 pl-5">
              Referência
            </th>
            <th className="w-3/6 p-2 font-normal text-left border-r-0 border-b-4 border-[#B8B8B8] pl-5">
              Descrição
            </th>
            <th className="w-1/6 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
            <th className="w-1/6 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
          </tr>
        </thead>
        <tbody>
          {refsWithEmptyRows.map((ref, index) => (
            <tr key={index}>
              <td className="p-2 pl-5 text-3xl text-left font-normal border-r-4 border-b-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%] cursor-default">
                {ref?.ref || ""}
              </td>
              <td className="p-2 pl-5 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8] cursor-default">
                {ref?.description || ""}
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-end">
                  {ref && (
                    <BiSolidEditAlt
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100 ${selectedRefId === ref.ref ? "text-blue-900 opacity-100" : "text-black"}`}
                      onClick={() => onRefSelect(ref)} // Chama a função de seleção
                    />
                  )}
                </div>
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {ref && (
                    <AiTwotoneDelete
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100
                        ${refToDelete && refToDelete.ref === ref.ref && isDeleteConfirmed ? "text-red-800 opacity-100" : "text-black"}`}
                      onClick={() => handleDeleteClick(ref)}
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

export default RefTable;
