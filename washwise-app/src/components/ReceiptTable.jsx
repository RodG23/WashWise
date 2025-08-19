import React, { useState } from "react";
import { MdReadMore } from "react-icons/md";
import { AiTwotoneDelete } from "react-icons/ai";
import { TiPrinter } from "react-icons/ti";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReceiptTable = ({ filteredReceipts, updateFilteredReceipts, selectedReceiptId, onReceiptSelect }) => {
  const numberOfReceiptsToRender = 8;

  // Preenche com linhas vazias caso haja menos talões que o número desejado
  const receiptsWithEmptyRows = [
    ...filteredReceipts,
    ...Array(Math.max(0, numberOfReceiptsToRender - filteredReceipts.length)).fill(null),
  ];

  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false); // Controla se a exclusão foi confirmada
  const [receiptToDelete, setReceiptToDelete] = useState(null); // Armazena o talão que está marcado para exclusão
  const [isPrintConfirmed, setIsPrintConfirmed] = useState(false); // Controla se a impressão foi confirmada
  const [receiptToPrint, setReceiptToPrint] = useState(null); // Armazena o talão que está marcado para impressão
  const [timeoutID, setTimeoutID] = useState(null); // Armazena o ID do timeout para a exclusão
  const [timeoutPrint, setTimeoutPrint] = useState(null); // Armazena o ID do timeout para a impressão

  const handleDeleteClick = (receipt) => {
    if (receiptToDelete && receiptToDelete.id === receipt.id && isDeleteConfirmed) {
      // Se o talão já estiver confirmado para exclusão, realiza a exclusão
      window.api.removeReceipt(receipt.id)  // Chama a função de remoção de talão no backend (main process)
        .then(response => {
          if (response.success) {
            toast.success(response.message,{
                    toastId: "delete-receipt-success",
                  });
            updateFilteredReceipts((prevReceipts) => prevReceipts.filter((item) => item.id !== receipt.id));
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
          console.error("Erro ao remover talão:", error);
      });      
      setIsDeleteConfirmed(false); // Reseta o estado após a exclusão
      setReceiptToDelete(null); // Reseta o talão a ser excluído
    } else {
      // Primeiro clique para confirmar
      setIsDeleteConfirmed(true);
      setReceiptToDelete(receipt);

      // Se já havia um timeout limpa
      if (timeoutID) clearTimeout(timeoutID);

      // Cria um novo timeout de 3s
      const id = setTimeout(() => {
        setIsDeleteConfirmed(false);
        setReceiptToDelete(null);
      }, 3000);

      setTimeoutID(id); // Armazena o ID do timeout
    }
  };

    const handlePrintClick = async (receipt) => {
    if (receiptToPrint && receiptToPrint.id === receipt.id && isPrintConfirmed) {
      // Se o talão já estiver confirmado para impressão, realiza a impressão
      const response = await window.api.printReceipt(receipt)  // Chama a função de impressão de talão no backend (main process)
      if (response.success) {
        toast.success("Talão impresso com sucesso.",{
                toastId: "print-receipt-again-success",
              });
      } else {
        toast.warn(response.message, {
                position: "top-right",
                autoClose: 3000,
                className: "custom-warn-toast",
                progressClassName: "custom-warn-progress",
              });
      }    
      setIsPrintConfirmed(false); // Reseta o estado após a impressão
      setReceiptToPrint(null); // Reseta o talão a ser impresso
    } else {
      // Primeiro clique para confirmar
      setIsPrintConfirmed(true);
      setReceiptToPrint(receipt);

      // Se já havia um timeout limpa
      if (timeoutPrint) clearTimeout(timeoutPrint);

      // Cria um novo timeout de 3s
      const id = setTimeout(() => {
        setIsPrintConfirmed(false);
        setReceiptToPrint(null);
      }, 3000);

      setTimeoutPrint(id); // Armazena o ID do timeout
    }
  };

  return (
    <div className="overflow-auto rounded-2xl h-[90%] w-[85%] flex text-3xl scrollbar-hidden">
      <table className="w-full h-full">
        <thead>
          <tr className="bg-[#D9D9D9] sticky top-0 z-10">
            <th className="w-3/24 p-2 font-normal text-left border-r-4 border-b-4 border-[#B8B8B8] pt-5 pb-5 pl-5">
              Nº
            </th>
            <th className="w-1/6 p-2 font-normal text-center border-r-2 border-b-4 border-[#B8B8B8]">
              Cliente
            </th>
            <th className="w-1/6 p-2 font-normal text-center border-r-2 border-b-4 border-[#B8B8B8]">
              Estado
            </th>
            <th className="w-2/24 p-2 font-normal text-center border-r-2 border-b-4 border-[#B8B8B8]">
              Valor
            </th>
            <th className="w-4/24 p-2 font-normal text-center border-r-0 border-b-4 border-[#B8B8B8]">
              Data
            </th>
            <th className="w-2/24 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
            <th className="w-2/24 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
            <th className="w-2/24 p-2 text-center border-b-4 border-[#B8B8B8]">
            </th>
          </tr>
        </thead>
        <tbody>
          {receiptsWithEmptyRows.map((receipt, index) => (
            <tr key={index}>
              <td className="p-2 pl-5 text-3xl text-left font-normal border-r-4 border-b-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%] cursor-default">
                {receipt?.id || ""}
              </td>
              <td className="p-2 text-center text-2xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8] cursor-default">
                {receipt?.name || ""}
              </td>
              <td className="p-2 text-center text-2xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8] cursor-default">
                {receipt?.state || ""}
              </td>
              <td className="p-2 text-center text-2xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8] cursor-default">
                {receipt ? `${receipt.total_price}€` : ""}
              </td>
              <td className="p-2 text-center text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8] cursor-default">
                {receipt?.table_date || ""}
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {receipt && (
                    <TiPrinter
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100
                        ${receiptToPrint && receiptToPrint.id === receipt.id && isPrintConfirmed ? "text-green-800 opacity-100" : "text-black"}`}
                      onClick={() => handlePrintClick(receipt)}
                    />
                  )}
                </div>
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {receipt && (
                    <MdReadMore
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100 ${selectedReceiptId === receipt.id ? "text-blue-900 opacity-100" : "text-black"}`}
                      onClick={() => onReceiptSelect(receipt)} // Chama a função de seleção
                    />
                  )}
                </div>
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {receipt && (
                    <AiTwotoneDelete
                      className={`size-10 opacity-55 cursor-pointer hover:opacity-100
                        ${receiptToDelete && receiptToDelete.id === receipt.id && isDeleteConfirmed ? "text-red-800 opacity-100" : "text-black"}`}
                      onClick={() => handleDeleteClick(receipt)}
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

export default ReceiptTable;
