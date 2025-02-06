import "./App.css";
import React, { useState } from "react";
import ClientSearch from "./components/ClientSearch"
import RefSearch from "./components/RefSearch"
import QuantitySelector from "./components/QuantitySelector";
import CustomButton from "./components/AddButton";
import DynamicTable from "./components/DynamicTable";


function App() {
  const [ref, setRef] = useState(""); // Estado para a referência
  const [quantity, setQuantity] = useState("1"); // Estado para a quantidade
  const [items, setItems] = useState([]);
  const [clearInputTrigger, setClearInputTrigger] = useState(false);

  // Função para atualizar a referência
  const getRef = (newRef) => {
    setRef(newRef); // Atualiza o estado da referência
  };

  const getQuantity = (newQuantity) => {
    setQuantity(newQuantity); // Atualiza o estado da quantidade
  };

  const addItem = () => {
    if (ref && quantity) {
      const newItem = { ref, quantity };
      setItems((prevItems) => [...prevItems, newItem]);
      console.log('Item adicionado:', newItem);
      // Limpa os campos após adicionar
      setRef('');
      setQuantity("");
      setClearInputTrigger((prev) => !prev);
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  };
  
  return (
    <div className="h-screen grid grid-cols-3 grid-rows-6 gap-4">
      <div className="col-span-3 bg-[#E1E4F1]">1</div>
      <div className="row-start-2 bg-[#E1E4F1] flex justify-start items-center flex-col w-full">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Cliente:</p>
        </div>
        <ClientSearch/>
      </div>
      <div className="grid grid-cols-2 justify-start items-center col-span-2 row-start-2 bg-[#E1E4F1]">
        <div className="h-full ml-1 flex-col">
          <div className="flex w-[70%] text-3xl overflow-clip mt-3 mb-1">
            <p>Peça:</p>
          </div>
          <RefSearch clearInputTrigger={clearInputTrigger} onRefChange={getRef}/>
        </div>
        <div className="grid grid-cols-2 h-full ml-1">
          <div className="flex flex-col justify-start h-full items-start overflow-clip">
            <div className="text-3xl mt-3 mb-1 w-[50%] text-center">
              <p>Quantidade:</p>
            </div>
            <QuantitySelector clearInputTrigger={clearInputTrigger} onQuantityChange={getQuantity}/>
          </div>
          <div className="flex flex-col justify-center h-full items-start">
            <CustomButton onClick={addItem}/>
          </div>
        </div>
      </div>
      <div className="col-span-2 row-span-4 row-start-3 bg-[#E1E4F1]">
        <h2 className="text-2xl mb-3">Itens Adicionados:</h2>
        <ul>
          {items.map((item, index) => (
            <li key={index} className="mb-2">
              {item.ref} - Quantidade: {item.quantity}
            </li>
          ))}
        </ul>
      </div>
      <div className="row-span-2 col-start-3 row-start-3 bg-[#E1E4F1]">5</div>
      <div className="col-start-3 row-start-5 bg-[#E1E4F1]">6</div>
      <div className="col-start-3 row-start-6 bg-[#E1E4F1]">7</div>
    </div>
  );
}

export default App;
