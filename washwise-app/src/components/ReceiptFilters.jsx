import React, { useState, useRef, useEffect } from 'react';
import { BiSearchAlt } from "react-icons/bi";
import { IoIosArrowDropdown } from "react-icons/io";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Função para filtrar os clientes
const ReceiptFilters = ({ updateFilteredReceipts }) => {
  const [searchType, setSearchType] = useState("data"); // Tipo de filtro selecionado
  const [searchTypeState, setSearchTypeState] = useState("Todos"); // Tipo de filtro selecionado
  const [searchTerm, setSearchTerm] = useState(""); // Termo de pesquisa
  const [showOptions, setShowOptions] = useState(false); // Controla se as opções estão visíveis
  const [showOptionsState, setShowOptionsState] = useState(false); // Controla se as opções estão visíveis no filtro de estado
  const inputRef = useRef(null); // Ref para o campo de pesquisa
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm); // Termo de pesquisa com debounce
  const [startDate, setStartDate] = useState(""); // Data inicial
  const [endDate, setEndDate] = useState(""); // Data final
  const [clients, setClients] = useState([]); //Lista de resultados na pesquisa de cliente
  const [selectedIndex, setSelectedIndex] = useState(0); //indice selecionado na pesquisa de cliente
  const itemRefs = useRef([]); //lista de pesquisa mostrada
  const [isSelectingClient, setIsSelectingClient] = useState(false); // Flag para impedir nova pesquisa ao selecionar cliente por causa do debounce
  const [receiptsAllStates, setReceiptsAllStates] = useState([]);
  
  const handleStates = (receipts) => {
    if (searchTypeState === "Todos") {
      updateFilteredReceipts(receipts);
    } else {
      updateFilteredReceipts(receipts.filter(r => r.state === searchTypeState));
    }
  }

  useEffect(() => {
    handleStates(receiptsAllStates);
  }, [searchTypeState]); // Aplica o foco sempre que searchType mudar

  // Função para alternar entre as opções
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  const toggleOptionsState = () => {
    setShowOptionsState(!showOptionsState);
  };

  // Função para selecionar o tipo de pesquisa
  const handleOptionSelect = (option) => {
    setSearchType(option);
    setShowOptions(false);
    setSearchTerm("");
    inputRef.current?.focus();
    setReceiptsAllStates([]);
    updateFilteredReceipts([]);
    setClients([]);
    setInitialDates();
    setSearchTypeState("Todos");
  };

  const handleOptionSelectState = (option) => {
    setSearchTypeState(option);
    setShowOptionsState(false);
  };

  // Foco no input após mudança de searchType
  useEffect(() => {
    inputRef.current?.focus();
  }, [searchType]); // Aplica o foco sempre que searchType mudar

  // Função para realizar a pesquisa
  const handleSearch = () => {
    // Chama a função de busca de acordo com o tipo de pesquisa selecionado
    if (searchType === "id") {
      window.api.getReceiptById(debouncedTerm)
        .then((response) => {
          if(response.success) {
            const receipt = [response.receipt];
            receipt.forEach(setReceiptDate);
            updateFilteredReceipts(receipt);
          } else {
            toast.warn(response.message, {
            position: "top-right",
            autoClose: 3000,
            className: "custom-warn-toast",
            progressClassName: "custom-warn-progress",
            });
            updateFilteredReceipts([]);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar talão pelo id: ", error);
        });
    } else if (searchType === "cliente") {
      window.api.getClientesSearchName(debouncedTerm)
        .then((response) => {
          if(response.success) {
            const clients = response.data;
            clients.sort((a, b) => a.name.localeCompare(b.name));
            setClients(clients);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar clientes:", error);
        });
    }
  };

  // Função para lidar com o intervalo de datas
  const handleDateChange = () => {
    if (startDate && endDate) {
      window.api.getReceiptsByDate(startDate, endDate) 
        .then((response) => {
          if(response.success) {
            const receipts = response.receipts.reverse();
            receipts.forEach(setReceiptDate);
            setReceiptsAllStates(receipts);
            handleStates(receipts);
          } else {
              toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
            setReceiptsAllStates([]);
            updateFilteredReceipts([]);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar talões por data:", error);
        });
    }
  };

  const setReceiptDate = (receipt) => {
    const [datePart, hourPart] = receipt.created_at.split(" "); // separa a data da hora
    const [year, month, day] = datePart.split("-");
    receipt.table_date = `${day}-${month}-${year}`;
    receipt.table_hour = hourPart;
  }

  // Definir a data inicial e final para hoje
  const setInitialDates = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-PT').split('/').reverse().join('-');
    
    setStartDate(formattedDate);
    setEndDate(formattedDate);
  };


  // Usar o useEffect para debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm); // Atualiza o termo com debounce
    }, 200); 

    return () => clearTimeout(timer); // Limpa o timer se searchTerm mudar antes de 500ms
  }, [searchTerm]);

  // Executa a pesquisa sempre que debouncedTerm mudar
  useEffect(() => {
    if (debouncedTerm && !isSelectingClient) {
      handleSearch();
    } else {
      if(!debouncedTerm) {
        if(searchType === "cliente") {
        setClients([]);
        }
      setReceiptsAllStates([]);
      updateFilteredReceipts([]); 
      }
    }
  }, [debouncedTerm]);

  // Definir a data inicial no componente
  useEffect(() => {
    setInitialDates();
  }, []);


  const scrollToItem = (index) => {
    if (itemRefs.current[index]) {
      itemRefs.current[index].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  //lida com clique na lista de pesquisas
  const handleItemClick = (cli) => {
    setIsSelectingClient(true); // Impede que a pesquisa seja disparada
    setSearchTerm(cli.name);
    //onClientChange({ name: cli.name, id: cli.id });
    setClients([]);

    window.api.getReceiptsByClient(cli.id)
      .then((response) => {
        if(response.success) {
          const receipts = response.receipts.reverse();
          receipts.forEach(setReceiptDate);
          setReceiptsAllStates(receipts);
          handleStates(receipts);
        } else {
          toast.warn(response.message, {
            position: "top-right",
            autoClose: 3000,
            className: "custom-warn-toast",
            progressClassName: "custom-warn-progress",
          });
          setReceiptsAllStates([]);
          updateFilteredReceipts([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao procurar talão por cliente: ", error);
      });
  };

  const handleChange = (value) => {
    setSearchTerm(value);
    setSelectedIndex(0);  // Resetar a seleção do item
    setIsSelectingClient(false); // Resetar o flag para permitir a pesquisa
  };

  const handleKeyDown = (e) => {
    if (searchType === "cliente") {
      if (e.key === "Escape") {
        setClients([]);
        inputRef.current.blur();
      }
  
      if (e.key === "Enter") {
        if (clients.length !== 0) {
          handleItemClick(clients[selectedIndex]);
          inputRef.current.blur();
        } else {
          toast.warn("Cliente não existe.", {
            position: "top-right",
            autoClose: 3000,
            className: "custom-warn-toast",
            progressClassName: "custom-warn-progress",
          });
          setSearchTerm("");
          //onClientChange([]);
        }
      }
  
      if (clients.length === 0) return;
  
      if (e.key === "ArrowDown") {
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % clients.length;
          scrollToItem(newIndex);
          return newIndex;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          const newIndex = (prevIndex - 1 + clients.length) % clients.length;
          scrollToItem(newIndex);
          return newIndex;
        });
      }
    }
  };

  return (
  <div className='h-full w-full grid grid-cols-3'>
    {/* Lista de seleção do tipo de pesquisa */}
    <div className='row-start-1 bg-[#E1E4F1] flex justify-center items-center flex-col w-full'>
      <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
        <p>Filtrar por:</p>
      </div>
      <div className="row-start-1 relative w-[70%] cursor-pointer">
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center" onClick={toggleOptions}>
          <input
            type="text"
            placeholder={""}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full cursor-pointer"
            value={searchType === "data" ? "Intervalo de Datas" : searchType === "id" ? "Número de Talão" : "Nome de Cliente"}
            readOnly
          />
          <IoIosArrowDropdown className="size-6" />
        </div>

        {/* Lista de opções */}
        {showOptions && (
          <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto z-50">
            {["data", "id", "cliente"].map((option, index) => (
              <li
                key={index}
                className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                  hover:bg-stone-400 hover:rounded-2xl ${searchType === option ? "bg-stone-400 rounded-2xl" : ""}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span>{option === "data" ? "Intervalo de Datas" : option === "id" ? "Número de Talão" : "Nome de Cliente"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

    {/* Campo de Pesquisa */}
    {searchType === "data" && (
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Intervalo de Datas:</p>
        </div>
        <div className="flex space-x-4 w-[70%]">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm text-xl w-full"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm text-xl w-full"
          />
          <button
            onClick={handleDateChange}
            className="flex items-center bg-[#C1C0C0] rounded-2xl text-xl pl-1 pr-1 shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95"
          >
            Filtrar
          </button>
        </div>
      </div>
    )}

    {/* Campo de Pesquisa para ID ou Cliente */}
    {(searchType === "id" || searchType === "cliente") && (
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>{`${searchType === "id" ? "Número de Talão:" : "Nome de Cliente:"}`}</p>
        </div>
        <div className='relative w-[70%]'>
          <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
            <BiSearchAlt className="size-6" />
            <input
              ref={inputRef}
              type="text"
              name="searchTerm"
              value={searchTerm}
              onChange={(e) => handleChange(e.target.value)} // Atualiza o termo de pesquisa
              onKeyDown={handleKeyDown}
              placeholder={searchType === "id" ? "Procurar Talão..." : "Procurar Cliente..."}
              className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            />
          </div>
          {clients.length > 0 && (
          <div className=" absolute top-full left-0 w-full bg-[#C1C0C0] flex flex-col items-center shadow-lg rounded-2xl mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
            {clients.map((res, id) => {
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
      </div>
    )}

    {/* Terceira coluna: dropdown apenas se o tipo de pesquisa não for "id" */}
    {searchType !== "id" && (
      <div className="bg-[#E1E4F1] flex-col flex justify-center items-start col-start-3">
        <div className='row-start-1 bg-[#E1E4F1] flex justify-center items-start flex-col w-full'>
          <div className="flex w-[30%] text-3xl mt-3 mb-1 overflow-clip">
            <p>Estado:</p>
          </div>
          <div className="row-start-1 relative w-[30%] cursor-pointer">
            <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center" onClick={toggleOptionsState}>
              <input
                type="text"
                placeholder={""}
                className="bg-transparent border-none outline-none text-xl ml-1 w-full cursor-pointer"
                value={searchTypeState === "Todos" ? "Todos" : searchTypeState === "Pendente" ? "Pendente" : searchTypeState === "Pago" ? "Pago" : "Entregue"}
                readOnly
              />
              <IoIosArrowDropdown className="size-6" />
            </div>

            {/* Lista de opções */}
            {showOptionsState && (
              <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto z-50">
                {["Todos", "Pendente", "Pago", "Entregue"].map((option, index) => (
                  <li
                    key={index}
                    className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                      hover:bg-stone-400 hover:rounded-2xl ${searchTypeState === option ? "bg-stone-400 rounded-2xl" : ""}`}
                    onClick={() => handleOptionSelectState(option)}
                  >
                    <span>{option === "Todos" ? "Todos" : option === "Pendente" ? "Pendente" : option === "Pago" ? "Pago" : "Entregue"}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default ReceiptFilters;