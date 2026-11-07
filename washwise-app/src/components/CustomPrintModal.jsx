import React, { useState, useRef, useEffect } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const MAX_COPIES = 100; //teto de cópias, para um engano a escrever nao queimar o rolo

//Sobreposição (mesma janela) para impressão livre: número opcional + texto
const CustomPrintModal = ({ open, onClose }) => {
  const [number, setNumber] = useState("");
  const [text, setText] = useState("");
  const [copies, setCopies] = useState("1");
  const textRef = useRef(null);

  //ao abrir limpa os campos e foca o texto
  useEffect(() => {
    if (open) {
      setNumber("");
      setText("");
      setCopies("1");
      setTimeout(() => textRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const handlePrint = async () => {
    if (!text.trim()) {
      toast.warn("Escreva o texto a imprimir.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
        toastId: "alerta-texto-livre",
      });
      return;
    }
    const total = Math.min(MAX_COPIES, Math.max(1, parseInt(copies, 10) || 1));
    const response = await window.api.printCustom(number.trim(), text.trim(), total);
    if (response.success) {
      toast.success("Impresso com sucesso!", {
        toastId: "print-livre-success",
      });
      onClose();
    } else {
      toast.warn("Erro ao imprimir.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
        toastId: "erro-print-livre",
      });
    }
  };

  //cópias: mesmo comportamento do QuantitySelector, limitado a MAX_COPIES
  const decreaseCopies = () => {
    setCopies(String(Math.max(1, (parseInt(copies, 10) || 1) - 1)));
  };

  const increaseCopies = () => {
    setCopies(String(Math.min(MAX_COPIES, (parseInt(copies, 10) || 1) + 1)));
  };

  const handleCopiesChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setCopies("");
    } else if (/^[0-9]+$/.test(value)) {
      setCopies(String(Math.min(MAX_COPIES, parseInt(value, 10))));
    }
  };

  const handleCopiesBlur = () => {
    if (copies === "" || parseInt(copies, 10) < 1) setCopies("1");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={handleKeyDown}>
      {/* fundo escurecido; clicar fora fecha */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-lg w-[24%] flex flex-col overflow-clip">
        <div className="bg-[#D9D9D9] text-center font-normal text-3xl p-2 w-full border-[#B8B8B8] border-b-4 pt-4 pb-4">
          Impressão Livre
        </div>

        <div className="flex flex-col gap-4 p-6">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Número (opcional)"
            className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm text-xl outline-none placeholder-[#00000080]"
          />

          <textarea
            ref={textRef}
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Texto a imprimir..."
            className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm text-xl outline-none resize-none placeholder-[#00000080]"
          />

          <div className="flex items-center justify-end gap-3 mt-1">
            <span className="text-xl">Cópias</span>

            <div className="flex items-center bg-[#C1C0C0] rounded-2xl py-1.5 px-3 shadow-sm justify-between overflow-clip">
              <button
                onClick={decreaseCopies}
                className="p-1.5 bg-gray-300 rounded-full hover:bg-stone-400 transition duration-200 active:scale-95 cursor-pointer"
              >
                <BiMinus className="size-4" />
              </button>
              <input
                type="text"
                value={copies}
                onChange={handleCopiesChange}
                onBlur={handleCopiesBlur}
                onFocus={(e) => e.target.select()}
                className="text-xl font-semibold text-center w-12 bg-transparent border-none outline-none"
              />
              <button
                onClick={increaseCopies}
                className="p-1.5 bg-gray-300 rounded-full hover:bg-stone-400 transition duration-200 active:scale-95 cursor-pointer"
              >
                <BiPlus className="size-4" />
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center bg-[#C1C0C0] rounded-2xl py-1.5 px-5 shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-green-300 text-xl transition duration-200 active:scale-95"
            >
              Imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPrintModal;
