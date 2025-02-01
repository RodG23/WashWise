import "./App.css";
import React, { useState } from "react";
import { ClienSearch } from "./components/ClientSearch";


function App() {
  return (
    <div className="h-screen grid grid-cols-3 grid-rows-6 gap-4">
      <div className="col-span-3 bg-indigo-100">1</div>
      <div className="row-start-2 bg-indigo-100">
        <ClienSearch/>
      </div>
      <div className="col-span-2 row-start-2 bg-indigo-100">3</div>
      <div className="col-span-2 row-span-4 row-start-3 bg-indigo-100">4</div>
      <div className="row-span-2 col-start-3 row-start-3 bg-indigo-100">5</div>
      <div className="col-start-3 row-start-5 bg-indigo-100">6</div>
      <div className="col-start-3 row-start-6 bg-indigo-100">7</div>
    </div>
  );
}

export default App;
