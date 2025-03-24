import React from "react";
import { IoIosClose } from "react-icons/io";

const DynamicTable = ({ saveTrigger, items, onDelete }) => {
  const numberOfItemsToRender = 10; //maximo que mostra na tabela antes de scroll

  const itemsWithEmptyRows = [
    ...items,
    ...Array(Math.max(0, numberOfItemsToRender - items.length)).fill(null),
  ]; //fill na tabela quando nao tem 10

  return (
    <div className="overflow-auto rounded-2xl h-[90%] w-[85%] flex text-3xl scrollbar-hidden">
      <table className="w-full h-full">
        <thead>
          <tr className="bg-[#D9D9D9] sticky top-0 z-10 ">
            <th className="w-1/6 p-2 font-normal text-center border-r-4 border-b-4 border-[#B8B8B8] pt-5 pb-5">Quantidade</th>
            <th className="w-4/6 p-2 font-normal text-left border-b-4 border-[#B8B8B8] pl-5">Peça</th>
            <th className="w-1/6 p-2 text-center border-b-4 border-[#B8B8B8]"></th>
          </tr>
        </thead>
        <tbody className="overflow-y-scroll max-h-[500px]">
          {itemsWithEmptyRows.map((item, index) => (
            <tr key={index}>
              <td className="p-2 text-3xl text-center font-semibold border-r-4 border-b-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%]">
                {item?.quantity || ""}
              </td>
              <td className="p-2 pl-5 text-2xl bg-[#FFFFFF] border-[#B8B8B8] border-b-2">
                {item?.description || ""}
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-[#B8B8B8] border-b-2">
                <div className="flex justify-center">
                  {item?.description && (
                    <IoIosClose className="size-12 opacity-55 cursor-pointer hover:opacity-100" onClick={() => onDelete(index)}/>
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

export default DynamicTable;