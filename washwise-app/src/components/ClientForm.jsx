import React, { useState, useEffect } from 'react';

const ClientForm = ({ client, onSave }) => {
  const [formData, setFormData] = useState({ name: '', number: '', receipt: '' });

  useEffect(() => {
    if (client) {
      setFormData({ name: client.name, number: client.number, receipt: client.receipt });
    }
  }, [client]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <input 
        type="text" 
        name="name" 
        value={formData.name} 
        onChange={handleChange} 
        placeholder="Nome"
        className="mb-2 p-2"
      />
      <input 
        type="text" 
        name="number" 
        value={formData.number} 
        onChange={handleChange} 
        placeholder="Número"
        className="mb-2 p-2"
      />
      <input 
        type="text" 
        name="receipt" 
        value={formData.receipt} 
        onChange={handleChange} 
        placeholder="Talão"
        className="mb-2 p-2"
      />
      <button type="submit" className="bg-blue-500 text-white p-2">Salvar</button>
    </form>
  );
};

export default ClientForm;
