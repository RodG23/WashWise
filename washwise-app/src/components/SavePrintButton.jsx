import React from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SavePrintButton = ({ client, items, checkbox }) => {

  const handleSaveAndPrint = async () => {
    if (!client.id) {
      toast.warn("Dados do cliente não preenchidos.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
      return;
    }
    if (items.length === 0) {
      toast.warn("Sem peças adicionadas.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
      return;
    }
    if (!checkbox) {
      toast.warn("Sem dia de levantamento preenchido.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
      return;
    }
    const receipt = {
      client_id: client.id,
      client_name: client.name,
      products: items,
      state: "pendente",
      total_price: items.reduce((total, item) => total + item.price * item.quantity, 0),
      date: checkbox
    };

    const response = await window.api.saveReceipt(receipt);
    if (response.success) {
      toast.success("Talão criado com sucesso!");
    } else {
      toast.error("Erro ao criar talão.");
      //toast.error("Erro ao criar talão. " + response.error);
    }
  };


  return (
    <button
    onClick={handleSaveAndPrint}
    className="flex items-center bg-[#C1C0C0] rounded-2xl p-5 shadow-md w-[70%] justify-center overflow-clip cursor-pointer border-3 border-[#928787] hover:bg-stone-400 text-3xl transition duration-200 active:scale-95">
      Guardar e Imprimir
    </button>
  );
};

export default SavePrintButton;