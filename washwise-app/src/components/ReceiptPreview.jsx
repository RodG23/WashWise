import React, { useState } from "react";
import { BiSolidEditAlt } from "react-icons/bi";
import { AiTwotoneDelete } from "react-icons/ai";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//todo mudar valor
//todo mudar estado
//todo colocar checkbox só se tiver item na linha

const ReceiptPreview = ({ }) => {

    const numberOfReceiptsToRender = 5;
    const filteredReceipts = [];

    // Preenche com linhas vazias caso haja menos talões que o número desejado
    const receiptsWithEmptyRows = [
        ...filteredReceipts,
        ...Array(Math.max(0, numberOfReceiptsToRender - filteredReceipts.length)).fill(null),
    ];

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
                <div className= "col-start-2 flex justify-end items-start pr-4 gap-1">
                    <p className="text-xl font-bold">Nº:</p>
                    <p className="text-xl"> 120</p>
                </div>
                <div className= "col-start-2 flex flex-col items-end pr-4">
                    <p className="text-lg">23-03-2025</p>
                    <p className="text-lg">12:23:09</p>
                </div>
                <div className= "flex justify-start items-center pl-4 gap-1">
                    <p className="font-bold text-xl">Cliente: </p>
                    <p className="text-xl">Rodrigo Gomes</p>
                </div>
                <div className= "gap-1 justify-end items-center pr-4 grid grid-cols-4">
                    <p className="font-bold text-xl col-start-3">Valor:</p>
                    <input
                        type="text"
                        className="bg-transparent border-none outline-1 outline-[#B8B8B8] text-xl w-auto p-0 text-right"
                        value={"24"}
                        //onChange={(e) => handleChange(e.target.value)}
                        //onBlur={handleBlur}
                        //onFocus={handleFocus}
                    />
                </div>
            </div>
            <div className="col-span-2 row-span-5 flex justify-center items-center overflow-auto h-full w-full text-xl scrollbar-hidden pl-4 pr-4">
                <table className="w-full h-full">
                    <thead>
                        <tr className="bg-[#D9D9D9] sticky top-0 z-10">
                            <th className="w-1/4 p-2 font-normal text-center border-2 border-r-4 border-b-4  border-[#B8B8B8] pt-5 pb-5">
                            Quantidade
                            </th>
                            <th className="w-2/4 p-2 font-normal text-left border-2 border-r-0 border-b-4 border-[#B8B8B8]">
                            Peça
                            </th>
                            <th className="w-1/4 p-2 font-normal text-center border-2 border-l-0 border-b-4 border-[#B8B8B8]">
                            Ensacado
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {receiptsWithEmptyRows.map((receipt, index) => (
                            <tr key={index}>
                            <td className="p-2 text-2xl text-center font-semibold border-r-4 border-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%] cursor-default">
                                1
                            </td>
                            <td className="p-2 text-left text-xl bg-[#FFFFFF] border-b-2 border-r-0 border-[#B8B8B8] cursor-default">
                                Fato preto
                            </td>
                            <td className="p-2 text-center text-xl bg-[#FFFFFF] border-b-2 border-r-2 border-[#B8B8B8] cursor-default">
                                <input
                                    type="checkbox"
                                    //checked={}
                                    //onChange={() => handleChange(option)}
                                    className="size-5 accent-[#928181] ring-1 ring-[#928181] rounded-2xl "
                                />
                            </td> 
                            </tr> ))}
                    </tbody>
                </table>               
            </div>
            <div className="gap-1 flex justify-center items-center pl-4">
                <p className="font-bold text-xl">Levantamento:</p>  
                <p className="text-xl">3ª</p>
            </div>
            <div className="flex justify-center items-center gap-1 pr-4">
                <p className="font-bold text-xl">Estado:</p>
                <p className="text-xl">Pendente</p>                
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
