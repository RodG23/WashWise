import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Componente de Formulário para Criação ou Edição de Cliente
const RefForm = ({ selectedRefEdit, isEditing, handleNewRef, updateFilteredRefs, activeTab }) => {
  const [prodRef, setProdRef] = useState(selectedRefEdit?.ref || "");
  const [oldProdRef, setOldProdRef] = useState(selectedRefEdit?.ref || "");
  const [type, setType] = useState(selectedRefEdit?.type || "");
  const [color, setColor] = useState(selectedRefEdit?.color || "");
  const [style, setStyle] = useState(selectedRefEdit?.style || "");
  const [price, setPrice] = useState(selectedRefEdit?.price || "");
  const [isNewRefActive, setIsNewRefActive] = useState(true); // Para controlar o estado dos botões

  const prodRefRef = useRef(null);
  const typeRef = useRef(null);
  const colorRef = useRef(null);
  const styleRef = useRef(null);
  const priceRef = useRef(null);

  useEffect(() => {
    if (activeTab !== "Peças") {
      handleNewRef();
    }
  }, [activeTab]);

  // Quando a peça selecionada mudar, atualiza os campos do formulário
  useEffect(() => {
    if (selectedRefEdit) {
      setProdRef(selectedRefEdit.ref);
      setOldProdRef(selectedRefEdit.ref);
      setType(selectedRefEdit.type);
      setColor(selectedRefEdit.color);
      setStyle(selectedRefEdit?.style || "");
      setPrice(selectedRefEdit.price);
      setIsNewRefActive(false); // Desabilitar "Nova Peça" quando estiver a editar
    } else {
      // Limpar os campos se não houver peça selecionada (modo de criação)
      setProdRef("");
      setOldProdRef("");
      setType("");
      setColor("");
      setStyle("");
      setPrice("");
      setIsNewRefActive(true); // Ativar "Nova Peça" quando não estiver a editar
    }
  }, [selectedRefEdit]);

  const handleSave = () => {
    const description = `${type} ${color} ${style ? style : ''}`.trim()
    const refData = { prodRef, type, color, style, description, price, oldProdRef };

    if (isEditing) {
      window.api.editRef(refData)
        .then(response => {
          if (response.success) {
            toast.success(response.message ,{
              toastId: "edit-ref-success",
            });
            updateFilteredRefs(prevRefs => prevRefs.map(peca => {
              if (peca.ref === oldProdRef) {
                const updatedPeca = { 
                  ...peca, 
                  type, 
                  color, 
                  style, 
                  description, 
                  price,
                  ref: prodRef
                };

                return updatedPeca;
              }
              return peca;
            }));
            handleNewRef(); // Limpa os dados da peça após a edição
          } else {
            toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
            handleNewRef(); // Limpa os dados da peça após a edição
          }
        })
        .catch(error => {
          console.error("Erro ao editar peça:", error);
        });
    } else {
      window.api.addRef(refData)
        .then(response => {
          if (response.success) {
            toast.success(response.message ,{
              toastId: "create-ref-success",
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
          console.error("Erro ao criar peça:", error);
        });
    }
    // Limpar campos após salvar
    setProdRef("");
    setOldProdRef("");
    setType("");
    setColor("");
    setStyle("");
    setPrice("");
    setIsNewRefActive(true); // Ativa o botão "Nova Peça" novamente após salvar
  };

  const handleNewRefClick = () => {
    // Limpar os campos quando clicar em "Nova peça"
    handleNewRef(); // Limpa a peça selecionada no App
    setProdRef("");
    setOldProdRef("");
    setType("");
    setColor("");
    setStyle("");
    setPrice("");
    setIsNewRefActive(true); // Ativar "Nova Peça"
  };

  const handleEnter = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else {
        handleSave();
        priceRef.current?.blur();
      }
    }
  };

  return (
    <div className="w-[90%] rounded-2xl flex flex-col justify-center overflow-clip">
      <div className="grid grid-cols-2 text-center font-normal text-3xl rounded-t-2xl w-full">
        {/* Botões lado a lado */}
        <div className="rounded-t-2xl">
          <button
            onClick={handleNewRefClick}
            disabled={isNewRefActive} // Desabilita o botão "Nova Peça" se estiver no modo de edição
            className={`p-5 w-full h-full rounded-2xl shadow-sm justify-center overflow-clip border-3 border-r-0 rounded-r-none border-[#928787] hover:bg-stone-400 bg-[#C1C0C0] ${isNewRefActive ? "bg-stone-400 rounded-t-2xl hover:none" : "bg-[#C1C0C0] rounded-t-2xl cursor-pointer"}`}
          >
            Nova Peça
          </button>
        </div>
          <div className="rounded-t-2xl">
          <button
            disabled={!selectedRefEdit} // Desabilita o botão "Editar Peça" se não houver uma peça selecionada
            className={`w-full h-full p-2 shadow-sm rounded-2xl justify-center overflow-clip border-3 border-l-0 rounded-l-none border-[#928787] bg-[#C1C0C0] ${selectedRefEdit ? "bg-stone-400" : "bg-[#C1C0C0] "}`}
          >
            Editar Peça
          </button>
        </div>
      </div>

      <div className="space-y-5 w-[70%] mx-auto pt-4">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Referência:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            ref={prodRefRef}
            type="text"
            value={prodRef}
            onChange={(e) => setProdRef(e.target.value)}
            onKeyDown={(e) => handleEnter(e, typeRef)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Referência de peça"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Tipo:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            ref={typeRef}
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            onKeyDown={(e) => handleEnter(e, colorRef)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Tipo de peça"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Cor:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            ref={colorRef}
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            onKeyDown={(e) => handleEnter(e, styleRef)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Cor de peça"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Estilo:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            ref={styleRef}
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            onKeyDown={(e) => handleEnter(e, priceRef)}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Estilo de peça (Se existente)"
          />
        </div>

        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Valor:</p>
        </div>
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
          <input
            ref={priceRef}
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => handleEnter(e, null)} // último input → submit
            className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            placeholder="Valor de peça"
          />
        </div>

        <div className="flex justify-center mt-14">
          <button
            onClick={handleSave}
            className="p-5 pt-3 pb-3 text-center font-normal text-3xl shadow-sm rounded-2xl justify-center overflow-clip border-3  border-[#928787] bg-[#C1C0C0] hover:bg-stone-400 transition duration-200 active:scale-95"
          >
            {isEditing ? "Guardar Peça" : "Criar Peça"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RefForm;
