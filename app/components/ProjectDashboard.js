import React, { useState, useEffect } from 'react';
import { generateDynamicallyRenderingReactComponent, generateServerlessApi, generateSQLDatabaseQuery } from '../utils/api';
import ErrorBoundary from './ErrorBoundary';
import ProjectFolderStructure from './ProjectFolderStructure';
import useGenerateFolderStructure from '../utils/folderStructure';

//Is okay
import styled from 'styled-components';

//Chakra
//Thoughts it looks super basic
// import * as Chakra from '@chakra-ui/react';

//MUI 
//Thoughts takes ages to load, not flexible in terms of code generation
// import * as Mui from '@mui/material';
// import * as MuiIcons from '@mui/icons-material';
// import * as MuiSystem from '@mui/system';
// import * as MuiLab from '@mui/lab';
// import * as MuiBase from '@mui/base';
// import * as MuiUtils from '@mui/utils';
// import * as MuiDataGrid from '@mui/x-data-grid';
// import * as MuiDatePickers from '@mui/x-date-pickers';
// import * as MuiTreeView from '@mui/x-tree-view';
// import * as EmotionReact from '@emotion/react';
// import * as EmotionStyled from '@emotion/styled';
// import * as MuiJoy from '@mui/joy';

export default function ProjectDashboard({ projectData }) {
    const [loading, setLoading] = useState(true);
    const [projectComponents, setProjectComponents] = useState(null);
    const [selectedTab, setSelectedTab] = useState('pages');
    const [selectedPage, setSelectedPage] = useState(null);
    const [viewMode, setViewMode] = useState('rendered'); // 'rendered' or 'code'
    const [showFolderStructure, setShowFolderStructure] = useState(false); // State to control visibility of folder structure
    const [serverlessApis, setServerlessApis] = useState([]); // State to hold serverless API details
    const [editingApiIndex, setEditingApiIndex] = useState(-1); // State to manage which API is being edited
    const [newPrompt, setNewPrompt] = useState(''); // State to manage the new prompt for regeneration
    const [showPromptDialog, setShowPromptDialog] = useState(false); // State to toggle prompt dialog visibility
    const [regeneratePrompt, setRegeneratePrompt] = useState(''); // State to manage the prompt for regenerating all components
    const [showRegenerateAllDialog, setShowRegenerateAllDialog] = useState(false); // State to toggle the regenerate all dialog visibility
    const [folderStructure, setFolderStructure] = useState(null); // State for folder structure
    const [componentStatus, setComponentStatus] = useState(() => {
        const initialStatus = {};
        projectData.pages.forEach(page => {
            page.components.forEach(component => {
                initialStatus[component] = 'generating';
            });
        });
        return initialStatus;
    });
    const [apiStatus, setApiStatus] = useState(() => {
        const initialStatus = {};
        projectData.apis.forEach(api => {
            initialStatus[api.name] = 'generating';
        });
        return initialStatus;
    }); // State for tracking API generation status
    const [sqlStatus, setSqlStatus] = useState('idle'); // State for tracking SQL generation status

    const [sqlCode, setSqlCode] = useState(''); // New state for SQL code

    const initialFolderStructure = useGenerateFolderStructure(projectData, projectComponents, serverlessApis, sqlCode); // Initial folder structure

    useEffect(() => {
        setFolderStructure(initialFolderStructure);
    }, [initialFolderStructure]);

    const handleShowFolderStructure = () => {
        setShowFolderStructure(prev => !prev);
    };

    useEffect(() => {
        const generateComponents = async () => {
            try {
                if (projectData.pages && projectData.pages.length > 0) {
                    if (!selectedPage) {
                        setSelectedPage(projectData.pages[0].name);
                    }

                    const uniqueComponents = new Set();
                    projectData.pages.forEach(page => {
                        page.components.forEach(component => {
                            uniqueComponents.add(component);
                        });
                    });

                    const componentMap = {};
                    for (const component of uniqueComponents) {
                        updateComponentStatus(component, 'generating');
                        const generatedComponent = await generateComponent(component, JSON.stringify(projectData.styling));
                        componentMap[component] = generatedComponent;
                    }

                    const generatedPages = projectData.pages.map(page => {
                        const generatedComponents = page.components.map(component => componentMap[component]);
                        return { ...page, components: generatedComponents };
                    });

                    setProjectComponents({
                        ...projectData,
                        pages: generatedPages,
                    });
                }

                if (projectData.apis && projectData.apis.length > 0) {
                    const generatedApis = await Promise.all(
                        projectData.apis.map(async (api, index) => {
                            updateApiStatus(api.name, 'generating');
                            const prompt = constructApiPrompt(api, projectData.databaseSchema);
                            const apiCode = await retryApiGeneration(prompt, api.name);
                            return { ...api, code: apiCode };
                        })
                    );
                    setServerlessApis(generatedApis);
                }

                // Generate the SQL code for the database schema
                if (projectData.databaseSchema) {
                    setSqlStatus('generating');
                    const generatedSQL = await generateSQLDatabaseQuery(JSON.stringify(projectData.databaseSchema));
                    setSqlCode(generatedSQL);
                    setSqlStatus('success');
                }
            } catch (error) {
                console.error('Error generating components:', error);
                setSqlStatus('failed');
            } finally {
                setLoading(false);
            }
        };

        generateComponents();
    }, [projectData]);

    const updateComponentStatus = (componentName, status) => {
        setComponentStatus(prevStatus => ({
            ...prevStatus,
            [componentName]: status
        }));
    };

    const updateApiStatus = (apiName, status) => {
        setApiStatus(prevStatus => ({
            ...prevStatus,
            [apiName]: status
        }));
    };

    const retryApiGeneration = async (prompt, apiName, retries = 3) => {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const apiCode = await generateServerlessApi(prompt);
                if (apiCode && typeof apiCode === 'string' && apiCode.trim()) {
                    updateApiStatus(apiName, 'success');
                    return apiCode;
                }
            } catch (error) {
                console.error(`API generation failed on attempt ${attempt + 1}:`, error);
            }
        }
        updateApiStatus(apiName, 'failed');
        throw new Error('Failed to generate API after multiple attempts');
    };

    const generateComponent = async (componentName, pagePurpose, stylingGuide) => {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                const prompt = `Generate a React component named ${componentName} for a page with the following purpose: ${pagePurpose}. Follow this styling guide: ${stylingGuide}`;
                const result = await generateDynamicallyRenderingReactComponent(prompt);

                const code = typeof result === 'string' ? result : result?.code;

                if (typeof code !== 'string' || !code.trim()) {
                    throw new Error(`Invalid code generated for component ${componentName}`);
                }

                new Function('React', 'styled', `return ${code}`)

                updateComponentStatus(componentName, 'success');

                return { name: componentName, code };
            } catch (error) {
                console.error(`Error generating component '${componentName}' on attempt ${retryCount + 1}:`, error);
                retryCount += 1;
                updateComponentStatus(componentName, `retrying (${retryCount})`);
            }
        }

        updateComponentStatus(componentName, 'failed');

        return { name: componentName, code: `() => <div>Error generating ${componentName} after ${maxRetries} attempts</div>` };
    };

    const handleApiCodeChange = (index, newCode) => {
        const updatedApis = [...serverlessApis];
        updatedApis[index].code = newCode;
        setServerlessApis(updatedApis);

        updateFolderStructure(updatedApis);
    };

    const handleSaveApiCode = (index) => {
        setEditingApiIndex(-1);
    };

    const handleOpenPromptDialog = (index) => {
        setEditingApiIndex(index);
        setShowPromptDialog(true);
    };

    const handleClosePromptDialog = () => {
        setShowPromptDialog(false);
        setNewPrompt('');
    };

    const handleRegenerateApiWithPrompt = async () => {
        if (newPrompt.trim() === '') return;

        try {
            const prompt = constructApiPrompt(serverlessApis[editingApiIndex], projectData.databaseSchema);
            const regeneratedApiCode = await generateServerlessApi(`${prompt}\n${newPrompt}`);

            const updatedApis = [...serverlessApis];
            updatedApis[editingApiIndex].code = regeneratedApiCode;
            setServerlessApis(updatedApis);

            updateFolderStructure(updatedApis);
        } catch (error) {
            console.error('Error regenerating API code:', error);
        } finally {
            handleClosePromptDialog();
        }
    };

    function constructApiPrompt(api, databaseSchema) {
        const { name, method, endpoint } = api;

        // Start constructing the prompt with API details
        let prompt = `Generate a serverless API function named "${name}" with the following details:\n`;
        prompt += `- HTTP Method: ${method}\n`;
        prompt += `- Endpoint: ${endpoint}\n`;

        // Since there's always a database schema, include its details
        prompt += `\nThis API should interact with the following database schema:\n`;
        databaseSchema.forEach(table => {
            prompt += `- Table: ${table.tableName}\n`;
            prompt += `  - Columns:\n`;
            table.columns.forEach(column => {
                prompt += `    - ${column.name} (${column.type})\n`;
            });
            if (table.relationships && table.relationships.length > 0) {
                prompt += `  - Relationships:\n`;
                table.relationships.forEach(relationship => {
                    prompt += `    - ${relationship.type} relationship with ${relationship.relatedTable} via ${relationship.column}\n`;
                });
            }
        });

        // Add any additional instructions or context for the API generation
        prompt += `\nEnsure that the API follows best practices for security and performance. The API should handle all necessary error cases and edge cases gracefully.`;

        return prompt;
    }


    const handleRegenerateApiWithoutPrompt = async (index) => {
        try {
            const prompt = constructApiPrompt(serverlessApis[index], projectData.databaseSchema);
            const regeneratedApiCode = await generateServerlessApi(prompt);

            const updatedApis = [...serverlessApis];
            updatedApis[index].code = regeneratedApiCode;
            setServerlessApis(updatedApis);

            updateFolderStructure(updatedApis);
        } catch (error) {
            console.error('Error regenerating API code:', error);
        }
    };

    const handleRegenerateAllComponents = async () => {
        if (regeneratePrompt.trim() === '') return;

        try {
            const newComponents = await Promise.all(
                projectComponents.pages.map(async (page) => {
                    const updatedComponents = await Promise.all(
                        page.components.map(async (component) => {
                            const newComponent = await generateComponent(
                                component.name,
                                `${page.purpose}. ${regeneratePrompt}`,
                                JSON.stringify(projectData.styling)
                            );
                            return newComponent;
                        })
                    );

                    return {
                        ...page,
                        components: updatedComponents
                    };
                })
            );

            setProjectComponents({
                ...projectComponents,
                pages: newComponents
            });
        } catch (error) {
            console.error('Error regenerating all components:', error);
        } finally {
            setShowRegenerateAllDialog(false);
            setRegeneratePrompt('');
        }
    };

    const handleRegenerateHeader = async () => {
        try {
            const pagesList = projectComponents.pages.map(page => page.name).join(', ');
            const prompt = `Generate a React Header component that includes links to the following pages: ${pagesList}. Ensure that the Header is responsive and follows the styling guide. ${JSON.stringify(projectData.styling)}`;

            const regeneratedHeader = await generateDynamicallyRenderingReactComponent(prompt);

            const updatedPages = projectComponents.pages.map(page => ({
                ...page,
                components: page.components.map(component =>
                    component.name === 'Header' ? { name: 'Header', code: regeneratedHeader } : component
                ),
            }));

            setProjectComponents({
                ...projectComponents,
                pages: updatedPages,
            });
        } catch (error) {
            console.error('Error regenerating Header component:', error);
        }
    };

    const updateFolderStructure = (updatedApis) => {
        const newFolderStructure = useGenerateFolderStructure(projectData, projectComponents, updatedApis, sqlCode);
        setFolderStructure(newFolderStructure);
    };

    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    const handlePageChange = (page) => {
        setSelectedPage(page);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const renderPageTabs = () => {
        return projectComponents?.pages?.map((page) => (
            <button
                key={page.name}
                onClick={() => handlePageChange(page.name)}
                className={`tab ${selectedPage === page.name ? 'tab-active' : ''}`}
            >
                {page.name}
            </button>
        ));
    };

    const DynamicComponent = React.memo(({ component }) => {
        try {
            const Component = new Function('React', 'styled', `return ${component.code}`)(React, styled);
            return <Component />;
        } catch (error) {
            console.error(`Error in DynamicComponent: ${component.name}`, error);
            throw error;
        }
    });

    const renderComponents = () => {
        if (!projectComponents?.pages || !selectedPage) return null;

        const page = projectComponents.pages.find((p) => p.name === selectedPage);

        if (!page || !page.components) return null;

        if (viewMode === 'rendered') {
            return (
                <div>
                    {page.components.map((component, index) => {
                        const status = componentStatus[component.name];

                        if (typeof component.code !== 'string' || !component.code.trim()) {
                            console.error(`Component code for ${component.name} is invalid or empty:`, component.code);
                            return (
                                <div key={index} className="component">
                                    <p>
                                        {component.name} -
                                        <span className="text-red-500">Error</span>
                                    </p>
                                    <button
                                        onClick={() => generateComponent(component.name, page.purpose, JSON.stringify(projectData.styling)).then((newComponent) => {
                                            const updatedPages = projectComponents.pages.map((p) =>
                                                p.name === page.name
                                                    ? {
                                                        ...p,
                                                        components: p.components.map((c, i) =>
                                                            i === index ? newComponent : c
                                                        ),
                                                    }
                                                    : p
                                            );
                                            setProjectComponents({ ...projectComponents, pages: updatedPages });
                                        })}
                                        className="py-2 px-4 bg-red-500 text-white rounded"
                                    >
                                        Regenerate Component
                                    </button>
                                </div>
                            );
                        }

                        try {
                            const Component = new Function('React', 'styled', `return ${component.code}`)(React, styled);

                            if (typeof Component !== 'function') {
                                throw new Error(`Generated code did not return a valid React component function.`);
                            }

                            const handleRegenerate = () => {
                                // Prompt the user for input regarding the component regeneration
                                const userModification = prompt(`Please provide details on how you'd like to modify the component "${component.name}"`);

                                if (userModification) {
                                    // If the user provides input, include it in the prompt for generating the component
                                    generateComponent(
                                        component.name,
                                        `${page.purpose}. ${userModification}`,
                                        JSON.stringify(projectData.styling)
                                    ).then((newComponent) => {
                                        const updatedPages = projectComponents.pages.map((p) => ({
                                            ...p,
                                            components: p.components.map((c) =>
                                                c.name === component.name ? newComponent : c
                                            ),
                                        }));

                                        setProjectComponents({ ...projectComponents, pages: updatedPages });
                                    }).catch(error => {
                                        console.error(`Error regenerating component '${component.name}':`, error);
                                    });
                                } else {
                                    alert('Component regeneration was canceled.');
                                }
                            };


                            return (
                                <div
                                    key={`${component.name}-${component.code.length}-${index}`}
                                    onClick={handleRegenerate} // Wrap with click event
                                    style={{ cursor: 'pointer', border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}
                                >
                                    <ErrorBoundary key={`${component.name}-${index}`} onRegenerate={() => handleRegenerate(component, index)}>
                                        <DynamicComponent component={component} />
                                    </ErrorBoundary>
                                </div>
                            );
                        } catch (error) {
                            console.error(`Failed to render component: ${component.name}`, error);
                            return (
                                <div key={index} className="component">
                                    <p>
                                        Failed to display component: {component.name} -
                                        <span className="text-red-500">Error</span>
                                    </p>
                                    <button
                                        onClick={() => generateComponent(component.name, page.purpose, JSON.stringify(projectData.styling)).then((newComponent) => {
                                            const updatedPages = projectComponents.pages.map((p) =>
                                                p.name === page.name
                                                    ? {
                                                        ...p,
                                                        components: p.components.map((c, i) =>
                                                            i === index ? newComponent : c
                                                        ),
                                                    }
                                                    : p
                                            );
                                            setProjectComponents({ ...projectComponents, pages: updatedPages });
                                        })}
                                        className=" py-2 px-4 bg-red-500 text-white rounded"
                                    >
                                        Regenerate Component
                                    </button>
                                </div>
                            );
                        }
                    })}
                </div>
            );
        } else if (viewMode === 'code') {
            return (
                <div>
                    {page.components.map((component, index) => (
                        <div key={index} className="component-code">
                            <p>{component.name} -
                                <span className={componentStatus[component.name] === 'success' ? 'text-green-500' : 'text-red-500'}>
                                    {componentStatus[component.name] || 'Unknown'}
                                </span>
                            </p>
                            <pre>{typeof component.code === 'string' ? component.code : 'Error: Invalid code'}</pre>
                        </div>
                    ))}
                </div>
            );
        }
    };

    const renderSQLCode = () => {
        return (
            <div className="bg-white p-4 rounded shadow mt-4">
                <h3 className="text-xl font-bold mb-4">Generated SQL Code</h3>
                <p>Status: <span className={sqlStatus === 'success' ? 'text-green-500' : sqlStatus === 'failed' ? 'text-red-500' : 'text-yellow-500'}>
                    {sqlStatus.charAt(0).toUpperCase() + sqlStatus.slice(1)}
                </span></p>
                {sqlStatus === 'success' ? (
                    <pre className="bg-gray-200 p-4 rounded">{sqlCode}</pre>
                ) : sqlStatus === 'failed' ? (
                    <p className="text-red-500">Failed to generate SQL code. Please check the project schema.</p>
                ) : (
                    <p>Generating SQL code...</p>
                )}
            </div>
        );
    };

    return (
        <div className="project-dashboard w-full p-4 bg-gray-100 min-h-screen">
            {loading ? (
                <div className="loading-screen bg-white p-6 rounded shadow-lg">
                    <h2 className="text-2xl font-bold mb-4">Generating Project Components...</h2>
                    <div>
                        <h3 className="font-semibold">Components</h3>
                        <ul className="list-none pl-6">
                            {Object.entries(componentStatus).map(([name, status]) => (
                                <li key={name} className="flex items-center">
                                    {/* Show ☑ for success, otherwise ▣ */}
                                    <span className="text-2xl mr-2">
                                        {status === 'success' ? '☑' : '▣'}
                                    </span>
                                    <span>
                                        {name}: <span className={`font-semibold ${status === 'success' ? 'text-green-500' : status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-semibold">APIs</h3>
                        <ul className="list-none pl-6">
                            {Object.entries(apiStatus).map(([name, status]) => (
                                <li key={name} className="flex items-center">
                                    {/* Show ☑ for success, otherwise ▣ */}
                                    <span className="text-2xl mr-2">
                                        {status === 'success' ? '☑' : '▣'}
                                    </span>
                                    <span>
                                        {name}: <span className={`font-semibold ${status === 'success' ? 'text-green-500' : status === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                                            {status.charAt(0).toUpperCase() + status.slice(1)}
                                        </span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-semibold">SQL</h3>
                        <p>
                            Status: <span className={`font-semibold ${sqlStatus === 'success' ? 'text-green-500' : sqlStatus === 'failed' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {sqlStatus === 'success' ? '☑' : '▣'} {sqlStatus.charAt(0).toUpperCase() + sqlStatus.slice(1)}
                            </span>
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="tabs flex space-x-4 mb-4">
                        <button
                            onClick={() => handleTabChange('pages')}
                            className={`tab py-2 px-4 rounded ${selectedTab === 'pages' ? 'bg-black text-white' : 'bg-white text-black border border-black'}`}
                        >
                            Pages
                        </button>
                        <button
                            onClick={() => handleTabChange('apis')}
                            className={`tab py-2 px-4 rounded ${selectedTab === 'apis' ? 'bg-black text-white' : 'bg-white text-black border border-black'}`}
                        >
                            APIs
                        </button>
                        <button
                            onClick={() => handleTabChange('tables')}
                            className={`tab py-2 px-4 rounded ${selectedTab === 'tables' ? 'bg-black text-white' : 'bg-white text-black border border-black'}`}
                        >
                            Tables
                        </button>
                        <button
                            onClick={handleShowFolderStructure}
                            className="py-2 px-4 bg-black text-white rounded bg-black"
                        >
                            Toggle Folder Structure
                        </button>
                        <button
                            onClick={handleRegenerateHeader} // Add the regenerate Header button
                            className="py-2 px-4 bg-black text-white rounded bg-black"
                        >
                            Regenerate Header
                        </button>
                        <button
                            onClick={() => setShowRegenerateAllDialog(true)}
                            className="py-2 px-4 bg-black text-white rounded bg-black"
                        >
                            Regenerate All Components
                        </button>
                    </div>

                    {selectedTab === 'pages' && (
                        <div>
                            <div className="page-tabs flex space-x-4 mb-4">
                                {renderPageTabs()}
                            </div>
                            <div className="view-mode-buttons flex space-x-2 mb-4">
                                <button
                                    onClick={() => handleViewModeChange('rendered')}
                                    className={`py-2 px-4 rounded ${viewMode === 'rendered' ? 'bg-blue-900 text-white' : 'bg-white text-black'}`}
                                >
                                    Rendered ▤
                                </button>
                                <button
                                    onClick={() => handleViewModeChange('code')}
                                    className={`py-2 px-4 rounded ${viewMode === 'code' ? 'bg-blue-900 text-white' : 'bg-white text-black'}`}
                                >
                                    Code &lt;/&gt;
                                </button>
                            </div>
                            <div className="components bg-white p-4 rounded shadow">
                                {renderComponents()}
                            </div>
                        </div>
                    )}

                    {selectedTab === 'apis' && (
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-4">APIs</h3>
                            {serverlessApis.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold mb-4">Vercel Serverless APIs</h3>
                                    <ul className="list-none pl-6 space-y-2">
                                        {serverlessApis.map((api, index) => (
                                            <li key={index} className="mb-2">
                                                <div className="flex items-center">
                                                    {/* Conditionally render ☑ if the API is generated, otherwise ▣ */}
                                                    <span className="text-2xl mr-2">
                                                        {apiStatus[api.name] === 'success' ? '☑' : '▣'}
                                                    </span>
                                                    <strong className="text-green-600">API {index + 1}: {api.name}</strong> ({api.method} {api.endpoint})
                                                    <span
                                                        className={`ml-2 w-3 h-3 rounded-full ${apiStatus[api.name] === 'success' ? 'bg-green-500' :
                                                                apiStatus[api.name] === 'failed' ? 'bg-red-500' :
                                                                    apiStatus[api.name] === 'generating' ? 'bg-yellow-500' :
                                                                        'bg-gray-500'
                                                            }`}
                                                        title={apiStatus[api.name] || 'Unknown'}
                                                    />
                                                </div>
                                                {editingApiIndex === index ? (
                                                    <div>
                                                        <textarea
                                                            className="w-full p-2 mt-2 border rounded"
                                                            value={api.code}
                                                            onChange={(e) => handleApiCodeChange(index, e.target.value)}
                                                            rows={10}
                                                        />
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <button
                                                                className="bg-black text-white py-1 px-3 rounded"
                                                                onClick={() => handleSaveApiCode(index)}
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                className="bg-gray-500 text-white py-1 px-3 rounded"
                                                                onClick={() => setEditingApiIndex(-1)}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <pre className="bg-gray-200 p-2 rounded mt-2">{api.code}</pre>
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <button
                                                                className="bg-yellow-500 text-white py-1 px-3 rounded"
                                                                onClick={() => setEditingApiIndex(index)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="bg-red-500 text-white py-1 px-3 rounded"
                                                                onClick={() => handleOpenPromptDialog(index)}
                                                            >
                                                                Regenerate with Prompt
                                                            </button>
                                                            <button
                                                                className="bg-black text-white py-1 px-3 rounded"
                                                                onClick={() => handleRegenerateApiWithoutPrompt(index)}
                                                            >
                                                                Regenerate
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            )}
                        </div>
                    )}

                    {selectedTab === 'tables' && (
                        <div className="bg-white p-4 rounded shadow">
                            <h3 className="text-xl font-bold mb-4">Tables</h3>
                            <ul className="list-disc pl-6 space-y-4">
                                {projectComponents?.databaseSchema?.map((table, index) => (
                                    <li key={index}>
                                        <strong className="text-blue-600">{table.tableName}</strong>
                                        <pre className="bg-gray-200 p-2 rounded mt-2">{JSON.stringify(table.columns, null, 2)}</pre>
                                        {table.relationships.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-bold">Relationships</h4>
                                                <pre className="bg-gray-200 p-2 rounded mt-2">{JSON.stringify(table.relationships, null, 2)}</pre>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            {renderSQLCode()} {/* Render SQL Code in Tables Tab */}
                        </div>
                    )}

                    {showFolderStructure && (
                        folderStructure ? (
                            <ProjectFolderStructure structure={folderStructure} projectData={projectData} sqlCode={sqlCode} /> // Pass SQL code
                        ) : (
                            <div>Unable to generate folder structure. Please check the project data.</div>
                        )
                    )}

                    {showPromptDialog && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                            <div className="bg-white p-6 rounded shadow-lg">
                                <h3 className="text-xl font-bold mb-4">Regenerate API Code</h3>
                                <textarea
                                    value={newPrompt}
                                    onChange={(e) => setNewPrompt(e.target.value)}
                                    className="border p-2 w-full mb-4 rounded"
                                    rows="4"
                                    placeholder="Enter additional prompt here"
                                ></textarea>
                                <div className="flex justify-end space-x-2">
                                    <button onClick={handleClosePromptDialog} className="bg-gray-500 text-white py-1 px-3 rounded">Cancel</button>
                                    <button onClick={handleRegenerateApiWithPrompt} className="bg-black text-white py-1 px-3 rounded">Regenerate</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showRegenerateAllDialog && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
                            <div className="bg-white p-6 rounded shadow-lg">
                                <h3 className="text-xl font-bold mb-4">Regenerate All Components</h3>
                                <textarea
                                    value={regeneratePrompt}
                                    onChange={(e) => setRegeneratePrompt(e.target.value)}
                                    className="border p-2 w-full mb-4 rounded"
                                    rows="4"
                                    placeholder="Enter additional prompt here (e.g., 'Give it a more corporate look')"
                                ></textarea>
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => setShowRegenerateAllDialog(false)} className="bg-gray-500 text-white py-1 px-3 rounded">Cancel</button>
                                    <button onClick={handleRegenerateAllComponents} className="bg-black text-white py-1 px-3 rounded">Regenerate</button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
