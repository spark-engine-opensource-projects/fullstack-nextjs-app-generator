import React, { useState, useCallback, useMemo } from 'react';

const METHOD_COLORS = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800'
};

const validateEndpoint = endpoint => /^\/[a-zA-Z0-9\-\_\/{}]*$/.test(endpoint);
const validateName = name => /^[a-zA-Z0-9\-\_\s]{3,50}$/.test(name);

export default function ApiStep({ apis, onUpdate, onAddApi, onDeleteApi, onRegenerate }) {
    const [errors, setErrors] = useState({});
    const [showDocs, setShowDocs] = useState({});

    const handleApiChange = useCallback((index, e) => {
        const { name, value } = e.target;
        let isValid = true;
        let errorMessage = '';

        if (name === 'endpoint') {
            isValid = validateEndpoint(value);
            errorMessage = 'Endpoint must start with / and contain valid characters';
        } else if (name === 'name') {
            isValid = validateName(value);
            errorMessage = 'Name must be 3-50 characters and contain valid characters';
        }

        setErrors(prev => ({
            ...prev,
            [`${index}-${name}`]: isValid ? null : errorMessage
        }));

        if (isValid) {
            const updatedApis = [...apis];
            updatedApis[index][name] = value;
            onUpdate(updatedApis);
        }
    }, [apis, onUpdate]);

    const handleAddApi = useCallback(() => {
        const newApi = { 
            name: '', 
            endpoint: '/',
            method: 'GET',
            description: '',
            parameters: []
        };
        onAddApi(newApi);
    }, [onAddApi]);

    const handleAddParameter = useCallback((apiIndex) => {
        const updatedApis = [...apis];
        if (!updatedApis[apiIndex].parameters) {
            updatedApis[apiIndex].parameters = [];
        }
        updatedApis[apiIndex].parameters.push({ name: '', type: 'string', required: false });
        onUpdate(updatedApis);
    }, [apis, onUpdate]);

    const toggleDocs = useCallback((index) => {
        setShowDocs(prev => ({ ...prev, [index]: !prev[index] }));
    }, []);

    const generateDocsPreview = useMemo(() => (api) => {
        return `
        ${api.method} ${api.endpoint}
        
        ${api.description || 'No description provided'}
        
        Parameters:
        ${api.parameters?.map(p => `- ${p.name} (${p.type})${p.required ? ' [Required]' : ''}`).join('\n') || 'None'}
        `;
    }, []);

    return (
        <div className="api-step p-6 bg-gray-50 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">API Management</h2>
                <button
                    onClick={onRegenerate}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    Regenerate APIs
                </button>
            </div>

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
                                    className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${
                                        errors[`${index}-name`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter API Name"
                                />
                                {errors[`${index}-name`] && (
                                    <p className="text-red-500 text-sm mt-1">{errors[`${index}-name`]}</p>
                                )}
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
                                    className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${
                                        errors[`${index}-endpoint`] ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Enter API Endpoint"
                                />
                                {errors[`${index}-endpoint`] && (
                                    <p className="text-red-500 text-sm mt-1">{errors[`${index}-endpoint`]}</p>
                                )}
                            </div>

                            <div className="w-32">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Method
                                </label>
                                <select
                                    name="method"
                                    value={api.method}
                                    onChange={(e) => handleApiChange(index, e)}
                                    className={`border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500 ${METHOD_COLORS[api.method]}`}
                                >
                                    {Object.keys(METHOD_COLORS).map(method => (
                                        <option key={method} value={method}>
                                            {method}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={api.description}
                                onChange={(e) => handleApiChange(index, e)}
                                className="border border-gray-300 p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
                                rows="2"
                                placeholder="API Description"
                            />
                        </div>

                        <div className="mb-4">
                            <button
                                onClick={() => handleAddParameter(index)}
                                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                            >
                                Add Parameter
                            </button>
                            {api.parameters?.length > 0 && (
                                <div className="mt-2">
                                    {api.parameters.map((param, paramIndex) => (
                                        <div key={paramIndex} className="flex items-center gap-2 mt-2">
                                            <input
                                                type="text"
                                                value={param.name}
                                                onChange={(e) => {
                                                    const updatedApis = [...apis];
                                                    updatedApis[index].parameters[paramIndex].name = e.target.value;
                                                    onUpdate(updatedApis);
                                                }}
                                                className="border border-gray-300 p-1 rounded text-sm"
                                                placeholder="Parameter name"
                                            />
                                            <select
                                                value={param.type}
                                                onChange={(e) => {
                                                    const updatedApis = [...apis];
                                                    updatedApis[index].parameters[paramIndex].type = e.target.value;
                                                    onUpdate(updatedApis);
                                                }}
                                                className="border border-gray-300 p-1 rounded text-sm"
                                            >
                                                <option value="string">String</option>
                                                <option value="number">Number</option>
                                                <option value="boolean">Boolean</option>
                                                <option value="object">Object</option>
                                                <option value="array">Array</option>
                                            </select>
                                            <input
                                                type="checkbox"
                                                checked={param.required}
                                                onChange={(e) => {
                                                    const updatedApis = [...apis];
                                                    updatedApis[index].parameters[paramIndex].required = e.target.checked;
                                                    onUpdate(updatedApis);
                                                }}
                                                className="ml-2"
                                            />
                                            <span className="text-sm">Required</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => toggleDocs(index)}
                                className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                                {showDocs[index] ? 'Hide Documentation' : 'Show Documentation'}
                            </button>
                            <button
                                onClick={() => onDeleteApi(index)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                            >
                                Delete API
                            </button>
                        </div>

                        {showDocs[index] && (
                            <div className="mt-4 p-4 bg-gray-50 rounded font-mono text-sm whitespace-pre-wrap">
                                {generateDocsPreview(api)}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6">
                <button
                    onClick={handleAddApi}
                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition mr-4"
                >
                    Add API
                </button>
            </div>
        </div>
    );
}