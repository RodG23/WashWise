import React, { useState, useEffect } from "react";
import { BiSolidEditAlt } from "react-icons/bi";
import { AiTwotoneDelete } from "react-icons/ai";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//todo mudar valor, guardar salva tudo
//todo mudar estado ocupar os dois da esquerda e meter botoes ou dropdown, guardar salva tudo pri:1
//todo verificar valor ao tirar o foco

const ReceiptPreview = ({ selectedReceiptEdit, isEditing, handleNewReceipt, updateFilteredReceipts, activeTab }) => {

    const [value, setValue] = useState(0);

    const numberOfLinesToRender = 5;

    let products = [];
    if (selectedReceiptEdit?.products_list) {
        try {
            products = typeof selectedReceiptEdit.products_list === "string"
                ? JSON.parse(selectedReceiptEdit.products_list)
                : selectedReceiptEdit.products_list;
        } catch (e) {
            console.error("Erro a fazer parse dos produtos:", e);
            products = [];
        }
    }

    const receiptsWithEmptyRows = [
        ...products,
        ...Array(Math.max(0, numberOfLinesToRender - products.length)).fill(null),
    ];

    const handleChange = (value) => {
        setValue(value);
    };

    useEffect(() => {
        if (isEditing) {
            setValue(selectedReceiptEdit.total_price);
        } else {
            setValue(0);
        }
    }, [selectedReceiptEdit]);


    return (
        <div className="grid grid-cols-2 grid-rows-11 bg-white h-[90%] w-[70%] rounded-2xl ">
            <div className= "col-span-2 row-span-2 flex justify-center items-center">
                  <img src="../logo.png" alt="Logo" className="w-[80%] h-[80%] object-contain" />
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
                            />
                        ) : null}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
            <div className="flex justify-center items-center gap-1 text-xl pr-4">
                <p className="font-bold">Estado:</p>
                {selectedReceiptEdit?.state || ""}               
            </div>
            <div className="gap-1 flex justify-center items-center text-xl pl-4">
                <p className="font-bold">Levantamento:</p>  
                {selectedReceiptEdit?.date || ""}
            </div>
            <div className="flex justify-center items-start">
                <button
                    //onClick={handleDateChange}
                    className="flex items-center w-[70%] h-[80%] bg-[#C1C0C0] rounded-2xl text-xl shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95">
                    Entregue
                </button>              
            </div>
            <div className="flex justify-center items-start">
                <button
                    //onClick={handleDateChange}
                    className="flex items-center w-[70%] h-[80%] bg-[#C1C0C0] rounded-2xl text-xl shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95">
                    Guardar
                </button>               
            </div>
        </div>
    );

};

export default ReceiptPreview;
