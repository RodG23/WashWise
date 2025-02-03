import React, { useState, useRef } from "react";
import axios from "axios";
import { BiSearchAlt } from "react-icons/bi";

//todo passagem de cursor para a quantidade, selecionado para replacement

const ClientSearch = () => {
  const [result, setResult] = useState([]);
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  const API_URL = "https://jsonplaceholder.typicode.com/users";

  const userData = (value) => {
    if (value === "" || !value) {
      setResult([]);
      return;
    }

    axios
      .get(API_URL)
      .then((res) => {
        const result = res.data
          .filter(
            (user) =>
              user &&
              user.name &&
              user.name.toLowerCase().includes(value.toLowerCase())
          )
          .sort((a, b) => a.name.localeCompare(b.name));
        setResult(result);
      })
      .catch((err) => console.error("Erro ao procurar peça:", err));
  };

  const handleChange = (value) => {
    setInput(value);
    userData(value);
    setSelectedIndex(-1);
  };

  const handleItemClick = (name) => {
    setInput(name);
    setResult([]);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
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
      handleItemClick(result[selectedIndex].name);
    } else if (e.key === "Escape") {
      setResult([]);
      inputRef.current?.blur();
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
                onClick={() => handleItemClick(res.name)}
              >
                <span>{res.name} {"("}</span>
                <span className="opacity-50">{res.address.city}</span>
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