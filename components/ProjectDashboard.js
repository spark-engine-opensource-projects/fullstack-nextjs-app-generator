import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { generateDynamicallyRenderingReactComponent, generateServerlessApi, generateSQLDatabaseQuery } from '../utils/api';
import ErrorBoundary from './ErrorBoundary';
import ProjectFolderStructure from './ProjectFolderStructure';
import useGenerateFolderStructure from '../utils/folderStructure';
import DynamicComponentWrapper from './DynamicComponentWrapper';
import { ResizableBox } from 'react-resizable';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import GridLayout from 'react-grid-layout'; // Import GridLayout instead of ResponsiveReactGridLayout
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Sidebar from './Sidebar';
import DropArea from './DropArea';
import { ChromePicker } from 'react-color';

//Is okay
import styled from 'styled-components';
import { IconFoldDown, IconAdjustments, IconAdjustmentsOff, IconZoomCodeFilled, IconZoomCode, IconColorPicker, IconColorPickerOff } from '@tabler/icons-react';

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
    const [backgroundColor, setBackgroundColor] = useState('#ffffff');
    const [colorPickerVisible, setColorPickerVisible] = useState(false);
    const [pageLayouts, setPageLayouts] = useState({});
    const [gridWidth, setGridWidth] = useState('95vw');
    const [gridHeight, setGridHeight] = useState(600);
    const [layout, setLayout] = useState([]);
    const [hideDragging, setHideDragging] = useState(false);
    const [projectComponents, setProjectComponents] = useState({
        pages: projectData.pages.map((page) => ({
            ...page,
            instances: [],
            components: [], // Ensure no components are pre-rendered
        })),
    });
    const [droppedComponents, setDroppedComponents] = useState([]); // Track dropped components
    const [showPagesDropdown, setShowPagesDropdown] = useState(false);
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

    const [availableComponents, setAvailableComponents] = useState([]);
    const [dropAreaHeight, setDropAreaHeight] = useState(800); // Default height
    const [isResizing, setIsResizing] = useState(false);
    const [initialMouseY, setInitialMouseY] = useState(0);
    const [initialHeight, setInitialHeight] = useState(800); // Match initial dropAreaHeight

    useEffect(() => {
        const components = projectComponents.pages.flatMap((page) =>
            page.components.map((component) => component.name)
        );
        setAvailableComponents(components);
    }, [projectComponents]);


    useEffect(() => {
        const enhancedProjectData = {
            ...projectData,
            pages: projectData.pages.map((page) => {
                const pageInstances = droppedComponents.filter(
                    (comp) => comp.page === page.name
                );
                return {
                    ...page,
                    components: pageInstances.map((instance) => ({
                        name: instance.name,
                        code: instance.instanceCode || instance.code,
                        position: instance.position,
                        dimensions: instance.dimensions,
                    })),
                };
            }),
        };

        const newStructure = useGenerateFolderStructure(
            enhancedProjectData,
            projectComponents,
            serverlessApis,
            sqlCode
        );
        setFolderStructure(newStructure);
    }, [projectData, projectComponents, droppedComponents, serverlessApis, sqlCode]);

    const handleShowFolderStructure = () => {
        setShowFolderStructure(prev => !prev);
    };

    const handleDropComponent = useCallback(
        (componentName, offset) => {
            const dropAreaRect = document
                .getElementById('drop-area')
                .getBoundingClientRect();
            const x = offset.x - dropAreaRect.left;
            const y = offset.y - dropAreaRect.top;

            // Find component data
            const componentData = projectComponents.pages
                .flatMap((page) => page.components)
                .find((comp) => comp.name === componentName);

            if (componentData) {
                const newInstance = {
                    ...componentData,
                    id: uuidv4(),
                    position: { x, y },
                    dimensions: { width: 500, height: 300 },
                    page: selectedPage,
                    instanceCode: componentData.code, // Track instance-specific code
                };

                // Update dropped components
                setDroppedComponents((prev) => [...prev, newInstance]);

                // Update project components with instance data
                setProjectComponents((prev) => ({
                    ...prev,
                    pages: prev.pages.map((page) =>
                        page.name === selectedPage
                            ? {
                                ...page,
                                instances: [...page.instances, newInstance],
                            }
                            : page
                    ),
                }));
            }
        },
        [selectedPage, projectComponents]
    );


    useEffect(() => {
        const generateComponents = async () => {
            try {
                setLoading(true);
                // First, handle page selection
                if (selectedPage === '' || selectedPage === null) {
                    setSelectedPage(projectData.pages[0].name);
                }

                // Generate components first
                const uniqueComponents = new Set();
                projectData.pages.forEach(page => {
                    page.components.forEach(component => {
                        uniqueComponents.add(component);
                    });
                });

                const componentMap = {};
                const componentResults = await Promise.allSettled(
                    Array.from(uniqueComponents).map(async (component) => {
                        updateComponentStatus(component, 'generating');
                        try {
                            const generatedComponent = await generateComponent(
                                component,
                                "", // Remove page purpose
                                JSON.stringify(projectData.styling)
                            );
                            componentMap[component] = generatedComponent;
                            updateComponentStatus(component, 'success');
                        } catch (error) {
                            console.error(`Failed to generate component ${component}:`, error);
                            updateComponentStatus(component, 'failed');
                        }
                    })
                );

                // Only proceed if at least some components generated successfully
                if (Object.keys(componentMap).length > 0) {
                    setProjectComponents(prevState => ({
                        ...projectData,
                        pages: projectData.pages.map(page => ({
                            ...page,
                            components: page.components.map(component => componentMap[component] || null)
                        }))
                    }));

                    // Then handle APIs
                    if (projectData.apis?.length > 0) {
                        const apiResults = await Promise.allSettled(
                            projectData.apis.map(async (api) => {
                                updateApiStatus(api.name, 'generating');
                                const prompt = constructApiPrompt(api, projectData.databaseSchema);
                                return retryApiGeneration(prompt, api.name);
                            })
                        );

                        const successfulApis = apiResults
                            .map((result, index) => ({
                                ...projectData.apis[index],
                                code: result.status === 'fulfilled' ? result.value : null
                            }))
                            .filter(api => api.code !== null);

                        setServerlessApis(successfulApis);
                    }

                    // Finally, handle SQL
                    if (projectData.databaseSchema) {
                        setSqlStatus('generating');
                        const generatedSQL = await generateSQLDatabaseQuery(
                            JSON.stringify(projectData.databaseSchema)
                        );
                        setSqlCode(generatedSQL);
                        setSqlStatus('success');
                    }
                } else {
                    throw new Error('No components were generated successfully');
                }
            } catch (error) {
                console.error('Error in component generation:', error);
                // Don't set loading to false here - let the finally block handle it
            } finally {
                setLoading(false);
            }
        };

        let mounted = true;

        const initializeGeneration = async () => {
            try {
                if (mounted) {
                    await generateComponents();
                }
            } catch (error) {
                console.error('Fatal error during generation:', error);
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeGeneration();

        return () => {
            mounted = false;
        };
    }, []);


    const updateComponentStatus = (componentName, status) => {
        setComponentStatus(prevStatus => {
            const newStatus = {
                ...prevStatus,
                [componentName]: status
            };

            // Check if all components are either success or failed
            const isComplete = Object.values(newStatus).every(
                status => status === 'success' || status === 'failed'
            );

            if (isComplete && status === 'failed') {
                setLoading(false);
            }

            return newStatus;
        });
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

    const generateComponent = async (componentName, stylingGuide) => {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                // Simplified prompt for more reliable generation
                const prompt = `Generate a React component named ${componentName}. Follow this styling guide: ${stylingGuide}. The component should be a functional component that uses styled-components.`;
                const result = await generateDynamicallyRenderingReactComponent(prompt);

                const code = typeof result === 'string' ? result : result?.code;

                if (!code || typeof code !== 'string') {
                    throw new Error('Invalid code generated');
                }

                // Validate the code structure
                if (!code.includes('export default') || !code.includes('return')) {
                    throw new Error('Generated code missing required React component structure');
                }

                // Test component compilation
                try {
                    new Function('React', 'styled', `${code}`);
                    updateComponentStatus(componentName, 'success');
                    return { name: componentName, code };
                } catch (compileError) {
                    throw new Error(`Component compilation failed: ${compileError.message}`);
                }
            } catch (error) {
                console.error(`Generation attempt ${retryCount + 1} failed for ${componentName}:`, error);
                retryCount++;
                updateComponentStatus(componentName, `retrying (${retryCount})`);
            }
        }

        updateComponentStatus(componentName, 'failed');
        return {
            name: componentName,
            code: `const ${componentName} = () => <div>Failed to generate component</div>; export default ${componentName};`
        };
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
        console.log(page)
    };

    const handlePageSelect = (pageName) => {
        if (selectedPage) {
            setPageLayouts((prevLayouts) => ({
                ...prevLayouts,
                [selectedPage]: {
                    layout,
                    gridHeight,
                },
            }));
        }

        const savedPageData = pageLayouts[pageName];
        if (savedPageData) {
            setLayout(savedPageData.layout || []);
            setGridHeight(savedPageData.gridHeight || 600);
        } else {
            setLayout([]);
            setGridHeight(600);
        }

        setSelectedPage(pageName);
        setSelectedTab('pages');
        setShowPagesDropdown(false);
    };

    const handleViewModeChange = (mode) => {
        setViewMode(mode);
    };

    const renderPageTabs = () => {
        return projectComponents?.pages?.map((page) => (
            <button
                key={page.name}
                onClick={() => handlePageSelect(page.name)}
                className={`tab ${selectedPage === page.name ? 'tab-active' : ''}`}
            >
                {page.name}
            </button>
        ));
    };

    const DynamicComponent = React.memo(({ component }) => {
        const { code, name } = component;

        try {
            // Dynamically create the React component
            const GeneratedComponent = new Function('React', 'styled', `return ${code}`)(
                React,
                styled
            );

            // Render the dynamically created component
            return <GeneratedComponent />;
        } catch (error) {
            console.error(`Error rendering dynamic component "${name}":`, error);
            return (
                <div style={{ color: 'red' }}>
                    Error rendering component: {name}
                </div>
            );
        }
    });

    useEffect(() => {
        if (selectedPage) {
            const savedPageData = pageLayouts[selectedPage];
            if (savedPageData) {
                if (
                    JSON.stringify(layout) !== JSON.stringify(savedPageData.layout) ||
                    gridHeight !== (savedPageData.gridHeight || 600)
                ) {
                    setLayout(savedPageData.layout || []);
                    setGridHeight(savedPageData.gridHeight || 600);
                }
            } else {
                // Initialize layout for new page
                const defaultLayout = projectComponents.pages
                    .find((p) => p.name === selectedPage)
                    ?.components.map((component, index) => ({
                        i: `${component.name}-${index}`,
                        x: (index * 2) % 12,
                        y: Math.floor((index * 2) / 12) * 2,
                        w: 2,
                        h: 2,
                    })) || [];

                if (JSON.stringify(layout) !== JSON.stringify(defaultLayout)) {
                    setLayout(defaultLayout);
                }
            }
        }
    }, [selectedPage, pageLayouts, layout, gridHeight, projectComponents.pages]);


    const handleResizeStart = (event) => {
        setIsResizing(true);
        setInitialMouseY(event.clientY);
        setInitialHeight(dropAreaHeight);
    };

    const handleResizeMove = (event) => {
        if (isResizing) {
            const deltaY = event.clientY - initialMouseY;
            const newHeight = Math.max(300, initialHeight + deltaY); // Minimum height of 300px
            setDropAreaHeight(newHeight);
        }
    };

    const handleResizeStop = () => {
        setIsResizing(false);
    };

    const handleRemoveComponentInstance = (id) => {
        setDroppedComponents((prev) => prev.filter((comp) => comp.id !== id));
    };


    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeStop);
        }

        return () => {
            document.removeEventListener('mousemove', handleResizeMove);
            document.removeEventListener('mouseup', handleResizeStop);
        };
    }, [isResizing, handleResizeMove, handleResizeStop]);

    const handleLayoutChange = (newLayout) => {
        setLayout(newLayout);
        const maxHeight = Math.max(...newLayout.map((item) => item.y + item.h)) * 100;
        setGridHeight(maxHeight + 100);

        if (selectedPage) {
            setPageLayouts((prevLayouts) => ({
                ...prevLayouts,
                [selectedPage]: {
                    layout: newLayout,
                    gridHeight: maxHeight + 100,
                },
            }));
        }
    };

    const handleComponentCodeUpdate = (updatedCode, instanceId) => {
        // Update dropped components
        setDroppedComponents((prev) =>
            prev.map((comp) =>
                comp.id === instanceId
                    ? { ...comp, instanceCode: updatedCode }
                    : comp
            )
        );

        // Update project components
        setProjectComponents((prev) => ({
            ...prev,
            pages: prev.pages.map((page) => ({
                ...page,
                instances: page.instances.map((instance) =>
                    instance.id === instanceId
                        ? { ...instance, instanceCode: updatedCode }
                        : instance
                ),
            })),
        }));
    };

    const handleResize = (id, newDimensions) => {
        setDroppedComponents((prev) =>
            prev.map((comp) =>
                comp.id === id
                    ? {
                        ...comp,
                        dimensions: newDimensions,
                    }
                    : comp
            )
        );
    };

    const renderComponentsInDropArea = () => {
        const activePageComponents = droppedComponents.filter(
            (comp) => comp.page === selectedPage
        );

        return activePageComponents.map((component) => {
            try {
                return (
                    <DynamicComponentWrapper
                        key={component.id}
                        componentId={component.id}
                        position={component.position || { x: 0, y: 0 }}
                        dimensions={component.dimensions}
                        componentName={component.name}
                        hideDragging={hideDragging}
                        componentCode={component.code}
                        onComponentCodeUpdate={(updatedCode) => handleComponentCodeUpdate(updatedCode, component.id)}
                        onResize={(newDimensions) => handleResize(component.id, newDimensions)}
                        onRemove={() => handleRemoveComponentInstance(component.id)}
                        onPositionChange={(newPosition) => {
                            const dropArea = document.getElementById('drop-area');
                            if (dropArea) {
                                const dropAreaRect = dropArea.getBoundingClientRect();
                                const constrainedPosition = {
                                    x: Math.max(
                                        0,
                                        Math.min(newPosition.x, dropAreaRect.width - 100)
                                    ),
                                    y: Math.max(
                                        0,
                                        Math.min(newPosition.y, dropAreaRect.height - 50)
                                    ),
                                };
                                setDroppedComponents((prev) =>
                                    prev.map((comp) =>
                                        comp.id === component.id
                                            ? { ...comp, position: constrainedPosition }
                                            : comp
                                    )
                                );
                            }
                        }}
                    />
                );
            } catch (error) {
                console.error(`Error rendering component "${component.name}":`, error);
                return (
                    <div key={component.id} style={{ color: 'red' }}>
                        Error rendering component: {component.name}
                    </div>
                );
            }
        });
    };


    const renderComponents = () => {
        if (!projectComponents?.pages || !selectedPage) return null;

        const page = projectComponents.pages.find((p) => p.name === selectedPage);

        if (!page || !page.components) return null;

        if (viewMode === 'rendered') {
            return (
                <DndProvider backend={HTML5Backend}>
                    <div style={{ display: 'flex' }}>
                        {/* Sidebar */}
                        <Sidebar
                            availableComponents={availableComponents}
                            droppedComponents={droppedComponents.map((comp) => comp.name)}
                        />

                        {/* Drop Area */}
                        <div style={{ flex: 1, position: 'relative' }}>
                            <DropArea onDropComponent={handleDropComponent} selectedPage={selectedPage}>
                                <div
                                    id="drop-area"
                                    style={{
                                        width: '100%',
                                        height: `${dropAreaHeight}px`,
                                        position: 'relative',
                                        backgroundColor: backgroundColor,
                                        border: '1px solid #ddd',
                                    }}
                                >
                                    {renderComponentsInDropArea()}
                                    {/* Resizable handle */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            display: 'flex',
                                            width: '100%',
                                            height: '15px',
                                            backgroundColor: '#ddd',
                                            cursor: 'row-resize',
                                            userSelect: 'none',
                                            alignContent: 'center',
                                            justifyContent: 'center',
                                            padding: '5px',
                                            color: 'white'
                                        }}
                                        onMouseDown={handleResizeStart}
                                    ><IconFoldDown size={18} /></div>
                                </div>
                            </DropArea>
                        </div>
                    </div>
                </DndProvider>
            );
        } else if (viewMode === 'code') {
            return (
                <div>
                    {page.components.map((component, index) => (
                        <div key={index} className="component-code">
                            <p>
                                {component.name} -{' '}
                                <span
                                    className={
                                        componentStatus[component.name] === 'success'
                                            ? 'text-green-500'
                                            : 'text-red-500'
                                    }
                                >
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

    const toggleColorPicker = () => {
        setColorPickerVisible(!colorPickerVisible);
    };

    const handleColorChange = (color) => {
        setBackgroundColor(color.hex);
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
                    <div className="tabs flex justify-center space-x-2 mb-6 relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowPagesDropdown((prev) => !prev)}
                                className={`tab py-1.5 px-4 text-sm font-semibold rounded-full transition-colors duration-200 ${selectedTab === 'pages' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Pages
                            </button>
                            {showPagesDropdown && (
                                <div className="absolute mt-2 w-64 bg-white border border-gray-300 rounded shadow-md z-10">
                                    {projectComponents.pages.map((page, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handlePageSelect(page.name)}
                                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${selectedPage === page.name ? 'bg-gray-200' : ''
                                                }`}
                                        >
                                            {page.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleTabChange('apis')}
                            className={`tab py-1.5 px-4 text-sm font-semibold rounded-full transition-colors duration-200 ${selectedTab === 'apis' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            APIs
                        </button>
                        <button
                            onClick={() => handleTabChange('tables')}
                            className={`tab py-1.5 px-4 text-sm font-semibold rounded-full transition-colors duration-200 ${selectedTab === 'tables' ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            Tables
                        </button>
                        <button
                            onClick={handleShowFolderStructure}
                            className="py-1.5 px-4 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                        >
                            Toggle Folder Structure
                        </button>
                        <button
                            onClick={handleRegenerateHeader}
                            className="py-1.5 px-4 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                        >
                            Regenerate Header
                        </button>
                        <button
                            onClick={() => setShowRegenerateAllDialog(true)}
                            className="py-1.5 px-4 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-200"
                        >
                            Regenerate All Components
                        </button>
                    </div>

                    {/* Render selected tab content */}
                    {selectedTab === 'pages' && (
                        <div>
                            <div className="page-tabs flex justify-center space-x-4 mb-4">
                                {renderPageTabs()}
                            </div>
                            <div className="view-mode-buttons justify-center flex space-x-2 mb-4">
                                <button
                                    onClick={() => setViewMode(viewMode === 'code' ? 'rendered' : 'code')}
                                    title={viewMode === 'code' ? 'Switch to Rendered View' : 'Switch to Code View'}
                                >
                                    {viewMode === 'code' ? <IconZoomCodeFilled size={24} /> : <IconZoomCode size={24} />}
                                </button>
                                <button
                                    onClick={() => setHideDragging((prev) => !prev)}
                                >
                                    {hideDragging ? <IconAdjustmentsOff /> : <IconAdjustments />}
                                </button>
                                <button onClick={toggleColorPicker} style={{ margin: '10px' }}>
                                    {colorPickerVisible ? <IconColorPicker /> : <IconColorPickerOff />}
                                </button>
                                {colorPickerVisible && (
                                    <div style={{ position: 'absolute', top: 20, zIndex: 1000 }}>
                                        <ChromePicker color={backgroundColor} onChange={handleColorChange} />
                                    </div>
                                )}
                            </div>
                            {!showFolderStructure && (
                                <div className="bg-white p-4 rounded shadow">
                                    {renderComponents()}
                                </div>
                            )}
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
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '70vh',
                                padding: '20px',
                                backgroundColor: '#fff',
                                borderRadius: '7px',
                                marginTop: '5px'
                            }}
                        >
                            {folderStructure ? (
                                <ProjectFolderStructure
                                    structure={folderStructure}
                                    projectData={projectData}
                                    sqlCode={sqlCode}
                                />
                            ) : (
                                <div>Unable to generate folder structure. Please check the project data.</div>
                            )}
                        </div>
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
