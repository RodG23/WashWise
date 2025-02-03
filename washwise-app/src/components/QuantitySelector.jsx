import React, { useState } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";

//todo adicionar a tabela e passar cursor para peça

const QuantitySelector = () => {
  const [quantity, setQuantity] = useState("1");

  const decreaseQuantity = () => {
    setQuantity((prev) => (parseInt(prev) > 1 ? (parseInt(prev) - 1).toString() : "1"));
  };

  const increaseQuantity = () => {
    setQuantity((prev) => (parseInt(prev) + 1).toString());
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]+$/.test(value)) {
      setQuantity(value);
    }
  };

  const handleBlur = () => {
    if (quantity === "" || parseInt(quantity) < 1) {
      setQuantity("1");
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  return (
    <div className="flex items-center bg-[#C1C0C0] rounded-2xl p-3 shadow-sm w-[50%] justify-between">
      <button
        onClick={decreaseQuantity}
        className="p-2 bg-gray-300 rounded-full hover:bg-stone-400"
      >
        <BiMinus className="size-4" />
      </button>
      <input
        type="text"
        value={quantity}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="text-xl font-semibold text-center w-12 bg-transparent border-none outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />    
      <button
        onClick={increaseQuantity}
        className="p-2 bg-gray-300 rounded-full hover:bg-stone-400"
      >
        <BiPlus className="size-4" />
      </button>
    </div>
  );
};

export default QuantitySelector;