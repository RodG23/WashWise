import React, { useState, useRef, useEffect } from 'react';
import { BiSearchAlt } from "react-icons/bi";
import { IoIosArrowDropdown } from "react-icons/io";

//todo colocar a data no dia de hoje quando se abre a aba
//todo verificar formato de data valido antes de ir a bd  ( numero de digitos )
//todo adicionar verificação de erros em todas as pesquisas para destinguir demora de inexistencia de match
//todo procurar cliente e selecionar como no novo talao e ao selecionar é que vai buscar os taloes do cliente 

// Função para filtrar os clientes
const ReceiptFilters = ({ updateFilteredReceipts }) => {
  const [searchType, setSearchType] = useState("data"); // Tipo de filtro selecionado
  const [searchTerm, setSearchTerm] = useState(""); // Termo de pesquisa
  const [showOptions, setShowOptions] = useState(false); // Controla se as opções estão visíveis
  const inputRef = useRef(null); // Ref para o campo de pesquisa
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm); // Termo de pesquisa com debounce
  const [startDate, setStartDate] = useState(""); // Data inicial
  const [endDate, setEndDate] = useState(""); // Data final
  const [clients, setClients] = useState([]);

  // Função para alternar entre as opções
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // Função para selecionar o tipo de pesquisa
  const handleOptionSelect = (option) => {
    setSearchType(option);
    setShowOptions(false);
    inputRef.current?.focus(); // Passar o foco para o campo de pesquisa após selecionar
    setSearchTerm("");
    updateFilteredReceipts([]);
  };

  // Função para realizar a pesquisa
  const handleSearch = () => {
    // Chama a função de busca de acordo com o tipo de pesquisa selecionado
    if (searchType === "id") {
      window.api.getReceiptById(debouncedTerm)
        .then((response) => {
          if(response.success) {
            const receipt = response.receipt;
            updateFilteredReceipts([receipt]);
            console.log(receipt);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar talão pelo id: ", error);
        });
    } else if (searchType === "cliente") {
      window.api.getReceiptsByClient(debouncedTerm)
        .then((receipts) => {
          updateFilteredReceipts(receipts);
          console.log(receipts);
        })
        .catch((error) => {
          console.error("Erro ao procurar talão por cliente: ", error);
        });
    }
  };


  // Função para lidar com o intervalo de datas
  const handleDateChange = () => {
    if (startDate && endDate) {
      window.api.getReceiptsByDate(startDate, endDate) 
        .then((response) => {
          if(response.success) {
            const receipts = response.receipts;
            updateFilteredReceipts(receipts);
            console.log(receipts);
          }
        })
        .catch((error) => {
          console.error("Erro ao procurar talões por data:", error);
        });
    }
  };


  // Usar o useEffect para debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm); // Atualiza o termo com debounce
    }, 500); 

    return () => clearTimeout(timer); // Limpa o timer se searchTerm mudar antes de 500ms
  }, [searchTerm]);

  // Executa a pesquisa sempre que debouncedTerm mudar
  useEffect(() => {
    if (debouncedTerm) {
      handleSearch();
    } else {
      updateFilteredReceipts([]); 
    }
  }, [debouncedTerm]);

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
                onChange={(e) => setSearchTerm(e.target.value)} // Atualiza o termo de pesquisa
                placeholder={"Procurar Talão..."}
                className="bg-transparent border-none outline-none text-xl ml-1 w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptFilters;