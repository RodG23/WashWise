import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiSearchAlt } from "react-icons/bi";

//todo adicionar id no input para depois saber que cliente vou buscar (ou algo do genero)
//todo fazer com que os results saiam do container
//todo fazer com que o numero de resultados se limite a 10

const ClientSearch = () => {

  const [result, setResult] = useState([])
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const API_URL = "https://jsonplaceholder.typicode.com/users";

  const userData = (value) => {
    if (!value) {
      setResult([]);
      return;
    }

    axios.get(API_URL)
    .then(res => {
      const result = res.data
        .filter(user =>
          user && user.name && user.name.toLowerCase().includes(value.toLowerCase())
        )
        .sort((a, b) => a.name.localeCompare(b.name));
        setResult(result);
        console.log(result);
      })
      .catch(err => console.error("Erro ao buscar dados:", err));
  };

  const handleChange = (value) => {
    setInput(value);
    userData(value);
    setSelectedIndex(-1); 
  };

  const handleItemClick = (name) => {
    setInput(name);
    setResult([]);
  };

  const handleKeyDown = (e, result) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prevIndex) => (prevIndex + 1) % result.length);
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prevIndex) => (prevIndex - 1 + result.length) % result.length);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0) {
        handleItemClick(result[selectedIndex].name);
      }
    }
  };

  return (
    <>
    <div className="bg-[#C1C0C0] w-[70%] rounded-2xl p-3 max-h-[30%] shadow-sm flex items-center">
      <BiSearchAlt className="size-6" />
      <input
        type="text"
        placeholder="Procurar Cliente..."
        className="bg-transparent border-none outline-none text-xl ml-1 w-full"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => handleKeyDown(e, result)}
      />
    </div>
    <div className="bg-[#C1C0C0] w-[70%] flex flex-col items-center shadow-sm rounded-2xl mt-1 mb-2 max-h-[40%] overflow-y-scroll scrollbar-hidden px-3">
    {
        result.map((result, id) => {
            const isHighlighted = id === selectedIndex;
            return (
              <div
              key={id}
              className={`w-full flex justify-center border-b-1 border-[rgba(0,0,0,0.2)] text-xl mt-0.5 mb-0.5 cursor-pointer hover:bg-stone-400 hover:rounded-2xl 
                ${isHighlighted ? 'bg-stone-400 rounded-2xl' : ''}  // Destaque para o item selecionado`}
              onClick={() => handleItemClick(result.name)}
              >
              <span>{result.name} {"("}</span>
              <span className="opacity-50">{result.address.city}</span>
              <span>{")"}</span>
              </div>
            )
        })
    }
    </div>
    </>
  );
};

export default ClientSearch;