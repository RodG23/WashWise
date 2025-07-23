import React, { useState, useEffect, forwardRef } from "react";
import { BiMinus, BiPlus } from "react-icons/bi";

const QuantitySelector = forwardRef(({ clearInputTrigger, onQuantityChange, refSearchRef, onClick }, ref) => {
  const [localQuantity, setLocalQuantity] = useState("1"); //quantidade do componente

  //quando algo e adicionado coloca quantidade a 1
  useEffect(() => {
    if (clearInputTrigger) {
      setLocalQuantity("1");
    }
  }, [clearInputTrigger]);

  //diminui quantidade no componente e envia para o pai 
  const decreaseQuantity = () => {
    const newValue = parseInt(localQuantity) > 1 ? (parseInt(localQuantity) - 1).toString() : "1";
    setLocalQuantity(newValue);
    onQuantityChange(newValue);
  };

  //aumenta quantidade no componente e envia para o pai 
  const increaseQuantity = () => {
    const newValue = (parseInt(localQuantity || "1", 10) + 1).toString();
    setLocalQuantity(newValue);
    onQuantityChange(newValue);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^[0-9]+$/.test(value)) {
      setLocalQuantity(value);
      onQuantityChange(value);
    }
  };

  const handleBlur = () => {
    if (localQuantity === "" || parseInt(localQuantity) < 1) {
      setLocalQuantity("1");
      onQuantityChange("1");
    }
  };

  const handleFocus = (e) => {
    e.target.select();
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowUp" || e.key === "+") {
      increaseQuantity();
      e.preventDefault();
    } else if (e.key === "ArrowDown" || e.key === "-") {
      decreaseQuantity();
      e.preventDefault();
    } else if (e.key === "Enter") {
      e.preventDefault();
      onClick();
      refSearchRef.current?.focus(); //foca na ref
    }
  };

  return (
    <div className="flex items-center bg-[#C1C0C0] rounded-2xl p-3 shadow-sm w-[50%] justify-between overflow-clip">
      <button
        onClick={decreaseQuantity}
        className="p-2 bg-gray-300 rounded-full hover:bg-stone-400 transition duration-200 active:scale-95 cursor-pointer"
      >
        <BiMinus className="size-4" />
      </button>
      <input
        ref={ref}
        type="text"
        value={localQuantity}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className="text-xl font-semibold text-center w-12 bg-transparent border-none outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        onKeyDown={handleKeyDown}
      />    
      <button
        onClick={increaseQuantity}
        className="p-2 bg-gray-300 rounded-full hover:bg-stone-400 transition duration-200 active:scale-95 cursor-pointer"
      >
        <BiPlus className="size-4" />
      </button>
    </div>
  );
});

export default QuantitySelector;