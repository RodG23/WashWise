import React from "react";

const ClientResult = ({ result, setInput, setResult}) => {

    const handleItemClick = (name) => {
        setInput(name);
        setResult([]);
    };
  
    return (
        <div className="bg-[#C1C0C0] w-[70%] flex flex-col items-center shadow-sm rounded-2xl mt-1 mb-2 max-h-[40%] overflow-y-scroll scrollbar-hidden px-3">
            {
                result.map((result, id) => {
                    return (
                        <div key={id} 
                            className="w-full flex justify-center border-b-1 border-[rgba(0,0,0,0.2)] text-xl mt-0.5 mb-0.5 cursor-pointer hover:bg-stone-400 hover:rounded-2xl"
                            onClick={() => handleItemClick(result.name)}
                        >
                            <span className="">{result.name}{' '}{"("}</span>
                            <span className="opacity-50">{result.address.city}</span>
                            <span>{")"}</span>
                        </div>
                    )
                })
            }
        </div>
    );
};

export default ClientResult;
