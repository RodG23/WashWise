import React from "react";

const SavePrintButton = ({ client, items, checkbox }) => {

  const handleSaveAndPrint = async () => {
    if (!client || items.length === 0 || !checkbox) {
      alert("Preencha todos os dados.");
      return;
    }
    const receipt = {
      client_id: client.id,
      client_name: client.name,
      products: items,
      state: "pendente",
      total_price: items.reduce((total, item) => total + item.ref.price * item.quantity, 0),
      date: checkbox
    };

    const response = await window.api.saveAndPrintReceipt(receipt);
    if (response.success) {
      alert("Talão guardado com sucesso!");
    } else {
      alert("Erro ao guardar: " + response.error);
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