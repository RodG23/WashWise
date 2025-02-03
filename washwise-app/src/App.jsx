import "./App.css";
import React, { useState } from "react";
import ClientSearch from "./components/ClientSearch"
import RefSearch from "./components/RefSearch"
import QuantitySelector from "./components/QuantitySelector";


function App() {
  
  return (
    <div className="h-screen grid grid-cols-3 grid-rows-6 gap-4">
      <div className="col-span-3 bg-[#E1E4F1]">1</div>
      <div className="row-start-2 bg-[#E1E4F1] flex justify-top items-center flex-col w-full">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Cliente:</p>
        </div>
        <ClientSearch/>
      </div>
      <div className="grid grid-cols-2 justify-top items-center col-span-2 row-start-2 bg-[#E1E4F1]">
        <div className="h-full ml-1 flex-col">
          <div className="flex w-[70%] text-3xl overflow-clip mt-3 mb-1">
            <p>Peça:</p>
          </div>
          <RefSearch/>
        </div>
        <div className="grid grid-cols-2 h-full ml-1">
          <div className="flex flex-col justify-top h-full items-center">
            <div className="flex text-3xl overflow-clip mt-3 mb-1">
              <p>Quantidade:</p>
            </div>
            <QuantitySelector/>
          </div>
          <div className="flex items-center justify-center">
            Ola
          </div>
        </div>
      </div>
      <div className="col-span-2 row-span-4 row-start-3 bg-[#E1E4F1]">4</div>
      <div className="row-span-2 col-start-3 row-start-3 bg-[#E1E4F1]">5</div>
      <div className="col-start-3 row-start-5 bg-[#E1E4F1]">6</div>
      <div className="col-start-3 row-start-6 bg-[#E1E4F1]">7</div>
    </div>
  );
}

export default App;
