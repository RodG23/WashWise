import React, { useState, useEffect, useRef } from "react";
import { IoIosArrowDropup } from "react-icons/io";
import { TbArrowBigDownLines } from "react-icons/tb";
import { HiOutlineIdentification } from "react-icons/hi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReceiptPreview = ({ selectedReceiptEdit, isEditing, handleNewReceipt, updateFilteredReceipts, activeTab }) => {

  const [value, setValue] = useState(0); // Guarda valor da edição
  const numberOfLinesToRender = 4;
  const [showOptionsState, setShowOptionsState] = useState(false); // dropdown estado
  const [editingState, setEditingState] = useState(""); // estado do talão
  const [productsState, setProductsState] = useState([]);

  //Refs para fechos por clique fora 
  const stateDropdownRef = useRef(null);

  //Context Menu
  const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, rowIndex: null });
  const ctxMenuRef = useRef(null);

  const closeCtx = () => setCtxMenu({ open: false, x: 0, y: 0, rowIndex: null });

  const handleRowContextMenu = (e, index, { isReal }) => {
    if (!isEditing || !isReal) return; // só em edição e linhas reais
    e.preventDefault();

    // Posição base no viewport
    let x = e.clientX;
    let y = e.clientY;

    setCtxMenu({ open: true, x, y, rowIndex: index });
  };

  // Fechos globais: clicar fora, ESC, scroll/resize
  useEffect(() => {
    const onGlobalClick = (e) => {
      // Fecha menu de contexto se clicar fora do próprio menu
      if (ctxMenu.open) {
        if (ctxMenuRef.current && !ctxMenuRef.current.contains(e.target)) closeCtx();
      }
      // Fecha dropdown de estado se clicar fora do seu container
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target)) {
        setShowOptionsState(false);
      }
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        closeCtx();
        setShowOptionsState(false);
      }
    };

    window.addEventListener("click", onGlobalClick, true);
    window.addEventListener("keydown", onEsc, true);

    return () => {
      window.removeEventListener("click", onGlobalClick, true);
      window.removeEventListener("keydown", onEsc, true);
    };
  }, [ctxMenu.open]);

  const handleRowDelete = (index) => {
    setProductsState(prev => prev.filter((_, i) => i !== index));
    closeCtx();
  };

  const handleRowInsertAtEnd = () => {
    setProductsState(prev => [...prev, { quantity: 0, description: "", note: "", bagged: 0 }]);
    closeCtx();
  };

  useEffect(() => {
    if (activeTab !== "Talões") {
      handleNewReceipt();
    }
  }, [activeTab]);

  // Linhas a renderizar mantendo 4 colunas originais
  const receiptsWithEmptyRows = (() => {
    const base = [...productsState];
    const pad = Math.max(0, numberOfLinesToRender - base.length);
    return [...base, ...Array(pad).fill(null)];
  })();

  const handleChange = (value) => setValue(value);

  const handleBlur = () => {
    const floatValue = parseFloat(Number(value));
    if (isNaN(floatValue) || floatValue < 0) {
      setValue(selectedReceiptEdit?.total_price ?? 0);
      toast.warn("Valor inválido.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
      });
    } else {
      setValue(floatValue);
    }
  };

  useEffect(() => {
    if (selectedReceiptEdit?.products_list) {
      try {
        const parsed = typeof selectedReceiptEdit.products_list === "string"
          ? JSON.parse(selectedReceiptEdit.products_list)
          : selectedReceiptEdit.products_list;
        setProductsState(parsed);
      } catch (e) {
        console.error("Erro a fazer parse dos produtos:", e);
        setProductsState([]);
      }
    }
    if (isEditing) {
      setValue(selectedReceiptEdit.total_price);
      setEditingState(selectedReceiptEdit.state);
    } else {
      setValue(0);
      setEditingState("");
      setProductsState([]);
      closeCtx();
      setShowOptionsState(false);
    }
  }, [selectedReceiptEdit]);

  const toggleOptionsState = () => {
    if (isEditing) setShowOptionsState(v => !v);
  };

  const handleOptionSelectState = (option) => {
    setShowOptionsState(false);
    setEditingState(option);
  };

  // Atualiza quantidade do indice
  const handleQuantityChange = (index, raw) => {
    const qty = Math.max(0, parseInt(raw, 10) || 0);
    setProductsState(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: qty };
      const currentBagged = updated[index].bagged ?? 0;
      updated[index].bagged = Math.min(currentBagged, qty);
      return updated;
    });
  };

  const handleDescriptionChange = (index, value) => {
    setProductsState(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], description: value };
      return updated;
    });
  };

  const handleNoteChange = (index, value) => {
    setProductsState(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], note: value };
      return updated;
    });
  };

  const handleBaggedChange = (index, raw) => {
    setProductsState(prev => {
      const updated = [...prev];
      const maxQty = updated[index].quantity ?? 0;
      const newVal = Math.max(0, Math.min(parseInt(raw, 10) || 0, maxQty));
      updated[index] = { ...updated[index], bagged: newVal };
      return updated;
    });
  };

  const handleSave = () => {
    const updatedFields = {
      id: selectedReceiptEdit.id,
      total_price: value,
      products_list: JSON.stringify(productsState),
      state: editingState,
    };
    window.api.editReceipt(updatedFields)
      .then(response => {
        if (response.success) {
          toast.success(response.message, { toastId: "edit-receipt-success" });
          updateFilteredReceipts(prevReceipts =>
            prevReceipts.map(receipt =>
              receipt.id === selectedReceiptEdit.id
                ? {
                    ...receipt,
                    total_price: value,
                    products_list: JSON.stringify(productsState),
                    state: editingState,
                  }
                : receipt
            )
          );
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
        console.error("Erro ao editar cliente:", error);
      });
    handleNewReceipt();
  };

  const handlePrint = async () => {
    const response = await window.api.printNumber(selectedReceiptEdit.id, selectedReceiptEdit.name, selectedReceiptEdit.state);
    if (response.success) {
      toast.success("Impresso com sucesso!", {});
    } else {
      toast.warn("Erro ao imprimir.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
        toastId: "erro-impressão",
      });
    }
  };

  return (
    <div className="grid grid-cols-2 grid-rows-11 bg-white h-[90%] w-[95%] rounded-2xl ">
      <div className= "col-span-2 row-span-2 flex justify-center items-center">
        <img src="../renderer/logo.png" alt="Logo" className="w-[80%] h-[80%] object-contain" />
      </div>
      <div className="col-span-2 row-span-2 grid grid-cols-2 grid-rows-3 leading-tight">
        <div className= "pl-4 row-span-2 flex-col">
          <p className="font-bold text-lg">Lavandaria 3 Marias</p>
          <p className="">Av. 25 de Abril, 241</p>
          <p className="">4830-512 Póvoa de Lanhoso</p>
          <p className="">Tlf: 253 634 051</p>
        </div>
        <div className= "col-start-2 flex justify-end items-start pr-4 text-xl gap-1">
          <p className="font-bold">Nº:</p>
          {selectedReceiptEdit?.id || "[.....]"}
        </div>
        <div className= "col-start-2 flex flex-col items-end pr-4 leading-tight">
          <div>{selectedReceiptEdit?.table_date || "dd-mm-aaaa"}</div>
          <div>{selectedReceiptEdit?.table_hour || "hh:mm:ss"}</div>
        </div>
        {/* Cliente e Valor na mesma linha */}
        <div className="col-span-2 flex justify-between items-center pl-4 pr-4 text-xl gap-2">
          {/* Cliente */}
          <div className="flex-1 flex items-center gap-1 overflow-hidden">
            <p className="font-bold">Cliente:</p>
            <p className="truncate">{selectedReceiptEdit?.name || ""}</p>
          </div>

          {/* Valor */}
          <div className="flex items-center gap-1">
            <p className="font-bold text-xl">Valor:</p>
            <input
              type="text"
              className="bg-transparent border-none outline-1 outline-[#B8B8B8] text-xl w-[70px] text-right p-0"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>

      <div className="col-span-2 row-span-5 flex justify-center items-center h-full w-full pl-4 pr-4">
        <div
          className="w-full h-full overflow-y-auto scrollbar-hidden border-t-2 border-[#B8B8B8]"
        >
          <table className="w-full h-full table-fixed">
            <thead className="sticky top-0 z-20 bg-white">
              <tr className="">
                <th className="w-4/24 p-2 font-normal text-xl text-center border-2 border-r-4 border-b-4 border-t-0 border-[#B8B8B8] pt-5 pb-5">
                  Qt.
                  {receiptsWithEmptyRows.length > 4 && (
                    <TbArrowBigDownLines className="inline text-blue-700" />
                  )}
                </th>
                <th className="w-11/24 p-2 font-normal text-xl text-left border-2 border-r-0 border-b-4 border-t-0 border-[#B8B8B8]">
                  Peça {selectedReceiptEdit && (
                    <> (
                      {receiptsWithEmptyRows.reduce(
                        (acc, item) => acc + Number(item?.quantity || 0),
                        0
                      )}) - (
                      {receiptsWithEmptyRows.reduce(
                        (acc, item) => acc + Number(item?.bagged || 0),
                        0
                      )}
                      )</>
                  )}
                </th>
                <th className="w-5/24 p-2 font-normal text-xl text-left border-2 border-r-0 border-b-4 border-t-0 border-l-0 border-[#B8B8B8]">
                  Nota
                </th>
                <th className="w-4/24 p-2 pl-1 font-normal text-xl text-center border-2 border-l-0 border-b-4 border-t-0 border-[#B8B8B8]">
                  Ensacado
                </th>
              </tr>
            </thead>
            <tbody>
              {receiptsWithEmptyRows.map((item, index) => {
                const isReal = !!item;

                return (
                  <tr
                    key={index}
                    onContextMenu={(e) => handleRowContextMenu(e, index, { isReal })}
                  >
                    {/* Quantidade */}
                    <td className="p-2 pl-4 pr-1 text-2xl text-center font-semibold border-r-4 border-2 border-[#B8B8B8] bg-[#FFFFFF] h-[60px]">
                      {isReal ? (
                        <input
                          type="number"
                          min="0"
                          inputMode="numeric"
                          className="w-full bg-transparent border-none outline-none text-2xl text-center"
                          value={item.quantity ?? 0}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                        />
                      ) : ""}
                    </td>

                    {/* Descrição */}
                    <td className="p-2 text-left text-xl bg-[#FFFFFF] border-b-2 border-r-0 border-[#B8B8B8] relative">
                      {isReal ? (
                        <input
                          type="text"
                          className="w-full bg-transparent border-none outline-none text-xl truncate"
                          value={item.description ?? ""}
                          title={item.description ?? ""}
                          onChange={(e) => handleDescriptionChange(index, e.target.value)}
                          placeholder="Descrição da peça"
                        />
                      ) : ""}
                    </td>

                    {/* Nota */}
                    <td className="p-2 text-left text-xl bg-[#FFFFFF] border-b-2 border-r-0 border-l-0 border-[#B8B8B8] relative">
                      {isReal ? (
                        <input
                          type="text"
                          className="w-full bg-transparent border-none outline-none text-xl truncate"
                          value={item.note ?? ""}
                          title={item.note ?? ""}
                          onChange={(e) => handleNoteChange(index, e.target.value)}
                          placeholder="..."
                        />
                      ) : ""}
                    </td>

                    {/* Ensacado */}
                    <td className="p-2  text-center text-2xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8]">
                      {isReal ? (
                        <input
                          type="number"
                          min={0}
                          max={item.quantity ?? 0}
                          inputMode="numeric"
                          className={`w-full  border-none outline-none text-xl text-center ${
                            (item.bagged ?? 0) >= (item.quantity ?? 0) ? 'bg-green-100' : ''
                          }`}
                          value={item.bagged ?? 0}
                          onChange={(e) => handleBaggedChange(index, e.target.value)}
                        />
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/*MENU DE CONTEXTO*/}
        {ctxMenu.open && (
          <div
            ref={ctxMenuRef}
            className="fixed z-50 bg-white rounded-md shadow-lg border border-[#B8B8B8] text-sm select-none"
            style={{ left: ctxMenu.x, top: ctxMenu.y, maxWidth: 200}}
          >
            <button
              className="w-full text-left text-xl px-3 py-2 hover:bg-stone-100"
              onClick={handleRowInsertAtEnd}
            >
              Adicionar linha
            </button>
            <button
              className="w-full text-left text-xl px-3 py-2 hover:bg-stone-100"
              onClick={() => handleRowDelete(ctxMenu.rowIndex)}
            >
              Apagar linha
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center items-center gap-1 text-xl row-start-10 font-bold h-full">
        <HiOutlineIdentification
          className={`size-10 opacity-70 ${isEditing ? 'cursor-pointer hover:opacity-100' : 'opacity-50 pointer-events-none'}`}
          onClick={isEditing ? handlePrint : undefined}
        />
      </div>
      <div className="gap-1 flex justify-center items-center text-xl row-start-10 col-start-2 overflow-auto">
        <p className="font-bold">Levantamento:</p>  
        {selectedReceiptEdit?.date || ""}
      </div>
      <div className="row-start-11 flex justify-center items-start">
        <div
          ref={stateDropdownRef}
          className=" w-[70%] h-[80%] relative cursor-pointer shadow-md rounded-2xl border-2 border-[#928787] bg-[#C1C0C0]"
        >
          <div className="h-full rounded-2xl p-3 flex items-center cursor-pointer justify-between"
            onClick={toggleOptionsState}
          >
            <button
              type="button"
              className="bg-transparent border-none outline-none text-2xl ml-1 w-full h-full text-left flex items-center justify-between cursor-pointer"
            >
              {editingState || " "}
            </button>
            <IoIosArrowDropup className="size-6" />
          </div>

          {/* Lista de opções */}
          {showOptionsState && (
            <ul className="absolute bottom-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto z-50">
              {["Pendente", "Pago", "Entregue"].map((option, index) => (
                <li
                  key={index}
                  className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                      hover:bg-stone-400 hover:rounded-2xl ${editingState === option ? "bg-stone-400 rounded-2xl" : ""}`}
                  onClick={() => handleOptionSelectState(option)}
                >
                  <span>{option === "Pendente" ? "Pendente" : option === "Pago" ? "Pago" : "Entregue"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex justify-center items-start col-start-2 row-start-11">
        <button
          onClick={handleSave}
          className="flex items-center w-[70%] h-[80%] bg-[#C1C0C0] rounded-2xl text-2xl shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95">
          Guardar
        </button>               
      </div>
    </div>
  );
};

export default ReceiptPreview;
