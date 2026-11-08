import React, { useState, useRef, useEffect } from 'react';
import { BiSearchAlt } from "react-icons/bi";
import { IoIosArrowDropdown } from "react-icons/io";
import { TfiWrite } from "react-icons/tfi";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Nome de cada modalidade de pesquisa. Ficam aqui em vez de em cadeias de
// ternarios: eram duas, e acrescentar uma modalidade obrigava a mexer nas duas.
const SEARCH_LABELS = {
  data: "Intervalo de Datas",
  id: "Número de Talão",
  cliente: "Nome de Cliente",
  telefone: "Número de Telefone",
  ano: "Ano",
  entrega: "Data de Levantamento",
};

// hoje em AAAA-MM-DD, em hora local (toISOString passaria por UTC)
const hojeISO = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + mm + "-" + dd;
};

// Função para filtrar os clientes
const ReceiptFilters = ({ updateFilteredReceipts, onReceiptSelect, onCustomPrint, registerRefresh, registerApplyChange }) => {
  const [searchType, setSearchType] = useState("data"); // Tipo de filtro selecionado
  const [searchTypeState, setSearchTypeState] = useState("Todos"); // Tipo de filtro selecionado
  const [searchTerm, setSearchTerm] = useState(""); // Termo de pesquisa
  const [showOptions, setShowOptions] = useState(false); // Controla se as opções estão visíveis
  const [showOptionsState, setShowOptionsState] = useState(false); // Controla se as opções estão visíveis no filtro de estado
  const [searchTypeMarked, setSearchTypeMarked] = useState("Todos"); // Filtro de marcação selecionado
  const [showOptionsMarked, setShowOptionsMarked] = useState(false); // Controla se as opções estão visíveis no filtro de marcação
  const inputRef = useRef(null); // Ref para o campo de pesquisa
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm); // Termo de pesquisa com debounce
  const [startDate, setStartDate] = useState(""); // Data inicial
  const [endDate, setEndDate] = useState(""); // Data final
  const [clients, setClients] = useState([]); //Lista de resultados na pesquisa de cliente
  const [selectedIndex, setSelectedIndex] = useState(0); //indice selecionado na pesquisa de cliente
  const itemRefs = useRef([]); //lista de pesquisa mostrada
  const [isSelectingClient, setIsSelectingClient] = useState(false); // Flag para impedir nova pesquisa ao selecionar cliente por causa do debounce
  const [receiptsAllStates, setReceiptsAllStates] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null); // Cliente escolhido, para poder repetir a pesquisa
  const [deliveryDate, setDeliveryDate] = useState(hojeISO()); // Dia escolhido no filtro "Data de Levantamento"

  // Numeração anual: anos com talões, carregados da BD (ano atual sempre presente)
  const currentYearNum = new Date().getFullYear();
  const [years, setYears] = useState([currentYearNum]);
  const [searchYear, setSearchYear] = useState(currentYearNum); // Ano selecionado na pesquisa
  const [showOptionsYear, setShowOptionsYear] = useState(false); // Controla dropdown de ano

  useEffect(() => {
    window.api.getReceiptYears().then((response) => {
      if (response.success) {
        const list = response.years.map(Number);
        if (!list.includes(currentYearNum)) list.unshift(currentYearNum);
        setYears(list);
      }
    }).catch(() => {});
  }, []);
  
  const handleStates = (receipts) => {
    let list = receipts;
    if (searchTypeState !== "Todos") {
      list = list.filter(r => r.state === searchTypeState);
    }
    if (searchTypeMarked !== "Todos") {
      list = list.filter(r => (searchTypeMarked === "Marcado" ? !!r.marked : !r.marked));
    }
    updateFilteredReceipts(list);
  }

  useEffect(() => {
    handleStates(receiptsAllStates);
  }, [searchTypeState, searchTypeMarked]); // Reaplica os filtros em memória sempre que mudam

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
    const hoje = setInitialDates();
    setSearchTypeState("Todos");
    setSearchTypeMarked("Todos");
    setSelectedClientId(null);
    setSearchYear(currentYearNum);
    const hojeDia = hojeISO();
    setDeliveryDate(hojeDia);
    if (option === "ano") searchByYear(currentYearNum);
    // Escolher uma destas modalidades procura logo o dia de hoje, como já fazia o
    // "ano". Em silêncio: quem não pediu a pesquisa não leva com o aviso se ela
    // falhar nem com o "nenhum talão" de um dia sem entregas.
    if (option === "data") handleDateChange(hoje, hoje, true);
    if (option === "entrega") searchByDeliveryDate(hojeDia, true);
  };

  // Pesquisa todos os talões de um ano (reutiliza a pesquisa por datas)
  const searchByYear = (y) => {
    return window.api.getReceiptsByDate(`${y}-01-01`, `${y}-12-31`)
      .then((response) => {
        if (response.success) {
          const receipts = response.receipts.reverse(); //SQLite devolve por id crescente
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
        console.error("Erro ao procurar talões por ano:", error);
      });
  };

  // Todos os talões a levantar num dia de calendário.
  // Nunca corre ao mudar a data: só no botão "Filtrar" ou ao escolher a
  // modalidade, e nesse caso em silêncio (ver handleOptionSelect).
  const searchByDeliveryDate = (dia, silencioso = false) => {
    if (!dia) {
      if (!silencioso) {
        toast.warn("Escolha um dia.", {
          position: "top-right",
          autoClose: 3000,
          className: "custom-warn-toast",
          progressClassName: "custom-warn-progress",
          toastId: "alerta-dia-levantamento",
        });
      }
      return;
    }
    return window.api.getReceiptsByDeliveryDate(dia)
      .then((response) => {
        if (response.success) {
          const receipts = response.receipts.reverse(); //SQLite devolve por id crescente
          // a rota devolve lista vazia (não 404) para um dia sem entregas;
          // o aviso é dado aqui, como nas outras pesquisas
          if (receipts.length === 0 && !silencioso) {
            toast.warn("Nenhum talão para levantar neste dia.", {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
              toastId: "sem-taloes-levantamento",
            });
          }
          receipts.forEach(setReceiptDate);
          setReceiptsAllStates(receipts);
          handleStates(receipts);
        } else {
          if (!silencioso) {
            toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
          }
          setReceiptsAllStates([]);
          updateFilteredReceipts([]);
        }
      })
      .catch((error) => {
        console.error("Erro ao procurar talões por dia de entrega:", error);
      });
  };

  // Seleção de ano no dropdown
  const handleYearSelect = (y) => {
    setSearchYear(y);
    setShowOptionsYear(false);
    if (searchType === "ano") {
      searchByYear(y);
    } else if (searchType === "id" && debouncedTerm) {
      handleSearch(y);
    }
  };

  const handleOptionSelectState = (option) => {
    setSearchTypeState(option);
    setShowOptionsState(false);
  };

  const toggleOptionsMarked = () => {
    setShowOptionsMarked(!showOptionsMarked);
  };

  const handleOptionSelectMarked = (option) => {
    setSearchTypeMarked(option);
    setShowOptionsMarked(false);
  };

  // Foco no input após mudança de searchType
  useEffect(() => {
    inputRef.current?.focus();
  }, [searchType]); // Aplica o foco sempre que searchType mudar

  // Função para realizar a pesquisa
  const handleSearch = (yr = searchYear) => {
    // Chama a função de busca de acordo com o tipo de pesquisa selecionado
    if (searchType === "id") {
      return window.api.getReceiptByYearNumber(debouncedTerm, yr)
        .then((response) => {
          if(response.success) {
            const receipt = response.receipt;
            setReceiptDate(receipt);
            updateFilteredReceipts([receipt]);
            onReceiptSelect(receipt);

          } else {
            toast.warn(response.message, {
            position: "top-right",
            autoClose: 3000,
            className: "custom-warn-toast",
            progressClassName: "custom-warn-progress",
            toastId: "talao-nao-encontrado",
            });
            updateFilteredReceipts([]);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar talão pelo id: ", error);
        });
    } else if (searchType === "cliente") {
      return window.api.getClientesSearchName(debouncedTerm)
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
    } else if (searchType === "telefone") {
      // Como a pesquisa por nome: a lista é de clientes (por prefixo do número)
      // e escolher um traz os talões desse cliente. Ver handleItemClick.
      // Sem mínimo de caracteres, como no Novo Talão: o antigo `length < 9`
      // deixava de fora os números estrangeiros e os clientes sem número.
      return window.api.getClientesSearchNumber(debouncedTerm)
        .then((response) => {
          if (response.success) {
            const clientes = response.data;
            clientes.sort((a, b) => a.name.localeCompare(b.name));
            setClients(clientes);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar clientes pelo número:", error);
        });
    }
  };

  // Função para lidar com o intervalo de datas.
  // As datas vêm por argumento (como o `yr` do handleSearch) para a pesquisa
  // automática as poder passar sem esperar pelo setState, que é assíncrono.
  // `silencioso` cala o aviso: a pesquisa que ninguém pediu falha sem incomodar.
  const handleDateChange = (ini = startDate, fim = endDate, silencioso = false) => {
    if (ini && fim) {
      return window.api.getReceiptsByDate(ini, fim)
        .then((response) => {
          if(response.success) {
            const receipts = response.receipts.reverse(); //SQLite devolve por id crescente
            receipts.forEach(setReceiptDate);
            setReceiptsAllStates(receipts);
            handleStates(receipts);
          } else {
            if (!silencioso) {
              toast.warn(response.message, {
              position: "top-right",
              autoClose: 3000,
              className: "custom-warn-toast",
              progressClassName: "custom-warn-progress",
            });
            }
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
    const [datePart, timePart] = receipt.created_at.split(" "); // separa a data da hora
    const [year, month, day] = datePart.split("-");

    receipt.table_date = `${day}-${month}-${year}`;
    receipt.table_hour = timePart;
  }

  // Definir a data inicial e final para hoje
  const setInitialDates = () => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('pt-PT').split('/').reverse().join('-');
    
    setStartDate(formattedDate);
    setEndDate(formattedDate);
    return formattedDate; // devolvida para quem precisa dela já, sem esperar pelo setState
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
        if(searchType === "cliente" || searchType === "telefone") {
        setClients([]);
        }
      setReceiptsAllStates([]);
      updateFilteredReceipts([]); 
      }
    }
  }, [debouncedTerm]);

  // Definir a data inicial no componente
  // O App desmonta este componente ao sair da aba Talões, por isso a montagem é
  // a entrada na aba: é aqui que se procura o dia de hoje sem carregar no Filtrar.
  useEffect(() => {
    const hoje = setInitialDates();
    handleDateChange(hoje, hoje, true);
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
    setSelectedClientId(cli.id);

    return window.api.getReceiptsByClient(cli.id)
      .then((response) => {
        if(response.success) {
          const receipts = response.receipts.reverse(); //SQLite devolve por id crescente
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

  // Repete a pesquisa que está feita, sem mexer nos parâmetros.
  // Usado pelo botão de refresh no cabeçalho da tabela: traz dados frescos do
  // servidor (marcação, estado, preço, talões apagados noutro posto) e reaplica
  // os filtros de Estado/Marcação, que são feitos em memória.
  const refreshSearch = () => {
    if (searchType === "data") {
      return handleDateChange();
    }
    if (searchType === "ano") {
      return searchByYear(searchYear);
    }
    if (searchType === "entrega") {
      return deliveryDate ? searchByDeliveryDate(deliveryDate) : undefined;
    }
    if (searchType === "cliente" || searchType === "telefone") {
      return selectedClientId ? handleItemClick({ id: selectedClientId, name: searchTerm }) : undefined;
    }
    return debouncedTerm ? handleSearch() : undefined;
  };

  // O botão vive na tabela, a pesquisa vive aqui: o App guarda a ponte numa ref.
  // Sem lista de dependências, para a função registada apanhar sempre o estado atual.
  useEffect(() => {
    if (registerRefresh) registerRefresh.current = refreshSearch;
  });

  // Segunda ponte, pelo mesmo motivo: marcar, apagar ou guardar acontece na tabela
  // e no preview, mas a lista de onde os filtros partem é esta. Sem isto, mexer
  // num filtro a seguir reconstruía a tabela a partir de dados já antigos.
  // Só atualiza a fonte; os filtros só se reaplicam quando o utilizador os mexe.
  useEffect(() => {
    if (registerApplyChange) {
      registerApplyChange.current = (updater) => setReceiptsAllStates(updater);
    }
  });

  const handleChange = (value) => {
    setSearchTerm(value);
    setSelectedIndex(0);  // Resetar a seleção do item
    setIsSelectingClient(false); // Resetar o flag para permitir a pesquisa
  };

  const handleKeyDown = (e) => {
    if (searchType === "cliente" || searchType === "telefone") {
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

  const handleBlur = () => {
    setTimeout(() => setShowOptions(false), 200);
  };

  // Dropdown de ano (usado na pesquisa por número e na pesquisa por ano)
  const yearSelector = (widthClass) => (
    <div
      className={`relative ${widthClass} cursor-pointer`}
      tabIndex={0}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setShowOptionsYear(false);
        }
      }}
    >
      <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center" onClick={() => setShowOptionsYear(!showOptionsYear)}>
        <input
          type="text"
          className="bg-transparent border-none outline-none text-xl ml-1 w-full cursor-pointer"
          value={searchYear}
          readOnly
        />
        <IoIosArrowDropdown className="size-6" />
      </div>
      {showOptionsYear && (
        <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
          {years.map((y) => (
            <li
              key={y}
              tabIndex={0}
              className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                hover:bg-stone-400 hover:rounded-2xl ${searchYear === y ? "bg-stone-400 rounded-2xl" : ""}`}
              onClick={() => handleYearSelect(y)}
            >
              <span>{y}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
  <div className='h-full w-full grid grid-cols-3'>
    {/* Lista de seleção do tipo de pesquisa */}
    <div className='row-start-1 bg-[#E1E4F1] flex justify-center items-center flex-col w-full'>
      <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
        <p>Filtrar por:</p>
      </div>
      <div className="row-start-1 relative w-[70%] cursor-pointer"
          tabIndex={0}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setShowOptions(false);
            }
          }}
        >
        <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center" onClick={toggleOptions}>
          <input
            type="text"
            placeholder={""}
            className="bg-transparent border-none outline-none text-xl ml-1 w-full cursor-pointer"
            value={SEARCH_LABELS[searchType]}
            readOnly
          />
          <IoIosArrowDropdown className="size-6" />
        </div>

        {/* Lista de opções */}
        {showOptions && (
          <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
            {["data", "entrega", "id", "cliente", "telefone", "ano"].map((option, index) => (
              <li
                key={index}
                tabIndex={0}
                className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                  hover:bg-stone-400 hover:rounded-2xl ${searchType === option ? "bg-stone-400 rounded-2xl" : ""}`}
                onClick={() => handleOptionSelect(option)}
              >
                <span>{SEARCH_LABELS[option]}</span>
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
          {/* seta própria: passado direto, o React mandava o evento do clique como data */}
          <button
            onClick={() => handleDateChange()}
            className="flex items-center bg-[#C1C0C0] rounded-2xl text-xl pl-1 pr-1 shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95"
          >
            Filtrar
          </button>
        </div>
      </div>
    )}

    {/* Campo de Pesquisa para ID ou Cliente */}
    {(searchType === "id" || searchType === "cliente" || searchType === "telefone") && (
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>{`${searchType === "id" ? "Número de Talão:" : searchType === "cliente" ? "Nome de Cliente:" : "Número de Telefone:"}`}</p>
        </div>
        <div className='flex w-[70%] gap-2'>
        <div className='relative flex-1'>
          <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center">
            <BiSearchAlt className="size-6" />
            <input
              ref={inputRef}
              type="text"
              name="searchTerm"
              value={searchTerm}
              onChange={(e) => handleChange(e.target.value)} // Atualiza o termo de pesquisa
              onKeyDown={handleKeyDown}
              placeholder={searchType === "id" ? "Procurar Talão..." : searchType === "cliente" ? "Procurar Cliente..." : "Procurar Número..."}
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
                  // Sem Talão a areia, igual à lista do Novo Talão (ClientSearch):
                  // hover e destaque do teclado no areia mais escuro (#CDC3B5).
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
                  <span className="opacity-50">{searchType === "telefone" ? res.number : res.address}</span>
                  <span>{")"}</span>
                </div>
              );
            })}

          </div>
        )}
        </div>
        {searchType === "id" && yearSelector("w-[38%]")}
        </div>
      </div>
    )}

    {/* Pesquisa por ano inteiro */}
    {searchType === "ano" && (
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Ano:</p>
        </div>
        {yearSelector("w-[35%]")}
      </div>
    )}

    {/* Data de levantamento: um dia de calendário */}
    {searchType === "entrega" && (
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl mt-3 mb-1 overflow-clip">
          <p>Data de Levantamento:</p>
        </div>
        <div className="flex space-x-4 w-[45%]">
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm text-xl w-full"
          />
          <button
            onClick={() => searchByDeliveryDate(deliveryDate)}
            className="flex items-center bg-[#C1C0C0] rounded-2xl text-xl pl-1 pr-1 shadow-md justify-center overflow-clip cursor-pointer border-2 border-[#928787] hover:bg-stone-400 transition duration-200 active:scale-95"
          >
            Filtrar
          </button>
        </div>
      </div>
    )}

    {/* Terceira coluna: filtros de Estado e Marcação (exceto no tipo "id") + Impressão Livre no espaço livre */}
    <div className="bg-[#E1E4F1] flex flex-row items-center col-start-3">
      {searchType !== "id" && (
      <>
        <div className='bg-[#E1E4F1] flex justify-center items-start flex-col w-[30%]'>
          <div className="flex w-full text-3xl mt-3 mb-1 overflow-clip">
            <p>Estado:</p>
          </div>
          <div className="relative w-full cursor-pointer"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setShowOptionsState(false);
              }
            }}
          >
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
              <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
                {["Todos", "Pendente", "Pago", "Entregue"].map((option, index) => (
                  <li
                    key={index}
                    tabIndex={0}
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

        <div className='bg-[#E1E4F1] flex justify-center items-start flex-col w-[30%] ml-12'>
          <div className="flex w-full text-3xl mt-3 mb-1 overflow-clip">
            <p>Marcação:</p>
          </div>
          <div className="relative w-full cursor-pointer"
            tabIndex={0}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setShowOptionsMarked(false);
              }
            }}
          >
            <div className="bg-[#C1C0C0] rounded-2xl p-3 shadow-sm flex items-center" onClick={toggleOptionsMarked}>
              <input
                type="text"
                placeholder={""}
                className="bg-transparent border-none outline-none text-xl ml-1 w-full cursor-pointer"
                value={searchTypeMarked}
                readOnly
              />
              <IoIosArrowDropdown className="size-6" />
            </div>

            {/* Lista de opções */}
            {showOptionsMarked && (
              <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto scrollbar-hidden z-50">
                {["Todos", "Marcado", "Não marcado"].map((option, index) => (
                  <li
                    key={index}
                    tabIndex={0}
                    className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                      hover:bg-stone-400 hover:rounded-2xl ${searchTypeMarked === option ? "bg-stone-400 rounded-2xl" : ""}`}
                    onClick={() => handleOptionSelectMarked(option)}
                  >
                    <span>{option}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </>
      )}

      {/* Impressão Livre: à direita com a mesma margem do ícone de backup (mr-12), à altura dos campos de filtro */}
      <div className="flex-1 flex flex-col justify-center items-end pr-12">
        <div className="text-3xl mt-3 mb-1 invisible select-none" aria-hidden="true">&nbsp;</div>
        <TfiWrite
          className="size-11 opacity-55 cursor-pointer hover:opacity-100 transition duration-200 active:scale-90"
          onClick={onCustomPrint}
          />
      </div>
    </div>
  </div>
);
};

export default ReceiptFilters;