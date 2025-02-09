import React, { useState } from "react";

const CheckboxSelector = () => {
  const [selected, setSelected] = useState("");

  const options = ["2ª", "3ª", "4ª", "5ª", "6ª", "Sº"];

  const handleChange = (option) => {
    setSelected(option);
  };

  return (
    <div className="w-[90%] h-[80%] rounded-2xl bg-gray-200 flex flex-col">
      <div className="bg-[#D9D9D9] text-center font-normal text-3xl p-2 rounded-t-2xl w-full border-[#B8B8B8] border-b-4 pt-5 pb-5">Pronto</div>
      <div className="grid grid-cols-3 gap-2 bg-[#FFFFFF] h-full rounded-b-2xl items-center justify-center">
        {options.map((option) => (
          <label key={option} className="flex items-center justify-center space-x-2 cursor-pointer text-2xl ">
            <span>{option}</span>
            <input
              type="checkbox"
              checked={selected === option}
              onChange={() => handleChange(option)}
              className="size-5 accent-[#928181] ring-1 ring-[#928181] rounded-2xl "
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default CheckboxSelector;
