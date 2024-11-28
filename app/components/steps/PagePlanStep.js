import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

export default function PagePlanStep({
    data,
    onUpdate,
    onAddPage,
    onDeletePage,
    onRegenerate,
    onContextCreate,
    onPhaseComplete, // New prop for notifying the dashboard
}) {
    const [newPage, setNewPage] = useState({ name: '', purpose: '' });
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [componentContext, setComponentContext] = useState({});
    const [loadingContext, setLoadingContext] = useState(false);
    const [contextError, setContextError] = useState(null);
    const [isContextConfirmed, setIsContextConfirmed] = useState(false); // Track context confirmation

    const handlePageChange = (index, e) => {
        const { name, value } = e.target;
        const updatedPages = [...data];
        updatedPages[index][name] = value;
        onUpdate(updatedPages);
    };

    const handleAddComponent = (pageIndex, newComponent) => {
        const updatedPages = [...data];
        updatedPages[pageIndex].components.push(newComponent);
        onUpdate(updatedPages);
    };

    const handleDeleteComponent = (pageIndex, componentIndex) => {
        const updatedPages = [...data];
        updatedPages[pageIndex].components.splice(componentIndex, 1);
        onUpdate(updatedPages);
    };

    const handleComponentChange = (pageIndex, componentIndex, e) => {
        const { value } = e.target;
        const updatedPages = [...data];
        updatedPages[pageIndex].components[componentIndex] = value;
        onUpdate(updatedPages);
    };

    const handleDragEnd = (result, pageIndex) => {
        if (!result.destination) return;

        const updatedPages = [...data];
        const [reorderedItem] = updatedPages[pageIndex].components.splice(result.source.index, 1);
        updatedPages[pageIndex].components.splice(result.destination.index, 0, reorderedItem);
        onUpdate(updatedPages);
    };

    const handleAddPage = () => {
        if (newPage.name.trim() && newPage.purpose.trim()) {
            onAddPage({ ...newPage, components: [] });
            setNewPage({ name: '', purpose: '' }); // Clear form
        }
    };

    const confirmPagePlan = async () => {
        setIsConfirmed(true);
        await generateComponentContext(); // Automatically generate context after confirmation
    };

    const generateComponentContext = async () => {
        setLoadingContext(true);
        setContextError(null);

        try {
            const response = await onContextCreate(`Page Plan: ${JSON.stringify(data)}`);
            setComponentContext(response); // Store the returned context data
            setLoadingContext(false);
        } catch (error) {
            setContextError('Failed to generate component context. Please try again.');
            setLoadingContext(false);
        }
    };

    const handleContextFieldChange = (component, field, value) => {
        setComponentContext((prev) => ({
            ...prev,
            [component]: {
                ...prev[component],
                [field]: value,
            },
        }));
    };

    const confirmContext = () => {
        setIsContextConfirmed(true);
        onPhaseComplete({ pages: data, context: componentContext }); // Pass data to parent and proceed
    };

    return (
        <div className="page-plan-step max-w-5xl w-full mx-auto p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Page Plan</h2>
            <button onClick={onRegenerate} className="btn mb-4">
                Regenerate Plan
            </button>

            {data.map((page, pageIndex) => (
                <div key={pageIndex} className="mb-4 p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 mr-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                            <input
                                type="text"
                                name="name"
                                value={page.name}
                                onChange={(e) => handlePageChange(pageIndex, e)}
                                disabled={isConfirmed}
                                className="border border-gray-300 p-2 w-full rounded"
                            />
                            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Page Purpose</label>
                            <textarea
                                name="purpose"
                                value={page.purpose}
                                onChange={(e) => handlePageChange(pageIndex, e)}
                                disabled={isConfirmed}
                                className="border border-gray-300 p-2 w-full rounded h-24"
                            ></textarea>
                        </div>
                        {!isConfirmed && (
                            <button
                                onClick={() => onDeletePage(pageIndex)}
                                className="bg-red-500 text-white p-2 rounded-full"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <label className="block text-sm font-medium text-gray-700 mb-2">Components</label>
                    <DragDropContext onDragEnd={(result) => handleDragEnd(result, pageIndex)}>
                        <Droppable droppableId={`droppable-${pageIndex}`}>
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef}>
                                    {page.components.map((component, componentIndex) => (
                                        <Draggable
                                            key={componentIndex}
                                            draggableId={`component-${pageIndex}-${componentIndex}`}
                                            index={componentIndex}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="mb-2 bg-gray-50 p-4 rounded shadow"
                                                >
                                                    <div className="flex items-center">
                                                        <input
                                                            type="text"
                                                            value={component}
                                                            onChange={(e) =>
                                                                handleComponentChange(
                                                                    pageIndex,
                                                                    componentIndex,
                                                                    e
                                                                )
                                                            }
                                                            disabled={isConfirmed}
                                                            className="border p-2 rounded w-full"
                                                        />
                                                    </div>

                                                    {/* Display Editable Component Context */}
                                                    {componentContext[component] && (
                                                        <div className="mt-4 p-4 bg-white rounded border border-gray-300">
                                                            <h4 className="text-lg font-bold mb-2">
                                                                {component} Context
                                                            </h4>
                                                            {Object.entries(componentContext[component]).map(
                                                                ([key, value]) => (
                                                                    <div key={key} className="mb-2">
                                                                        <label className="block text-sm font-medium text-gray-700">
                                                                            {key}
                                                                        </label>
                                                                        <input
                                                                            type="text"
                                                                            value={value}
                                                                            onChange={(e) =>
                                                                                handleContextFieldChange(
                                                                                    component,
                                                                                    key,
                                                                                    e.target.value
                                                                                )
                                                                            }
                                                                            className="border p-2 rounded w-full"
                                                                        />
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            ))}

            {isConfirmed && !isContextConfirmed && (
                <div className="mt-6">
                    {loadingContext ? (
                        <p className="text-blue-500 font-semibold">Generating Component Context...</p>
                    ) : contextError ? (
                        <p className="text-red-600 font-semibold">{contextError}</p>
                    ) : (
                        <button
                            onClick={confirmContext}
                            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                        >
                            Confirm Context and Proceed
                        </button>
                    )}
                </div>
            )}

            {!isConfirmed && (
                <button
                    onClick={confirmPagePlan}
                    className="mt-4 bg-yellow-500 text-white px-4 py-2 rounded"
                >
                    Confirm Page Plan
                </button>
            )}
        </div>
    );
}
