import React, { useState, useCallback, useMemo } from 'react';

const DATA_TYPES = [
    'VARCHAR', 'TEXT', 'INTEGER', 'FLOAT', 'DECIMAL', 'BOOLEAN', 
    'DATE', 'TIMESTAMP', 'JSON', 'UUID'
];

export default function SchemaStep({ schema, onUpdate, onModifySchema, onRegenerate }) {
    const [editableSchema, setEditableSchema] = useState(schema);
    const [errors, setErrors] = useState({});
    const [activeTable, setActiveTable] = useState(null);

    const validateField = useCallback((value, type) => {
        switch (type) {
            case 'tableName':
                return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value) 
                    ? null 
                    : 'Table name must start with a letter and contain only letters, numbers, and underscores';
            case 'columnName':
                return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)
                    ? null
                    : 'Column name must start with a letter and contain only letters, numbers, and underscores';
            default:
                return null;
        }
    }, []);

    const handleTableNameChange = useCallback((index, value) => {
        const error = validateField(value, 'tableName');
        setErrors(prev => ({ ...prev, [`table-${index}`]: error }));
        
        if (!error) {
            const updatedSchema = [...editableSchema];
            updatedSchema[index].tableName = value;
            setEditableSchema(updatedSchema);
        }
    }, [editableSchema, validateField]);

    const handleColumnChange = useCallback((tableIndex, columnIndex, field, value) => {
        const updatedSchema = [...editableSchema];
        const error = field === 'name' ? validateField(value, 'columnName') : null;
        
        setErrors(prev => ({
            ...prev,
            [`column-${tableIndex}-${columnIndex}`]: error
        }));

        if (!error) {
            updatedSchema[tableIndex].columns[columnIndex][field] = value;
            setEditableSchema(updatedSchema);
        }
    }, [editableSchema, validateField]);

    const handleAddColumn = useCallback((tableIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns.push({
            name: '',
            type: 'VARCHAR',
            length: null,
            nullable: true,
            primaryKey: false,
            foreignKey: null
        });
        setEditableSchema(updatedSchema);
    }, [editableSchema]);

    const handleAddForeignKey = useCallback((tableIndex, columnIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns[columnIndex].foreignKey = {
            table: '',
            column: '',
            onDelete: 'CASCADE'
        };
        setEditableSchema(updatedSchema);
    }, [editableSchema]);

    const handleRemoveForeignKey = useCallback((tableIndex, columnIndex) => {
        const updatedSchema = [...editableSchema];
        updatedSchema[tableIndex].columns[columnIndex].foreignKey = null;
        setEditableSchema(updatedSchema);
    }, [editableSchema]);

    const handleAddTable = useCallback(() => {
        setEditableSchema(prev => [
            ...prev,
            {
                tableName: '',
                columns: [{
                    name: 'id',
                    type: 'INTEGER',
                    primaryKey: true,
                    nullable: false
                }]
            }
        ]);
    }, []);

    const canSave = useMemo(() => {
        return Object.values(errors).every(error => !error) &&
               editableSchema.every(table => 
                   table.tableName && 
                   table.columns.every(column => column.name && column.type)
               );
    }, [errors, editableSchema]);

    return (
        <div className="schema-step p-6 bg-gray-50 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Database Schema</h2>
                <div className="space-x-4">
                    <button
                        onClick={onRegenerate}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    >
                        Regenerate Schema
                    </button>
                    <button
                        onClick={onModifySchema}
                        className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 transition"
                    >
                        Modify with AI
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {editableSchema.map((table, tableIndex) => (
                    <div
                        key={tableIndex}
                        className={`bg-white p-6 rounded-lg shadow-md border-2 transition-colors ${
                            activeTable === tableIndex ? 'border-blue-500' : 'border-transparent'
                        }`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex-1 mr-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Table Name
                                </label>
                                <input
                                    type="text"
                                    value={table.tableName}
                                    onChange={(e) => handleTableNameChange(tableIndex, e.target.value)}
                                    className={`border p-2 rounded w-full ${
                                        errors[`table-${tableIndex}`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Table Name"
                                />
                                {errors[`table-${tableIndex}`] && (
                                    <p className="text-red-500 text-sm mt-1">{errors[`table-${tableIndex}`]}</p>
                                )}
                            </div>
                            <button
                                onClick={() => {
                                    const updatedSchema = [...editableSchema];
                                    updatedSchema.splice(tableIndex, 1);
                                    setEditableSchema(updatedSchema);
                                }}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                            >
                                Delete Table
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr>
                                        <th className="text-left p-2">Name</th>
                                        <th className="text-left p-2">Type</th>
                                        <th className="text-left p-2">Constraints</th>
                                        <th className="text-left p-2">Foreign Key</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {table.columns.map((column, columnIndex) => (
                                        <tr key={columnIndex} className="border-t">
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={column.name}
                                                    onChange={(e) => handleColumnChange(
                                                        tableIndex,
                                                        columnIndex,
                                                        'name',
                                                        e.target.value
                                                    )}
                                                    className={`border p-2 rounded w-full ${
                                                        errors[`column-${tableIndex}-${columnIndex}`]
                                                            ? 'border-red-500'
                                                            : 'border-gray-300'
                                                    }`}
                                                    placeholder="Column Name"
                                                />
                                                {errors[`column-${tableIndex}-${columnIndex}`] && (
                                                    <p className="text-red-500 text-sm mt-1">
                                                        {errors[`column-${tableIndex}-${columnIndex}`]}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={column.type}
                                                    onChange={(e) => handleColumnChange(
                                                        tableIndex,
                                                        columnIndex,
                                                        'type',
                                                        e.target.value
                                                    )}
                                                    className="border border-gray-300 p-2 rounded w-full"
                                                >
                                                    {DATA_TYPES.map(type => (
                                                        <option key={type} value={type}>
                                                            {type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center space-x-4">
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={column.primaryKey}
                                                            onChange={(e) => handleColumnChange(
                                                                tableIndex,
                                                                columnIndex,
                                                                'primaryKey',
                                                                e.target.checked
                                                            )}
                                                            className="mr-2"
                                                        />
                                                        PK
                                                    </label>
                                                    <label className="flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={!column.nullable}
                                                            onChange={(e) => handleColumnChange(
                                                                tableIndex,
                                                                columnIndex,
                                                                'nullable',
                                                                !e.target.checked
                                                            )}
                                                            className="mr-2"
                                                        />
                                                        Required
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                {column.foreignKey ? (
                                                    <div className="flex items-center space-x-2">
                                                        <select
                                                            value={column.foreignKey.table}
                                                            onChange={(e) => {
                                                                const updatedSchema = [...editableSchema];
                                                                updatedSchema[tableIndex].columns[columnIndex]
                                                                    .foreignKey.table = e.target.value;
                                                                setEditableSchema(updatedSchema);
                                                            }}
                                                            className="border border-gray-300 p-2 rounded"
                                                        >
                                                            <option value="">Select Table</option>
                                                            {editableSchema.map((t, i) => (
                                                                <option key={i} value={t.tableName}>
                                                                    {t.tableName}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            onClick={() => handleRemoveForeignKey(tableIndex, columnIndex)}
                                                            className="text-red-500 hover:text-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleAddForeignKey(tableIndex, columnIndex)}
                                                        className="text-blue-500 hover:text-blue-600"
                                                    >
                                                        + Add FK
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <button
                                                    onClick={() => {
                                                        const updatedSchema = [...editableSchema];
                                                        updatedSchema[tableIndex].columns.splice(columnIndex, 1);
                                                        setEditableSchema(updatedSchema);
                                                    }}
                                                    className="text-red-500 hover:text-red-600"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <button
                            onClick={() => handleAddColumn(tableIndex)}
                            className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                        >
                            Add Column
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6 space-x-4">
                <button
                    onClick={handleAddTable}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition"
                >
                    Add Table
                </button>
                <button
                    onClick={() => onUpdate(editableSchema)}
                    disabled={!canSave}
                    className={`bg-blue-500 text-white px-6 py-2 rounded transition ${
                        canSave ? 'hover:bg-blue-600' : 'opacity-50 cursor-not-allowed'
                    }`}
                >
                    Save Changes
                </button>
            </div>
        </div>
    );
}