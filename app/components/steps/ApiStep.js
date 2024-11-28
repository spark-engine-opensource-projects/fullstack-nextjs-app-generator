import React from 'react';

export default function ApiStep({ apis, onUpdate, onAddApi, onDeleteApi, onRegenerate }) {
    const handleApiChange = (index, e) => {
        const { name, value } = e.target;
        const updatedApis = [...apis];
        updatedApis[index][name] = value;
        onUpdate(updatedApis);
    };

    const handleAddApi = () => {
        const newApi = { name: '', endpoint: '', method: 'GET' };
        onAddApi(newApi);
    };

    return (
        <div className="api-step p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">API Management</h2>

            <div className="space-y-6">
                {apis.map((api, index) => (
                    <div key={index} className="p-4 bg-white rounded shadow-md">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    API Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={api.name}
                                    onChange={(e) => handleApiChange(index, e)}
                                    className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter API Name"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    API Endpoint
                                </label>
                                <input
                                    type="text"
                                    name="endpoint"
                                    value={api.endpoint}
                                    onChange={(e) => handleApiChange(index, e)}
                                    className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter API Endpoint"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Method
                                </label>
                                <select
                                    name="method"
                                    value={api.method}
                                    onChange={(e) => handleApiChange(index, e)}
                                    className="border border-gray-300 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                    <option value="PUT">PUT</option>
                                    <option value="DELETE">DELETE</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => onDeleteApi(index)}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition duration-200"
                        >
                            Delete API
                        </button>
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button
                    onClick={handleAddApi}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition duration-200 mr-4"
                >
                    Add API
                </button>
                <button
                    onClick={onRegenerate}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition duration-200"
                >
                    Regenerate APIs
                </button>
            </div>
        </div>
    );
}
