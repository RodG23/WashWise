import React, { useState, useEffect } from "react";
import { IoIosClose } from "react-icons/io";
import { TbIroningSteamFilled } from "react-icons/tb";


const DynamicTable = ({ items, onDelete, onNoteChange, activeTab, setItems, saveTrigger}) => {
  const numberOfItemsToRender = 8;

  const itemsWithEmptyRows = [
    ...items,
    ...Array(Math.max(0, numberOfItemsToRender - items.length)).fill(null),
  ];

  // Estado local das notas (por índice)
  const [localNotes, setLocalNotes] = useState([]);
  const [nextItem, setNextItem] = useState(0);

  useEffect(() => {
    window.api.getNextReceiptId()
      .then(response => {
        if (response.success) {
          setNextItem(response.nextId);
        } else {
          setNextItem(1);
        }
      })
      .catch(error => {
        console.error("Erro a obter próximo id do talão:", error);
        setNextItem(1);
      });
  }, [saveTrigger]);

  //Descomentar para itens da tabela sairem ao mudar tab
  // useEffect(() => {
  //   if (activeTab !== "Novo Talão") {
  //     setItems([]);
  //   }
  // }, [activeTab]);

  // Sempre que os items mudarem, atualiza o estado local
  useEffect(() => {
    setLocalNotes(items.map((item) => item.note || ""));
  }, [items]);

  const handleLocalNoteChange = (index, value) => {
    setLocalNotes((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.target.blur();
    }
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  const handleBlur = (index, value) => {
    onNoteChange(index, value); // só aqui atualiza o pai
  };

  return (
    <div className="overflow-auto rounded-2xl h-[90%] w-[85%] flex text-3xl scrollbar-hidden">
      <table className="w-full h-full">
        <thead>
          <tr className="bg-[#D9D9D9] sticky top-0 z-10">
            <th className="w-1/6 p-2 font-normal text-center border-r-4 border-b-4 border-[#B8B8B8] pt-5 pb-5">
              Quantidade
            </th>
            <th className="w-3/6 p-2 font-normal text-left border-r-0 border-b-4 border-[#B8B8B8] pl-5">
              Peça
            </th>
            <th className="w-1/6 p-2 font-normal text-left border-b-4 border-r-0 border-[#B8B8B8] pl-5"></th>
            <th className="w-1/6 p-2 text-center border-b-4 font-normal border-[#B8B8B8]">
            Nº {nextItem}
            </th>
          </tr>
        </thead>
        <tbody>
          {itemsWithEmptyRows.map((item, index) => (
            <tr key={index}>
              <td className="p-2 text-3xl text-center font-semibold border-r-4 border-b-2 border-[#B8B8B8] bg-[#FFFFFF] h-[10%] cursor-default">
                {item?.quantity || ""}
              </td>
              <td className="p-2 pl-5 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8] cursor-default">
                {item?.description || ""}
              </td>
              <td className="p-2 pl-5 bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                {item ? (
                  <input
                    type="text"
                    value={localNotes[index] ?? ""}
                    onChange={(e) => handleLocalNoteChange(index, e.target.value)}
                    onBlur={(e) => handleBlur(index, e.target.value)}
                    className="w-full bg-transparent outline-none text-xl"
                    placeholder="Adicionar nota..."
                    onKeyDown={handleKeyDown}
                  />
                ) : null}
              </td>
              <td className="p-2 text-2xl bg-[#FFFFFF] border-b-2 border-[#B8B8B8]">
                <div className="flex justify-center">
                  {item?.description && (
                    <div className="flex items-center "> 
                    <TbIroningSteamFilled 
                      className="size-7 opacity-55 cursor-pointer hover:opacity-100"
                      onClick={() => onNoteChange(index, "Só passar")}
                    />
                    <IoIosClose
                      className="size-12 opacity-55 cursor-pointer hover:opacity-100 ml-10"
                      onClick={() => onDelete(index)}
                    />
                    </div>
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
