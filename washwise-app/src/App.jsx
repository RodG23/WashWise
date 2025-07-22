import "./App.css";
import React, { useState, useRef } from "react";

import ClientSearch from "./components/ClientSearch"
import RefSearch from "./components/RefSearch"
import QuantitySelector from "./components/QuantitySelector";
import AddButton from "./components/AddButton";
import DynamicTable from "./components/DynamicTable";
import CheckboxSelector from "./components/CheckboxSelector";
import SaveButton from "./components/SaveButton";
import SavePrintButton from "./components/SavePrintButton";

import ClientFilters from './components/ClientFilters';
import ClientTable from './components/ClientTable';
import ClientForm from './components/ClientForm';

import RefFilters from './components/RefFilters';
import RefTable from './components/RefTable';
import RefForm from './components/RefForm';

import ReceiptTable from './components/ReceiptTable';
import ReceiptFilters from './components/ReceiptFilters'
import ReceiptPreview from "./components/ReceiptPreview";

import { LuUsersRound } from "react-icons/lu";
import { TfiReceipt } from "react-icons/tfi";
import { LuBookType } from 'react-icons/lu';
import { GiClothesline } from "react-icons/gi";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function App() {
  //aba novo talao
  const [activeTab, setActiveTab] = useState("talão"); //Estado da Tab
  const [client, setClient] = useState([]); //Estado cliente selecionado
  const [ref, setRef] = useState(""); //Estado referencia peça
  const [quantity, setQuantity] = useState("1"); //Estado quantidade peça
  const [checkbox, setCheckbox] = useState(""); //Estado dia levantamento
  const [items, setItems] = useState([]); //Estado itens talão
  const [clearInputTrigger, setClearInputTrigger] = useState(1); //Atualizando limpa input
  const [saveTrigger, setSaveTrigger] = useState(1); //Atualizando limpa input
  const refSearchRef = useRef(null); //Ref para input de peça
  const quantityInputRef = useRef(null); //Ref para quantidade de peça

  //aba clientes
  const [filteredClients, setFilteredClients] = useState([]); // Estado para armazenar os clientes filtrados
  const [selectedClientEdit, setSelectedClientEdit] = useState(null); // Estado para guardar o cliente selecionado para editar

  //aba peças
  const [filteredRefs, setFilteredRefs] = useState([]); // Estado para armazenar as peças filtradas
  const [selectedRefEdit, setSelectedRefEdit] = useState(null); // Estado para guardar a peça selecionada para editar

  //aba talões
  const [filteredReceipts, setFilteredReceipts] = useState([]); // Estado para armazenar os talões filtrados
  const [selectedReceiptEdit, setSelectedReceiptEdit] = useState(null); // Estado para guardar o talão selecionado para editar



  const tabs = [
    { name: "Novo Talão", icon: <TfiReceipt size={30} />, id: "talão" },
    { name: "Talões", icon: <LuBookType size={30}/>, id: "talões" },
    { name: "Clientes", icon: <LuUsersRound size={30} />, id: "clientes" },
    { name: "Peças", icon: <GiClothesline size={30}/>, id: "peças" },
  ];

  //aba novo talao
  //atualiza ref peça
  const getRef = (newRef) => {
    setRef(newRef);
  };

  //atualiza quantidade
  const getQuantity = (newQuantity) => {
    setQuantity(newQuantity);
  };

  //atualiza cliente
  const getClient = (newClient) => {
    //console.log(newClient);
    setClient(newClient);
  }

  //atualiza dia levant
  const getCheckbox = (newCheckbox) => {
    setCheckbox(newCheckbox);
  }

  const getNote = (index, note) => {
    setItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], note };
      return updatedItems;
    });
  };
  
  //adiciona item talao
  const addItem = () => {
    if (ref && quantity) {
      const newItem = { ...ref, quantity };
      setItems((prevItems) => [...prevItems, newItem]);
      setRef("");
      setQuantity("1");
      setClearInputTrigger((prev) => prev + 1); //Provoca a limpeza do input da peça
      refSearchRef.current?.focus();
    } else {
      toast.warn("Por favor, indique a peça que pretende adicionar.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
        toastId: "alerta-peça"
      });
    }
  };

  const saveReceipt = () => {
    setSaveTrigger((prev) => prev + 1);
    setClient([]);
    setCheckbox("");
    setItems([]);
  }

  //retira item talao
  const deleteItem = (index) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };



  //aba clientes
  // Função para atualizar os clientes filtrados no clientfilters
  const updateFilteredClients = (clients) => {
    setFilteredClients(clients);
  };

  const handleNewClient = () => {
  setSelectedClientEdit(null); // Limpa o cliente selecionado, indo para o estado de "Novo Cliente"
  };

  const handleClientSelectForEdit = (client) => {
    // Se o cliente for clicado e já estiver selecionado, desmarca a seleção
    if (selectedClientEdit && selectedClientEdit.id === client.id) {
      handleNewClient();
    } else {
      // Seleciona o novo cliente para edição
      setSelectedClientEdit(client);
    }
  };


  //aba peças
  // Função para atualizar as peças filtradas no refFilters
  const updateFilteredRefs = (refs) => {
    setFilteredRefs(refs);
  };

  const handleNewRef = () => {
  setSelectedRefEdit(null); // Limpa a peça selecionada, indo para o estado de "Nova Peça"
  };

  const handleRefSelectForEdit = (refSelected) => {
    // Se a peça for clicada e já estiver selecionada, desmarca a seleção
    if (selectedRefEdit && selectedRefEdit.ref === refSelected.ref) {
      handleNewRef();
    } else {
      // Seleciona a nova peça para edição
      setSelectedRefEdit(refSelected);
    }
  };

  //aba talões
  // Função para atualizar os talões filtrados
  const updateFilteredReceipts = (receipts) => {
    setFilteredReceipts(receipts);
  };

  const handleNewReceipt = () => {
  setSelectedReceiptEdit(null); // Limpa o talão selecionado, indo para o estado de "Novo Talão" - neste caso não se vai criar, mas tem comportamento análogo, deixa de estar um talão selecionado
  };

  const handleReceiptSelectForEdit = (receiptSelected) => {
    // Se a peça for clicada e já estiver selecionada, desmarca a seleção
    if (selectedReceiptEdit && selectedReceiptEdit.id === receiptSelected.id) {
      handleNewReceipt();
    } else {
      // Seleciona a nova peça para edição
      setSelectedReceiptEdit(receiptSelected);
    }
  };
  
  //app
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
          {activeTab === "clientes" && 
          <>
            <div className="h-full grid grid-cols-3 grid-rows-5">
            <div className="row-start-1 col-span-3 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
              <ClientFilters updateFilteredClients={updateFilteredClients}/>
            </div>
            <div className="col-span-2 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
              <ClientTable filteredClients={filteredClients} updateFilteredClients={updateFilteredClients} selectedClientId={selectedClientEdit?.id} onClientSelect={handleClientSelectForEdit}/>
            </div>
            <div className="col-start-3 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center overflow-clip">
              <ClientForm selectedClientEdit={selectedClientEdit} isEditing={selectedClientEdit !== null} handleNewClient={handleNewClient} updateFilteredClients={updateFilteredClients} activeTab={activeTab}/>
            </div>
            </div>
          </>}
          {activeTab === "talão" && 
          <>
            <div className="h-full grid grid-cols-3 grid-rows-5">
            <div className="row-start-1 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
              <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
                <p>Cliente:</p>
              </div>
              <ClientSearch saveTrigger={saveTrigger} onClientChange={getClient} refSearchRef={refSearchRef}/>
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
              <DynamicTable items={items} onDelete={deleteItem} onNoteChange={getNote} activeTab={activeTab} setItems={setItems} saveTrigger={saveTrigger}/>
            </div>
            <div className="row-span-2 col-start-3 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
              <CheckboxSelector saveTrigger={saveTrigger} onCheckboxChange={getCheckbox}/>
            </div>
            <div className="col-start-3 row-start-4 bg-[#E1E4F1] flex justify-center items-center">
              <SaveButton onSave={saveReceipt} client={client} items={items} checkbox={checkbox}/>
            </div>
            <div className="col-start-3 row-start-5 bg-[#E1E4F1] flex justify-center items-start">
              <SavePrintButton onSave={saveReceipt} client={client} items={items} checkbox={checkbox}/>
            </div>
          </div>
          </>}
          {activeTab === "talões" && 
          <>
            <div className="h-full grid grid-cols-6 grid-rows-5">
              <div className="row-start-1 col-span-6 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
                <ReceiptFilters updateFilteredReceipts={updateFilteredReceipts}/>
              </div>
              <div className="col-span-3 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center pl-[10%]">
                <ReceiptTable filteredReceipts={filteredReceipts} updateFilteredReceipts={updateFilteredReceipts} selectedReceiptId={selectedReceiptEdit?.id} onReceiptSelect={handleReceiptSelectForEdit}/>
              </div>
              <div className="col-span-3 col-start-4 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center pl-[10%] pr-[10%]">
                <ReceiptPreview/>
              </div>
          </div>
          </>}
          {activeTab === "peças" && 
          <>
            <div className="h-full grid grid-cols-3 grid-rows-5">
            <div className="row-start-1 col-span-3 bg-[#E1E4F1] flex justify-center items-center flex-col w-full">
              <RefFilters updateFilteredRefs={updateFilteredRefs}/>
            </div>
            <div className="col-span-2 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center">
              <RefTable filteredRefs={filteredRefs} updateFilteredRefs={updateFilteredRefs} selectedRefId={selectedRefEdit?.ref} onRefSelect={handleRefSelectForEdit}/>
            </div>
            <div className="col-start-3 row-span-4 row-start-2 bg-[#E1E4F1] flex items-center justify-center overflow-clip">
              <RefForm selectedRefEdit={selectedRefEdit} isEditing={selectedRefEdit !== null} handleNewRef={handleNewRef} updateFilteredRefs={updateFilteredRefs} activeTab={activeTab}/>
            </div>
            </div>
          </>}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>


    
  );
}

export default App;
