import React, { useState } from "react";
import { FaReceipt, FaUsers, FaTshirt } from "react-icons/fa";

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("talão");

  const tabs = [
    { id: "talão", label: "Novo Talão", icon: <FaReceipt size={24} /> },
    { id: "clientes", label: "Clientes", icon: <FaUsers size={24} /> },
    { id: "peças", label: "Peças", icon: <FaTshirt size={24} /> },
  ];

  return (
    <div className="h-screen flex flex-col w-full">
      {/* Abas superiores (20% da altura) */}
      <div className="h-[10%] w-full flex border-b border-gray-300 bg-white shadow-md fixed top-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center transition-all duration-200 border-b-4 ${
              activeTab === tab.id
                ? "border-purple-500 bg-gray-200"
                : "border-transparent hover:bg-gray-100"
            }`}
          >
            {tab.icon}
            <span className="text-sm mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo abaixo das abas (80% da altura) */}
      <div className="h-[80%] mt-[10%] p-4 bg-gray-100">
        {activeTab === "talão" && <p>Conteúdo da aba Novo Talão</p>}
        {activeTab === "clientes" && <p>Lista de Clientes</p>}
        {activeTab === "peças" && <p>Gestão de Peças</p>}
      </div>
    </div>
  );
};

export default Tabs;
