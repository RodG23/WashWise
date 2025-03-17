import "./App.css";
import React, { useState, useRef } from "react";
import ClientSearch from "./components/ClientSearch"
import RefSearch from "./components/RefSearch"
import QuantitySelector from "./components/QuantitySelector";
import AddButton from "./components/AddButton";
import DynamicTable from "./components/DynamicTable";
import CheckboxSelector from "./components/CheckboxSelector";
import SaveButton from "./components/SaveButton"
import SavePrintButton from "./components/SavePrintButton"
import { LuUsersRound } from "react-icons/lu";
import { TfiReceipt } from "react-icons/tfi";
import { GiClothesline } from "react-icons/gi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//todo melhorar a passagem de informacao entre componentes, so o essencial.

function App() {
  const [activeTab, setActiveTab] = useState("talão");
  const [client, setClient] = useState([]);
  const [ref, setRef] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [checkbox, setCheckbox] = useState("");
  const [items, setItems] = useState([]);
  const [clearInputTrigger, setClearInputTrigger] = useState(1);
  const refSearchRef = useRef(null);
  const quantityInputRef = useRef(null);

  const tabs = [
    { name: "Novo Talão", icon: <TfiReceipt size={30} />, id: "talão" },
    { name: "Clientes", icon: <LuUsersRound size={30} />, id: "clientes" },
    { name: "Peças", icon: <GiClothesline size={30}/>, id: "peças" },
  ];


  const getRef = (newRef) => {
    setRef(newRef);
  };

  const getQuantity = (newQuantity) => {
    setQuantity(newQuantity);
  };

  const getClient = (newClient) => {
    setClient(newClient);
  }

  const getCheckbox = (newCheckbox) => {
    setCheckbox(newCheckbox);
  }

  const addItem = () => {
    if (ref && quantity) {
      const newItem = { ref, quantity };
      setItems((prevItems) => [...prevItems, newItem]);
      setRef("");
      setQuantity("1");
      setClearInputTrigger((prev) => prev + 1);
      refSearchRef.current?.focus();
    } else {
      toast.warn("Por favor, preencha todos os campos.", {
        position: "top-right",
        autoClose: 2000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
      });
    }
  };

  const deleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };
  
  return (
    <div className="bg-gray-50 w-screen h-screen">
      <div className="h-screen flex flex-col bg-[#E1E4F1]">
        <div className="h-[8%] flex bg-[#E1E4F1] text-2xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`flex flex-col flex-1 items-center justify-center ${
                activeTab === tab.id ? "bg-[#E1E4F1] font-medium border-b-2 border-l-1 border-r-1 border-[#AFAFAF]" : "bg-white border-l-1 border-r-1 border-[#D1D1D1]"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
        <div className="h-[90%] bg-[#E1E4F1]">
          {activeTab === "clientes" && <div className="p-4">Clientes</div>}
          {activeTab === "talão" && 
          <>
            <div className="h-full grid grid-cols-3 grid-rows-5">
            <div className="row-start-1 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
              <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
                <p>Cliente:</p>
              </div>
              <ClientSearch onClientChange={getClient} refSearchRef={refSearchRef}/>
            </div>
            <div className="grid grid-cols-2 justify-start items-center col-span-2 row-start-1 bg-[#E1E4F1]">
              <div className="h-full ml-1 flex-col flex justify-center">
                <div className="flex w-[70%] text-3xl overflow-clip mt-3 mb-1">
                  <p>Peça:</p>
                </div>
                <RefSearch clearInputTrigger={clearInputTrigger} onRefChange={getRef} ref={refSearchRef} quantityInputRef={quantityInputRef}/>
              </div>
              <div className="grid grid-cols-2 h-full ml-1 ">
                <div className="flex flex-col justify-center h-full items-start overflow-clip">
                  <div className="text-3xl mt-3 mb-1 w-[50%] text-center">
                    <p>Quantidade:</p>
                  </div>
                  <QuantitySelector clearInputTrigger={clearInputTrigger} onQuantityChange={getQuantity} refSearchRef={refSearchRef} onClick={addItem} ref={quantityInputRef}/>
                </div>
                <div className="flex flex-col justify-center h-full items-start mt-5">
                  <AddButton onClick={addItem}/>
                </div>
              </div>
            </div>
            <div className="col-span-2 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
              <DynamicTable items={items} onDelete={deleteItem}/>
            </div>
            <div className="row-span-2 col-start-3 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
              <CheckboxSelector onCheckboxChange={getCheckbox}/>
            </div>
            <div className="col-start-3 row-start-4 bg-[#E1E4F1] flex justify-center items-center">
              <SaveButton client={client} items={items} checkbox={checkbox}/>
            </div>
            <div className="col-start-3 row-start-5 bg-[#E1E4F1] flex justify-center items-start">
              <SavePrintButton client={client} items={items} checkbox={checkbox}/>
            </div>
          </div>
          </>}
          {activeTab === "peças" && <div className="p-4">Peças</div>}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>


    
  );
}

export default App;
