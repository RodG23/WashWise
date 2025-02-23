import React from "react";

const AddButton = ({ onClick }) => {
  return (
    <button onClick={onClick} className="flex items-center bg-[#C1C0C0] rounded-2xl p-5 shadow-sm w-[50%] justify-center overflow-clip cursor-pointer border-3 border-[#928787] hover:bg-stone-400 text-3xl transition duration-200 active:scale-95">
      Adicionar
    </button>
  );
};

export default AddButton;