import React, { useState, useEffect } from "react";
import { IoIosArrowDropup } from "react-icons/io";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ReceiptPreview = ({ selectedReceiptEdit, isEditing, handleNewReceipt, updateFilteredReceipts, activeTab }) => {

    const [value, setValue] = useState(0); //Guarda valor da edição
    const numberOfLinesToRender = 5;
    const [showOptionsState, setShowOptionsState] = useState(false); // Controla se as opções estão visíveis na mudança de estado
    const [editingState, setEditingState] = useState(""); //Guarda estado do talao a ser editado
    const [productsState, setProductsState] = useState([]);

    useEffect(() => {
        if (activeTab !== "Talões") {
          handleNewReceipt();
        }
    }, [activeTab]);

    const receiptsWithEmptyRows = [
        ...productsState,
        ...Array(Math.max(0, numberOfLinesToRender - productsState.length)).fill(null),
    ];

    const handleChange = (value) => {
        setValue(value);
    };

    const handleBlur = () => {
        const floatValue = parseFloat(Number(value));
        if (isNaN(floatValue) || floatValue < 0) {
            setValue(selectedReceiptEdit.total_price);
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
        }
    }, [selectedReceiptEdit]);

    const toggleOptionsState = () => {
        if(isEditing) {
            setShowOptionsState(!showOptionsState);
        }
    };

    const handleOptionSelectState = (option) => {
        setShowOptionsState(false);
        setEditingState(option);
    };

    const handleCheckboxChange = (index) => {
    setProductsState(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], bagged: !updated[index].bagged };
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
            toast.success(response.message ,{
                toastId: "edit-receipt-success",
            });
            updateFilteredReceipts(prevReceipts => prevReceipts.map(receipt => receipt.id === selectedReceiptEdit.id ? {...receipt, total_price: value, products_list: JSON.stringify(productsState), state: editingState,} : receipt));
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
        // Limpar campos após salvar
        handleNewReceipt();
    };

    return (
        <div className="grid grid-cols-2 grid-rows-11 bg-white h-[90%] w-[70%] rounded-2xl ">
            <div className= "col-span-2 row-span-2 flex justify-center items-center">
                  <img src="../renderer/logo.png" alt="Logo" className="w-[80%] h-[80%] object-contain" />
            </div>
            <div className="col-span-2 row-span-2 grid grid-cols-2 grid-rows-3">
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
                <div className= "col-start-2 flex flex-col items-end pr-4">
                    <div>{selectedReceiptEdit?.table_date || "dd-mm-aaaa"}</div> 
                    <div>{selectedReceiptEdit?.table_hour || "hh:mm:ss"}</div>
                </div>
                <div className= "flex justify-start items-center pl-4 text-xl gap-1">
                    <p className="font-bold">Cliente: </p>
                    {selectedReceiptEdit?.name || ""}
                </div>
                <div className= "gap-1 justify-end items-center pr-4 grid grid-cols-4">
                    <p className="font-bold text-xl col-start-3">Valor:</p>
                    <input
                        type="text"
                        className="bg-transparent border-none outline-1 outline-[#B8B8B8] text-xl w-auto p-0 text-right"
                        value={value}
                        onChange={(e) => handleChange(e.target.value)}
                        onBlur={handleBlur}
                    />
                </div>
            </div>
            <div className="col-span-2 row-span-5 flex justify-center items-center h-full w-full pl-4 pr-4">
            <div className="w-full h-full overflow-y-auto scrollbar-hidden border-t-2 border-[#B8B8B8]">
                <table className="w-full h-full table-fixed">
                <thead className="sticky top-0 z-20 bg-white">
                    <tr className="">
                    <th className="w-1/4 p-2 font-normal text-xl text-center border-2 border-r-4 border-b-4 border-t-0 border-[#B8B8B8] pt-5 pb-5">
                        Quantidade
                    </th>
                    <th className="w-2/4 p-2 font-normal text-xl text-left border-2 border-r-0 border-b-4 border-t-0 border-[#B8B8B8]">
                        Peça
                    </th>
                    <th className="w-1/4 p-2 font-normal text-xl text-center border-2 border-l-0 border-b-4 border-t-0 border-[#B8B8B8]">
                        Ensacado
                    </th>
                    </tr>
                </thead>
                <tbody>
                    {receiptsWithEmptyRows.map((receipt, index) => (
                    <tr key={index}>
                        <td className="p-2 text-2xl text-center font-semibold border-r-4 border-2 border-[#B8B8B8] bg-[#FFFFFF] h-[60px]">
                        {receipt ? receipt.quantity : ""}
                        </td>
                        <td className="p-2 text-left text-xl bg-[#FFFFFF] border-b-2 border-r-0 border-[#B8B8B8]">
                        {receipt ? receipt.description : ""}
                        </td>
                        <td className="p-2 text-center text-xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8]">
                        {receipt ? (
                            <input
                            type="checkbox"
                            className="size-5 accent-[#928181] ring-1 ring-[#928181] rounded-2xl"
                            checked={receipt.bagged}
                            onChange={() => handleCheckboxChange(index)}
                            />
                        ) : null}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
            <div className="justify-center items-center gap-1 text-xl row-start-10 row-span-2 grid grid-rows-2">
                <div className="gap-1 flex justify-center items-center text-xl pr-4 font-bold h-full ">
                        <p>Estado:</p>
                </div>
                <div className="flex-col flex w-full h-[100%]">
                    <div className='flex justify-center items-center flex-col'>
                        <div className="row-start-1 relative w-[70%] cursor-pointer shadow-md rounded-2xl border-2 border-[#928787] bg-[#C1C0C0]">
                        <div className="rounded-2xl p-3 flex items-center " onClick={toggleOptionsState}>
                            <input
                            type="text"
                            placeholder={""}
                            className="bg-transparent border-none outline-none text-2xl ml-1 cursor-pointer flex items-center w-full h-full justify-center overflow-clip border-2"
                            value={editingState || ""}
                            readOnly
                            />
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
                </div>
            </div>
            <div className="gap-1 flex justify-center items-center text-xl pl-4">
                <p className="font-bold">Levantamento:</p>  
                {selectedReceiptEdit?.date || ""}
            </div>
            <div className="flex justify-center items-start col-start-2">
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
