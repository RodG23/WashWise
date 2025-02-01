import React, { useState, useEffect } from "react";
import axios from "axios";
import { BiSearchAlt } from "react-icons/bi";

const ClientSearch = ({ setResult, setInput, input  }) => {
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
  };

  return (
    <div className="bg-[#C1C0C0] w-[70%] rounded-2xl p-3 max-h-[30%] shadow-sm flex items-center">
      <BiSearchAlt className="size-6" />
      <input
        type="text"
        placeholder="Procurar Cliente..."
        className="bg-transparent border-none outline-none text-xl ml-1 w-full"
        value={input}
        onChange={(e) => handleChange(e.target.value)}
      />
    </div>
  );
};

export default ClientSearch;