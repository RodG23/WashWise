import React, { useState, useEffect } from "react";

const CheckboxSelector = ({ saveTrigger, onCheckboxChange }) => {
  const [selected, setSelected] = useState(""); //estado de seleçao 
  const [customDay, setCustomDay] = useState("");

  const options = ["2ª", "3ª", "4ª","5ª", "6ª", "Sº"];

  useEffect(() => {
      if (saveTrigger) {
        setSelected("");
        setCustomDay("");
      }
    }, [saveTrigger]);

  const handleClick = () => {
    if (selected === "Outro") {
      setSelected("");
      setCustomDay("");
      onCheckboxChange("");
    } else {
      handleChange("Outro");
    }
  };

  //A cada mudança muda estado do componente e passa para o pai
  const handleChange = (option) => {
    setSelected(option);
    if (option !== "Outro") {
      setCustomDay("");
      onCheckboxChange(option);
    } else {
      onCheckboxChange(customDay);
    }
  };

  const handleCustomInput = (e) => {
    const value = e.target.value;
    setCustomDay(value);
    onCheckboxChange(value); // passa para o pai sempre que o utilizador escreve
  };

  return (
    <div className="w-[90%] h-[80%] rounded-2xl bg-gray-200 flex flex-col">
      <div className="bg-[#D9D9D9] text-center font-normal text-3xl p-2 rounded-t-2xl w-full border-[#B8B8B8] border-b-4 pt-5 pb-5">
        Pronto
      </div>
      <div className="grid grid-cols-3 grid-rows-3 gap-2 bg-[#FFFFFF] h-full rounded-b-2xl items-center justify-center p-2">
        {options.map((option) => (
          <label
            key={option}
            className="flex items-center justify-center space-x-2 cursor-pointer text-2xl"
          >
            <span>{option}</span>
            <input
              type="checkbox"
              checked={selected === option}
              onChange={() => handleChange(option)}
              className="size-5 accent-[#928181] ring-1 ring-[#928181] rounded-2xl"
            />
          </label>
        ))}

        <div className="flex justify-center items-center"> 
          <button
          onClick={() => handleClick()}
          className={"w-min px-3 py-1 rounded-2xl overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 text-xl transition duration-200 active:scale-95  bg-[#C1C0C0]"}
        >
          Outro
        </button>
        </div>


        <div className="col-span-2 flex justify-center pr-10">
          {selected === "Outro" && (
            <input
              type="text"
              value={customDay}
              onChange={handleCustomInput}
              placeholder="Levantar em..."
              className="border border-[#928787] rounded-2xl px-2 py-1 text-xl w-full text-center outline-none"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckboxSelector;
