import "./App.css";
import React, { useState } from "react";
import ClientSearch from "./components/ClientSearch"


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
      <div className="col-span-2 row-start-2 bg-[#E1E4F1]">3</div>
      <div className="col-span-2 row-span-4 row-start-3 bg-[#E1E4F1]">4</div>
      <div className="row-span-2 col-start-3 row-start-3 bg-[#E1E4F1]">5</div>
      <div className="col-start-3 row-start-5 bg-[#E1E4F1]">6</div>
      <div className="col-start-3 row-start-6 bg-[#E1E4F1]">7</div>
    </div>
  );
}

export default App;
