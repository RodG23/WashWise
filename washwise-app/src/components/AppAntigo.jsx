import "../App.css";
import React, { useState } from "react";
import ClientSearch from "./ClientSearch"
import RefSearch from "./RefSearch"
import QuantitySelector from "./QuantitySelector";
import AddButton from "./AddButton";
import DynamicTable from "./DynamicTable";
import CheckboxSelector from "./CheckboxSelector";
import SaveButton from "./SaveButton"
import SavePrintButton from "./SavePrintButton"


function AppAntigo() {
  const [ref, setRef] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [items, setItems] = useState([]);
  const [clearInputTrigger, setClearInputTrigger] = useState(1);


  const getRef = (newRef) => {
    setRef(newRef);
  };

  const getQuantity = (newQuantity) => {
    setQuantity(newQuantity);
  };

  const addItem = () => {
    if (ref && quantity) {
      const newItem = { ref, quantity };
      setItems((prevItems) => [...prevItems, newItem]);
      console.log('Item adicionado:', newItem);
      setRef('');
      setQuantity("");
      setClearInputTrigger((prev) => prev + 1);
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };

  const deleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };
  
  return (
    <div className="h-full grid grid-cols-3 grid-rows-5">
      <div className="row-start-1 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Cliente:</p>
        </div>
        <ClientSearch/>
      </div>
      <div className="grid grid-cols-2 justify-start items-center col-span-2 row-start-1 bg-[#E1E4F1]">
        <div className="h-full ml-1 flex-col flex justify-center">
          <div className="flex w-[70%] text-3xl overflow-clip mt-3 mb-1">
            <p>Peça:</p>
          </div>
          <RefSearch clearInputTrigger={clearInputTrigger} onRefChange={getRef}/>
        </div>
        <div className="grid grid-cols-2 h-full ml-1 ">
          <div className="flex flex-col justify-center h-full items-start overflow-clip">
            <div className="text-3xl mt-3 mb-1 w-[50%] text-center">
              <p>Quantidade:</p>
            </div>
            <QuantitySelector clearInputTrigger={clearInputTrigger} onQuantityChange={getQuantity}/>
          </div>
          <div className="flex flex-col justify-center h-full items-start">
            <AddButton onClick={addItem}/>
          </div>
        </div>
      </div>
      <div className="col-span-2 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
        <DynamicTable items={items} onDelete={deleteItem}/>
      </div>
      <div className="row-span-2 col-start-3 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
        <CheckboxSelector/>
      </div>
      <div className="col-start-3 row-start-4 bg-[#E1E4F1] flex justify-center items-center">
        <SaveButton/>
      </div>
      <div className="col-start-3 row-start-5 bg-[#E1E4F1] flex justify-center items-start">
        <SavePrintButton/>
      </div>
    </div>
  );
}

export default AppAntigo;