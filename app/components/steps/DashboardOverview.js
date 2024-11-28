import React, { useMemo } from 'react';

export default function DashboardOverview({ apiResult }) {
    const relationshipGraph = useMemo(() => {
        const relationships = {};
        apiResult.databaseSchema?.forEach(table => {
            table.columns.forEach(column => {
                if (column.foreignKey) {
                    relationships[table.tableName] = relationships[table.tableName] || [];
                    relationships[table.tableName].push({
                        to: column.foreignKey.table,
                        via: column.name
                    });
                }
            });
        });
        return relationships;
    }, [apiResult.databaseSchema]);

    return (
        <div className="dashboard-overview space-y-8">
            <header className="border-b pb-4">
                <h2 className="text-2xl font-bold mb-2">Project Overview</h2>
                <div className="flex space-x-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {apiResult.pages.length} Pages
                    </span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {apiResult.apis.length} APIs
                    </span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                        {apiResult.databaseSchema?.length || 0} Tables
                    </span>
                </div>
            </header>

            <section className="space-y-4">
                <h3 className="text-xl font-semibold">Pages and Components</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {apiResult.pages.map((page, pageIndex) => (
                        <div key={pageIndex} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold">{page.name}</h4>
                                <span className="text-sm text-gray-500">
                                    {page.components?.length || 0} Components
                                </span>
                            </div>
                            <p className="text-gray-600 mb-4 text-sm">{page.purpose}</p>
                            <div className="space-y-2">
                                {page.components?.map((component, componentIndex) => (
                                    <div key={componentIndex} className="bg-gray-50 p-3 rounded border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium">{component}</span>
                                            {apiResult.apiMappings[component] && (
                                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                                    {apiResult.apiMappings[component]}
                                                </span>
                                            )}
                                        </div>
                                        {apiResult.context[component] && (
                                            <div className="mt-2 text-sm text-gray-600">
                                                {Object.entries(apiResult.context[component]).map(([key, value]) => (
                                                    <div key={key} className="flex items-baseline">
                                                        <span className="font-medium mr-2">{key}:</span>
                                                        <span>{value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xl font-semibold">Color Scheme</h3>
                <div className="flex flex-wrap gap-4">
                    {Object.entries(apiResult.styling.colors).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-3">
                            <div 
                                className="w-10 h-10 rounded-lg border shadow-sm"
                                style={{ backgroundColor: value }}
                            />
                            <div>
                                <p className="font-medium capitalize">{key}</p>
                                <p className="text-sm text-gray-600">{value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xl font-semibold">API Endpoints</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {apiResult.apis.map((api, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold">{api.name}</h4>
                                <span className={`px-2 py-1 rounded text-sm
                                    ${api.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                                      api.method === 'POST' ? 'bg-green-100 text-green-800' :
                                      api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'}`}
                                >
                                    {api.method}
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{api.endpoint}</p>
                            {api.parameters?.length > 0 && (
                                <div className="mt-2 text-sm">
                                    <p className="font-medium mb-1">Parameters:</p>
                                    <ul className="list-disc list-inside">
                                        {api.parameters.map((param, pIndex) => (
                                            <li key={pIndex} className="text-gray-600">
                                                {param.name} ({param.type})
                                                {param.required && <span className="text-red-500">*</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-4">
                <h3 className="text-xl font-semibold">Database Schema</h3>
                <div className="space-y-6">
                    {apiResult.databaseSchema?.map((table, tableIndex) => (
                        <div key={tableIndex} className="bg-white p-4 rounded-lg border border-gray-200 shadow">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-lg">{table.tableName}</h4>
                                {relationshipGraph[table.tableName]?.length > 0 && (
                                    <div className="text-sm text-gray-600">
                                        Relations: {relationshipGraph[table.tableName].length}
                                    </div>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Column</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
                                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Constraints</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {table.columns.map((column, columnIndex) => (
                                            <tr key={columnIndex}>
                                                <td className="px-4 py-2">
                                                    <span className="font-medium">{column.name}</span>
                                                </td>
                                                <td className="px-4 py-2 text-gray-600">
                                                    {column.type}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <div className="flex gap-2">
                                                        {column.primaryKey && (
                                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                                                                Primary Key
                                                            </span>
                                                        )}
                                                        {!column.nullable && (
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                                                Required
                                                            </span>
                                                        )}
                                                        {column.foreignKey && (
                                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                                                                FK → {column.foreignKey.table}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {relationshipGraph[table.tableName]?.length > 0 && (
                                <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
                                    <p className="font-medium mb-2">Relationships:</p>
                                    {relationshipGraph[table.tableName].map((rel, relIndex) => (
                                        <p key={relIndex} className="text-gray-600">
                                            → {rel.to} (via {rel.via})
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}