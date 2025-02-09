import React, { useState } from "react";
import { LuUsersRound } from "react-icons/lu";
import { TfiReceipt } from "react-icons/tfi";
import { GiClothesline } from "react-icons/gi";
import AppAntigo from "./AppAntigo"; // Importa o código antigo

const Tabs = () => {
  const [activeTab, setActiveTab] = useState("talão");

  const tabs = [
    { name: "Novo Talão", icon: <TfiReceipt size={30} />, id: "talão" },
    { name: "Clientes", icon: <LuUsersRound size={30} />, id: "clientes" },
    { name: "Peças", icon: <GiClothesline size={30}/>, id: "peças" },
  ];
  
    return (
      <div className="h-screen flex flex-col bg-[#E1E4F1]">
        {/* Tabs - 10% da altura */}
        <div className="h-[10%] flex bg-[#E1E4F1] text-2xl">
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
  
        {/* Conteúdo - 90% da altura */}
        <div className="h-[90%] bg-[#E1E4F1]">
          {activeTab === "clientes" && <div className="p-4">Clientes</div>}
          {activeTab === "talão" && <AppAntigo />}
          {activeTab === "peças" && <div className="p-4">Peças</div>}
        </div>
      </div>
    );
  };
  
  export default Tabs;
  