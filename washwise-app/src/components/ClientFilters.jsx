import React, { useState, useRef, useEffect } from 'react';
import { BiSearchAlt } from "react-icons/bi";
import { IoIosArrowDropdown } from "react-icons/io";

//todo tratamento de erros

// Função para filtrar os clientes
const ClientFilters = () => {
  const [searchType, setSearchType] = useState("name"); // Tipo de filtro selecionado
  const [searchTerm, setSearchTerm] = useState(""); // Termo de pesquisa
  const [filteredClients, setFilteredClients] = useState([]); // Armazenar clientes filtrados
  const [showOptions, setShowOptions] = useState(false); // Controla se as opções estão visíveis
  const inputRef = useRef(null); // Ref para o campo de pesquisa
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm); // Termo de pesquisa com debounce

  // Função para alternar entre as opções
  const toggleOptions = () => {
    setShowOptions(!showOptions);
  };

  // Função para selecionar o tipo de pesquisa
  const handleOptionSelect = (option) => {
    setSearchType(option);
    setShowOptions(false); // Fechar as opções após selecionar
    inputRef.current?.focus(); // Passar o foco para o campo de pesquisa após selecionar
    setSearchTerm(""); // Limpar o campo de pesquisa ao selecionar o filtro
    setFilteredClients([]); // Limpar os clientes filtrados
  };

  // Função para realizar a pesquisa
  const handleSearch = () => {
    // Chama a função de busca de acordo com o tipo de pesquisa selecionado
    if (searchType === "name") {
      // Chama a função para pesquisa por nome de cliente
      window.api.getClientesSearchName(debouncedTerm) // Função que já configuramos para busca por nome
        .then((clientes) => {
          clientes.sort((a, b) => a.name.localeCompare(b.name));
          setFilteredClients(clientes); // Atualiza o estado com os clientes filtrados
        })
        .catch((error) => {
          console.error("Erro ao buscar clientes:", error); // Tratar erros de busca
        });
    } else if (searchType === "receipt") {
      // Pesquisa por número de talão
      window.api.getClientesSearchReceipt(debouncedTerm) // Pesquisa por número de talão
        .then((clientes) => {
          setFilteredClients(clientes); // Os clientes são retornados diretamente
        })
        .catch((error) => {
          console.error("Erro ao buscar cliente pelo talão:", error);
        });
    }
  };


  // Usar o useEffect para debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm); // Atualiza o termo com debounce
    }, 500); // O debounce ocorre após 500ms

    return () => clearTimeout(timer); // Limpa o timer se searchTerm mudar antes de 500ms
  }, [searchTerm]);

  // Executa a pesquisa sempre que debouncedTerm mudar
  useEffect(() => {
    if (debouncedTerm) {
      handleSearch(); // Realiza a pesquisa
    } else {
      setFilteredClients([]); // Limpa os resultados se o termo de pesquisa estiver vazio
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
              value={searchType === "name" ? "Nome de Cliente" : "Número de Talão"}
              readOnly
            />
            <IoIosArrowDropdown className="size-6" />
          </div>

          {/* Lista de opções */}
          {showOptions && (
            <ul className="absolute top-full left-0 w-full bg-[#C1C0C0] rounded-2xl shadow-lg mt-1 max-h-[200px] overflow-y-auto z-50">
              {["name", "receipt"].map((option, index) => (
                <li
                  key={index}
                  className={`w-full flex justify-center border-b border-[rgba(0,0,0,0.2)] text-xl cursor-pointer p-2
                    hover:bg-stone-400 hover:rounded-2xl ${searchType === option ? "bg-stone-400 rounded-2xl" : ""}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <span>{option === "name" ? "Nome de Cliente" : "Número de Talão"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Campo de Pesquisa */}
      <div className="h-full ml-1 flex-col flex justify-center">
        <div className="flex w-[70%] text-3xl overflow-clip mt-3 mb-1">
          <p>{`${searchType === "name" ? "Nome de Cliente" : "Número de Talão"}`}</p>
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
              placeholder={"Procurar Cliente..."}
              className="bg-transparent border-none outline-none text-xl ml-1 w-full"
            />
          </div>
        </div>
      </div>

      {/* Exibir resultados filtrados */}
      <div className="flex-1 mt-4">
        {filteredClients.length > 0 ? (
          <ul>
            {filteredClients.map((client, index) => (
              <li key={index}>
                {client.name} - {client.address}
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhum cliente encontrado.</p>
        )}
      </div>
    </div>
  );
};

export default ClientFilters;
