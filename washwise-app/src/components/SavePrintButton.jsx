import React from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SavePrintButton = ({ onSave, client, items, checkbox, checkboxDate }) => {

  const handleSaveAndPrint = async () => {
    if (!client.id) {
      toast.warn("Dados do cliente não preenchidos.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
              toastId: "alerta-cliente",
            });
      return;
    }
    if (items.length === 0) {
      toast.warn("Sem peças adicionadas.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
              toastId: "alerta-peças",
            });
      return;
    }
    if (!checkbox) {
      toast.warn("Sem dia de levantamento preenchido.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
              toastId: "alerta-dia",
            });
      return;
    }
    var check = checkbox.replace("Sº", "Sab");
    const receipt = {
      client_id: client.id,
      client_name: client.name,
      products: items,
      state: "Pendente",
      total_price: items.reduce((total, item) => total + item.price * item.quantity, 0),
      date: check,
      //só vem preenchida quando o dia foi escolhido no calendário; nos dias da
      //semana é o main.js que a calcula, que é quem sabe o dia de hoje
      delivery_date: checkboxDate || null
    };

    const response = await window.api.saveAndPrintReceipt(receipt);
    //console.log(response);
    if (response.success) {
      toast.success("Talão criado com sucesso!", {
        toastId: "save-success",
      });
      onSave();
    } else {
      toast.error("Erro ao criar talão.", {
              toastId: "error-save",
      });
      //toast.error("Erro ao criar talão. " + response.error);
    }
  };


  // Cliente Sem Talão: o botão é desencorajado, não desativado. Continua a
  // guardar e a imprimir na mesma — há alturas em que se quer mesmo o talão —
  // mas fica apagado e com o aviso, para não ser o gesto automático.
  // Por isso mantém o cursor-pointer: um cursor de proibido diria que não funciona.
  const semTalao = !!client?.no_receipt;

  return (
    <button
    onClick={handleSaveAndPrint}
    className={`group relative flex items-center rounded-2xl p-5 shadow-md w-[70%] justify-center overflow-clip cursor-pointer border-3 border-[#928787] text-3xl transition duration-200 active:scale-95
      ${semTalao
        ? "bg-[#D6D3D1] text-stone-500 hover:bg-stone-400 hover:text-black"
        : "bg-[#C1C0C0] hover:bg-stone-400"}`}>
      Guardar e Imprimir
      {/* X a riscar o botão de canto a canto. Esbate-se ao passar o rato, para
          quem quiser mesmo clicar conseguir ler o texto por baixo.
          preserveAspectRatio="none" estica as diagonais até aos cantos e o
          vectorEffect impede que a espessura estique com elas. */}
      {semTalao && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-85 transition-opacity duration-200 group-hover:opacity-20"
        >
          <line x1="0" y1="0" x2="100" y2="100" stroke="#f87171" strokeWidth="4" vectorEffect="non-scaling-stroke" />
          <line x1="100" y1="0" x2="0" y2="100" stroke="#f87171" strokeWidth="4" vectorEffect="non-scaling-stroke" />
        </svg>
      )}
    </button>
  );
};

export default SavePrintButton;