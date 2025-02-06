import React from "react";

const DynamicTable = ({ tableData }) => {
  return (
    <div className="overflow-x-auto bg-white shadow-md rounded-lg">
      <table className="min-w-full table-auto">
        <thead className="bg-gray-200">
          <tr>
            <th className="py-2 px-4 text-left">Peça</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((entry, index) => (
            <tr key={index} className="border-t">
              <td className="py-2 px-4">{entry.selectedRef}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DynamicTable;
