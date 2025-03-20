import React, { useState, useRef } from "react";
import { BiSearchAlt } from "react-icons/bi";

//todo nao permitir clientes que nao existam, fazer verificação ao guardar talao

//Passagem para app do nome e id de cliente
//Get de clientes sem number, não é necessário
const ClientSearch = ({ onClientChange, refSearchRef }) => {
  const [result, setResult] = useState([]); //lista de pesquisa
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); //indice selecionado

  const inputRef = useRef(null); //refereencia para input
  const itemRefs = useRef([]); //lista de pesquisa mostrada

  //filtrar pesquisa
  const filterClients = (value) => {
    if (value === "" || !value) {
      setResult([]);
      return;
    }

    window.api.getClientesSearch().then((clientes) => {
      const filtered = clientes
        .filter(
          (cliente) =>
            cliente &&
            cliente.name &&
            cliente.name.toLowerCase().includes(value.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));
      setResult(filtered);
    });
  };

  //lida com mudança no input
  const handleChange = (value) => {
    setInput(value);
    filterClients(value);
    setSelectedIndex(0);
  };

  //lida com clique na lisat de pesquisas
  const handleItemClick = (cli) => {
    setInput(cli.name);
    onClientChange({ name: cli.name, id: cli.id });
    setResult([]);
    inputRef.current?.blur();
    refSearchRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setResult([]);
      inputRef.current.blur();
    }

    if (result.length === 0) return;

    if (e.key === "ArrowDown") {
      setSelectedIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % result.length;
        scrollToItem(newIndex);
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex = (prevIndex - 1 + result.length) % result.length;
        scrollToItem(newIndex);
        return newIndex;
      });
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      handleItemClick(result[selectedIndex]);
    } 
  };

  const scrollToItem = (index) => {
    if (itemRefs.current[index]) {
      itemRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  return (
    <div className="relative w-[70%]">
      <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
        <BiSearchAlt className="size-6" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Procurar Cliente..."
          className="bg-transparent border-none outline-none text-xl ml-1 w-full"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {result.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-[#C1C0C0] flex flex-col items-center shadow-lg rounded-2xl mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
          {result.map((res, id) => {
            const isHighlighted = id === selectedIndex;
            return (
              <div
                key={id}
                ref={(el) => (itemRefs.current[id] = el)}
                className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                  hover:bg-stone-400 hover:rounded-2xl ${
                    isHighlighted ? "bg-stone-400 rounded-2xl" : ""
                  }`}
                onClick={() => handleItemClick(res)}
              >
                <span>{res.name} {"("}</span>
                <span className="opacity-50">{res.address}</span>
                <span>{")"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientSearch;