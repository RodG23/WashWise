import React, { useState, useEffect } from "react";
//Passaram para src/utils/datas.js quando o preview e o talão impresso
//precisaram das mesmas funções. O comportamento aqui não mudou.
import { textoDaData, hojeISO, somaDias } from "../utils/datas";

const CheckboxSelector = ({ saveTrigger, onCheckboxChange }) => {
  const [selected, setSelected] = useState(""); //estado de seleçao
  const [customDate, setCustomDate] = useState(""); //data escolhida no calendário (AAAA-MM-DD)
  const [modifier, setModifier] = useState(""); //"Fim do dia" | "Sem falta" | ""

  const options = ["2ª", "3ª", "4ª","5ª", "6ª", "Sº"];
  const modifiers = ["Fim do dia", "Sem falta"];
  //cores próprias de cada modificador: claro quando inativo, vivo quando selecionado
  const modifierColors = {
    "Fim do dia": {
      off: "bg-amber-100 hover:bg-amber-200 border-[#928787]",
      on: "bg-amber-400 hover:bg-amber-500 border-amber-700 font-semibold",
    },
    "Sem falta": {
      off: "bg-rose-100 hover:bg-rose-200 border-[#928787]",
      on: "bg-rose-500 text-white hover:bg-rose-600 border-rose-800 font-semibold",
    },
  };

  useEffect(() => {
      if (saveTrigger) {
        setSelected("");
        setCustomDate("");
        setModifier("");
      }
    }, [saveTrigger]);

  //junta dia + modificador no texto passado ao pai
  const composeValue = (day, mod) => (mod ? `${day} (${mod})` : day);

  const handleClick = () => {
    if (selected === "Outro") {
      setSelected("");
      setCustomDate("");
      onCheckboxChange("", null);
    } else {
      handleChange("Outro");
    }
  };

  //A cada mudança muda estado do componente e passa para o pai.
  //2º argumento: a data real de entrega. Nos dias da semana vai null — quem a
  //calcula é o main.js, que sabe em que dia é que o talão está a ser feito.
  const handleChange = (option) => {
    setSelected(option);
    if (option !== "Outro") {
      setCustomDate("");
      onCheckboxChange(composeValue(option, modifier), null);
    } else {
      setModifier("");
      onCheckboxChange(textoDaData(customDate), customDate || null);
    }
  };

  //seleciona/desseleciona modificador (mutuamente exclusivos)
  const handleModifier = (mod) => {
    const next = modifier === mod ? "" : mod;
    setModifier(next);
    if (selected && selected !== "Outro") {
      onCheckboxChange(composeValue(selected, next), null);
    }
  };

  //calendário: guarda a data real e manda para cima o texto curto ("15 Set")
  const handleDate = (iso) => {
    setCustomDate(iso);
    onCheckboxChange(textoDaData(iso), iso || null);
  };

  //+7: clicável várias vezes. Sem data escolhida, parte de hoje.
  const addWeek = () => handleDate(somaDias(customDate || hojeISO(), 7));

  //clicar em qualquer ponto da caixa abre o calendário, não só no ícone
  const abrirCalendario = (e) => {
    try { e.currentTarget.showPicker?.(); } catch { /* sem gesto do utilizador */ }
  };

  //a data só se escolhe no calendário: teclado bloqueado, menos o Tab (para não
  //prender a navegação) e o Escape (para fechar o calendário)
  const bloquearTeclado = (e) => {
    if (e.key !== "Tab" && e.key !== "Escape") e.preventDefault();
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


        {selected === "Outro" ? (
          <div className="col-span-2 flex justify-center items-center gap-2 pr-10">
            <input
              type="date"
              value={customDate}
              min={hojeISO()}
              onChange={(e) => handleDate(e.target.value)}
              onClick={abrirCalendario}
              onKeyDown={bloquearTeclado}
              className="border border-[#928787] rounded-2xl px-2 py-1 text-xl w-full text-center outline-none bg-white cursor-pointer"
            />
            <button
              onClick={addWeek}
              title="Somar 7 dias (pode clicar várias vezes)"
              className="px-3 py-1 rounded-2xl whitespace-nowrap cursor-pointer border-2 border-[#928787] bg-[#C1C0C0] hover:bg-stone-400 text-xl transition duration-200 active:scale-95"
            >
              +7
            </button>
          </div>
        ) : (
          modifiers.map((mod) => (
            <div key={mod} className="flex justify-center items-center">
              <button
                onClick={() => handleModifier(mod)}
                className={`px-3 py-1 rounded-2xl overflow-clip whitespace-nowrap cursor-pointer border-2 text-xl transition duration-200 active:scale-95 ${
                  modifier === mod ? modifierColors[mod].on : modifierColors[mod].off
                }`}
              >
                {mod}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CheckboxSelector;
