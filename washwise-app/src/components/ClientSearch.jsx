export function ClienSearch() {
    return (
        <div className="h-[100%] grid grid-cols-3 grid-rows-3 ">
          <label className=" col-start-2 flex items-end justify-baseline font-mono text-3xl">Cliente:</label>
          <input 
            type="text"
            className="row-start-2 col-span-2 col-start-2 mr-20 mt-1 px-5 py-3 text-lg rounded-2xl bg-stone-200 outline-none border-1 border-stone-300 focus:border-stone-500 focus:border-2"
            placeholder="Procurar Cliente..."
          />

          {/*Search result container*/}

        </div>
    )
}