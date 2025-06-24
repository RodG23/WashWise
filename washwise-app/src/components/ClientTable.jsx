import React from 'react';

const ClientTable = ({ clients, onSelectClient }) => {
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Número</th>
          <th>Talão</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {clients.map((client) => (
          <tr key={client.id}>
            <td>{client.name}</td>
            <td>{client.number}</td>
            <td>{client.receipt}</td>
            <td>
              <button onClick={() => onSelectClient(client)}>Editar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ClientTable;
