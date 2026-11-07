import React, { useState, useRef, useEffect, forwardRef } from "react";
import { BiSearchAlt } from "react-icons/bi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

//Passagem para app do nome e id de cliente
//searchType: "name" pesquisa por nome, "phone" por prefixo de telefone
const ClientSearch = forwardRef(({ saveTrigger, onClientChange, refSearchRef, searchType, noReceipt }, ref) => {
  const [result, setResult] = useState([]); //lista de pesquisa
  const [input, setInput] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0); //indice selecionado

  const itemRefs = useRef([]); //lista de pesquisa mostrada
  const [debouncedTerm, setDebouncedTerm] = useState(input); // Termo de pesquisa com debounce
  const [isSelectingClient, setIsSelectingClient] = useState(false); // Flag para impedir nova pesquisa ao selecionar cliente por causa do debounce

  useEffect(() => {
    if (saveTrigger) {
      setInput("");
      setResult([]);
    }
  }, [saveTrigger]);

  //mudar o modo de pesquisa limpa o campo e os resultados
  useEffect(() => {
    setInput("");
    setResult([]);
  }, [searchType]);

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
    if (searchType === "phone") {
      window.api.getClientesSearchNumber(debouncedTerm)
      .then((response) => {
          if (response.success) {
            const clientes = response.data;
            clientes.sort((a, b) => a.name.localeCompare(b.name));
            setResult(clientes);
          } else if (!response.success) {
            setResult([]);
          }})
      .catch((error) => {
        console.error("Erro ao procurar clientes por número:", error);
      });
    } else {
      window.api.getClientesSearchName(debouncedTerm)
      .then((response) => {
          if (response.success) {
            const clientes = response.data;
            clientes.sort((a, b) => a.name.localeCompare(b.name));
            setResult(clientes);
          } else if (!response.success) {
            setResult([]);
          }})
      .catch((error) => {
        console.error("Erro ao procurar clientes:", error);
      });
    }
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
    // no_receipt segue para cima: é o que marca o cliente na aba Novo Talão
    onClientChange({ name: cli.name, id: cli.id, no_receipt: !!cli.no_receipt });
    setResult([]);
    //inputRef.current?.blur();
    refSearchRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setResult([]);
      ref.current?.blur();
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
      {/* a própria caixa fica areia enquanto estiver escolhido um Sem Talão */}
      <div className={`rounded-2xl p-3 shadow-sm flex items-center ${noReceipt ? "bg-[#E0DAD1]" : "bg-[#C1C0C0]"}`}>
        <BiSearchAlt className="size-6" />
        <input
          ref={ref}
          type="text"
          placeholder={searchType === "phone" ? "Procurar Número..." : "Procurar Cliente..."}
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
                // areia marca os Sem Talão já na lista, para se ver antes de escolher.
                // Nestes o hover e o destaque do teclado usam um areia mais escuro
                // (#CDC3B5): mantém a cor da marca e continua a responder ao rato.
                className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                  hover:rounded-2xl ${
                    res.no_receipt
                      ? isHighlighted
                        ? "bg-[#CDC3B5] rounded-2xl hover:bg-[#CDC3B5]"
                        : "bg-[#E0DAD1] rounded-2xl hover:bg-[#CDC3B5]"
                      : isHighlighted
                      ? "bg-stone-400 rounded-2xl hover:bg-stone-400"
                      : "hover:bg-stone-400"
                  }`}
                onClick={() => handleItemClick(res)}
              >
                <span>
                  {res.name} {"("}
                </span>
                <span className="opacity-50">{searchType === "phone" ? res.number : res.address}</span>
                <span>{")"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default ClientSearch;