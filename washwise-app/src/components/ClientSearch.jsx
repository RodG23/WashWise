import React, { useState, useRef, useEffect } from "react";
import { BiSearchAlt } from "react-icons/bi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Passagem para app do nome e id de cliente
//Get de clientes sem number, não é necessário
const ClientSearch = ({ saveTrigger, onClientChange, refSearchRef }) => {
  const [result, setResult] = useState([]); //lista de pesquisa
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); //indice selecionado

  const inputRef = useRef(null); //refereencia para input
  const itemRefs = useRef([]); //lista de pesquisa mostrada
  const [debouncedTerm, setDebouncedTerm] = useState(input); // Termo de pesquisa com debounce
  const [isSelectingClient, setIsSelectingClient] = useState(false); // Flag para impedir nova pesquisa ao selecionar cliente por causa do debounce
  
  useEffect(() => {
    if (saveTrigger) {
      setInput("");
      setResult([]);
    }
  }, [saveTrigger]);

  // Usar o useEffect para debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(input); // Atualiza o termo com debounce
    }, 200); 

    return () => clearTimeout(timer); // Limpa o timer se searchTerm mudar antes de 500ms
  }, [input]);

  // Executa a pesquisa sempre que debouncedTerm mudar
  useEffect(() => {
    if (debouncedTerm && !isSelectingClient) {
      filterClients();
    } else {
      setResult([]);
    }
  }, [debouncedTerm]);

  //filtrar pesquisa
  const filterClients = () => {
    window.api.getClientesSearchName(debouncedTerm)
    .then((response) => {
        if (response.success) {
          const clientes = response.data;
          clientes.sort((a, b) => a.name.localeCompare(b.name));
          setResult(clientes);}})
    .catch((error) => {
      console.error("Erro ao procurar clientes:", error);
    });
  };

  const handleBlur = () => {
    if (result.length == 0) {
      toast.warn("Cliente não existe.", {
        position: "top-right",
        autoClose: 3000,
        className: "custom-warn-toast",
        progressClassName: "custom-warn-progress",
      });
      setInput("");
      onClientChange([]);
    }
  };

  // const handleFocus = () => {
  //   if(input && input !== "") {
  //     filterClients(input);
  //   }
  // };

  // Lida com mudança no input
  const handleChange = (value) => {
    setInput(value);
    setSelectedIndex(0);  // Resetar a seleção do item
    //filterClients forma antiga
    setIsSelectingClient(false); // Resetar o flag para permitir a pesquisa
  };

  //lida com clique na lisat de pesquisas
  const handleItemClick = (cli) => {
    setIsSelectingClient(true); // Impede que a pesquisa seja disparada
    setInput(cli.name);
    onClientChange({ name: cli.name, id: cli.id });
    setResult([]);
    //inputRef.current?.blur();
    refSearchRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setResult([]);
      inputRef.current.blur();
    }

    if (e.key === "Enter") {
      if (result.length !== 0) {
        handleItemClick(result[selectedIndex]);
      } else {
        toast.warn("Cliente não existe.", {
          position: "top-right",
          autoClose: 3000,
          className: "custom-warn-toast",
          progressClassName: "custom-warn-progress",
        });
        setInput("");
        onClientChange([]);
      }
    }

    if (result.length === 0) return;

    if (e.key === "ArrowDown") {
      setSelectedIndex((prevIndex) => {
        const newIndex = (prevIndex + 1) % result.length;
        scrollToItem(newIndex);
        return newIndex;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prevIndex) => {
        const newIndex = (prevIndex - 1 + result.length) % result.length;
        scrollToItem(newIndex);
        return newIndex;
      });
    }
  };

  const scrollToItem = (index) => {
    if (itemRefs.current[index]) {
      itemRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  return (
    <div className="relative w-[70%]">
      <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
        <BiSearchAlt className="size-6" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Procurar Cliente..."
          className="bg-transparent border-none outline-none text-xl ml-1 w-full"
          value={input}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          //onFocus={handleFocus}
        />
      </div>

      {result.length > 0 && (
        <div className="absolute top-full left-0 w-full bg-[#C1C0C0] flex flex-col items-center shadow-lg rounded-2xl mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
          {result.map((res, id) => {
            const isHighlighted = id === selectedIndex;
            return (
              <div
                key={id}
                ref={(el) => (itemRefs.current[id] = el)}
                className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                  hover:bg-stone-400 hover:rounded-2xl ${
                    isHighlighted ? "bg-stone-400 rounded-2xl" : ""
                  }`}
                onClick={() => handleItemClick(res)}
              >
                <span>
                  {res.name} {"("}
                </span>
                <span className="opacity-50">{res.address}</span>
                <span>{")"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientSearch;