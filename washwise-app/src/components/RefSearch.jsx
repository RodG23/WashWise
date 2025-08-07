import React, { useState, useRef, useEffect, forwardRef } from "react";
import { BiSearchAlt } from "react-icons/bi";

//Passa para app descript, ref e price, deve ser suficiente
const RefSearch = forwardRef(({ clearInputTrigger, onRefChange, quantityInputRef }, ref) => {
  const [result, setResult] = useState([]); //resultado de pesquisa
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); //indice da pesquisa

  const itemRefs = useRef([]); //itens mostrados

  //apaga o input quando se adiciona um item
  useEffect(() => {
    if (clearInputTrigger) {
      setInput("");
      setResult([]);
    }
  }, [clearInputTrigger]);

  const filterRefs = (value) => {
    if (value === "" || !value) {
      setResult([]);
      return;
    }

    window.api.getProdutosRef(value)
    .then((response) => {
      if (response.success) {
        const pecas = response.data;
        setResult(pecas);
      }});
  };



  //lida com mudança de input
  const handleChange = (value) => {
    setInput(value);
    filterRefs(value);
    setSelectedIndex(0);
  };

  //lida com clique
  const handleItemClick = (ref) => {
    onRefChange({ref: ref.ref, description: ref.description, price: ref.price});
    setInput(ref.ref);
    setResult([]);
    ref.current?.blur();
    quantityInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setResult([]);
      ref.current?.blur();
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
          ref={ref}
          type="text"
          placeholder="Procurar Peça..."
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
                <span>{res.ref} {"("}</span>
                <span className="opacity-50">{res.description}</span>
                <span>{")"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default RefSearch;