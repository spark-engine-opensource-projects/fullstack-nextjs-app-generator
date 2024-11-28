import React, { useState } from 'react';

export default function SchemaStep({ schema, onUpdate, onModifySchema, onRegenerate }) {
    const [editableSchema, setEditableSchema] = useState(schema);

    const handleTableNameChange = (index, value) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[index].tableName = value;
        setEditableSchema(updatedSchema);
    };

    const handleColumnChange = (tableIndex, columnIndex, field, value) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns[columnIndex][field] = value;
        setEditableSchema(updatedSchema);
    };

    const handleAddColumn = (tableIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns.push({ name: '', type: '' });
        setEditableSchema(updatedSchema);
    };

    const handleDeleteColumn = (tableIndex, columnIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns.splice(columnIndex, 1);
        setEditableSchema(updatedSchema);
    };

    const handleAddTable = () => {
        const updatedSchema = [
            ...editableSchema,
            { tableName: '', columns: [{ name: '', type: '' }] },
        ];
        setEditableSchema(updatedSchema);
    };

    const handleDeleteTable = (tableIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema.splice(tableIndex, 1);
        setEditableSchema(updatedSchema);
    };

    const handleSaveChanges = () => {
        onUpdate(editableSchema);
    };

    return (
        <div className="schema-step p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Database Schema</h2>

            {editableSchema.map((table, tableIndex) => (
                <div
                    key={tableIndex}
                    className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-6"
                >
                    <div className="flex justify-between items-center mb-4">
                        <input
                            type="text"
                            value={table.tableName}
                            onChange={(e) => handleTableNameChange(tableIndex, e.target.value)}
                            placeholder="Table Name"
                            className="text-xl font-bold text-gray-800 border p-2 rounded w-2/3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                            onClick={() => handleDeleteTable(tableIndex)}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                        >
                            Delete Table
                        </button>
                    </div>
                    <table className="w-full text-left border-collapse mb-4">
                        <thead>
                            <tr>
                                <th className="border-b-2 border-gray-200 py-2">Column Name</th>
                                <th className="border-b-2 border-gray-200 py-2">Type</th>
                                <th className="border-b-2 border-gray-200 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {table.columns.map((column, columnIndex) => (
                                <tr key={columnIndex} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b border-gray-200">
                                        <input
                                            type="text"
                                            value={column.name}
                                            onChange={(e) =>
                                                handleColumnChange(
                                                    tableIndex,
                                                    columnIndex,
                                                    'name',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Column Name"
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="py-2 px-4 border-b border-gray-200">
                                        <input
                                            type="text"
                                            value={column.type}
                                            onChange={(e) =>
                                                handleColumnChange(
                                                    tableIndex,
                                                    columnIndex,
                                                    'type',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Column Type"
                                            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="py-2 px-4 border-b border-gray-200">
                                        <button
                                            onClick={() =>
                                                handleDeleteColumn(tableIndex, columnIndex)
                                            }
                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        onClick={() => handleAddColumn(tableIndex)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition duration-200"
                    >
                        Add Column
                    </button>
                </div>
            ))}

            <button
                onClick={handleAddTable}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-200 mb-6"
            >
                Add Table
            </button>

            <div className="flex space-x-4">
                <button
                    onClick={handleSaveChanges}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition duration-200"
                >
                    Save Changes
                </button>
                <button
                    onClick={onModifySchema}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-200"
                >
                    Modify Schema with AI
                </button>
                <button
                    onClick={onRegenerate}
                    className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 transition duration-200"
                >
                    Regenerate Schema
                </button>
            </div>
        </div>
    );
}
