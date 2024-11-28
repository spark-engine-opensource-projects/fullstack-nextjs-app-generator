import React, { useState, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const VALIDATION_RULES = {
    name: /^[a-zA-Z0-9\s-_]{3,50}$/,
    purpose: /^.{10,500}$/
};

export default function PagePlanStep({
    data,
    onUpdate,
    onAddPage,
    onDeletePage,
    onRegenerate,
    onContextCreate,
    onPhaseComplete,
}) {
    const [state, setState] = useState({
        newPage: { name: '', purpose: '' },
        newComponent: '',
        isConfirmed: false,
        componentContext: {},
        loadingContext: false,
        contextError: null,
        isContextConfirmed: false,
        validationErrors: {}
    });

    const updateState = useCallback(updates => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const validateField = useCallback((name, value) => {
        if (!VALIDATION_RULES[name]) return true;
        return VALIDATION_RULES[name].test(value);
    }, []);

    const handlePageChange = useCallback((index, e) => {
        const { name, value } = e.target;
        const isValid = validateField(name, value);
        
        updateState({
            validationErrors: {
                ...state.validationErrors,
                [name]: isValid ? null : `Invalid ${name} format`
            }
        });

        if (isValid) {
            onUpdate(pages => {
                const updated = [...pages];
                updated[index][name] = value;
                return updated;
            });
        }
    }, [onUpdate, state.validationErrors, validateField]);

    const handleAddComponent = useCallback((pageIndex) => {
        if (!state.newComponent.trim()) return;
        
        onUpdate(pages => {
            const updated = [...pages];
            if (!updated[pageIndex].components) {
                updated[pageIndex].components = [];
            }
            updated[pageIndex].components.push(state.newComponent);
            return updated;
        });
        updateState({ newComponent: '' });
    }, [state.newComponent, onUpdate]);

    const handleDeleteComponent = useCallback((pageIndex, componentIndex) => {
        onUpdate(pages => {
            const updated = [...pages];
            updated[pageIndex].components.splice(componentIndex, 1);
            return updated;
        });
    }, [onUpdate]);

    const handleDragEnd = useCallback((result, pageIndex) => {
        if (!result.destination) return;
        
        onUpdate(pages => {
            const updated = [...pages];
            const [reorderedItem] = updated[pageIndex].components.splice(result.source.index, 1);
            updated[pageIndex].components.splice(result.destination.index, 0, reorderedItem);
            return updated;
        });
    }, [onUpdate]);

    const handleNewPageChange = useCallback((e) => {
        const { name, value } = e.target;
        const isValid = validateField(name, value);
        
        updateState({
            newPage: { ...state.newPage, [name]: value },
            validationErrors: {
                ...state.validationErrors,
                [name]: isValid ? null : `Invalid ${name} format`
            }
        });
    }, [state.newPage, state.validationErrors, validateField]);

    const handleAddPage = useCallback(() => {
        const { name, purpose } = state.newPage;
        if (name.trim() && purpose.trim() && !Object.values(state.validationErrors).some(error => error)) {
            onAddPage({ ...state.newPage, components: [] });
            updateState({ newPage: { name: '', purpose: '' } });
        }
    }, [state.newPage, state.validationErrors, onAddPage]);

    const confirmPagePlan = useCallback(async () => {
        updateState({ isConfirmed: true, loadingContext: true });
        try {
            const response = await onContextCreate(`Page Plan: ${JSON.stringify(data)}`);
            updateState({ componentContext: response, loadingContext: false });
        } catch (error) {
            updateState({
                contextError: 'Failed to generate component context. Please try again.',
                loadingContext: false
            });
        }
    }, [data, onContextCreate]);

    const confirmContext = useCallback(() => {
        updateState({ isContextConfirmed: true });
        onPhaseComplete({ pages: data, context: state.componentContext });
    }, [data, state.componentContext, onPhaseComplete]);

    const canConfirmPlan = useMemo(() => {
        return data.length > 0 && 
               data.every(page => page.name && page.purpose && page.components?.length > 0) &&
               !Object.values(state.validationErrors).some(error => error);
    }, [data, state.validationErrors]);

    return (
        <div className="page-plan-step max-w-5xl w-full mx-auto p-6 bg-gray-50 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Page Plan</h2>
                <button 
                    onClick={onRegenerate} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                    Regenerate Plan
                </button>
            </div>
    
            {!state.isConfirmed && (
                <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Add New Page</h3>
                    <div className="grid gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
                            <input
                                type="text"
                                name="name"
                                value={state.newPage.name}
                                onChange={handleNewPageChange}
                                className={`border p-2 w-full rounded ${state.validationErrors.name ? 'border-red-500' : ''}`}
                            />
                            {state.validationErrors.name && (
                                <p className="text-red-500 text-sm mt-1">{state.validationErrors.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Page Purpose</label>
                            <textarea
                                name="purpose"
                                value={state.newPage.purpose}
                                onChange={handleNewPageChange}
                                className={`border p-2 w-full rounded h-24 ${state.validationErrors.purpose ? 'border-red-500' : ''}`}
                            />
                            {state.validationErrors.purpose && (
                                <p className="text-red-500 text-sm mt-1">{state.validationErrors.purpose}</p>
                            )}
                        </div>
                        <button
                            onClick={handleAddPage}
                            disabled={Object.values(state.validationErrors).some(error => error)}
                            className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors
                                ${Object.values(state.validationErrors).some(error => error) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Add Page
                        </button>
                    </div>
                </div>
            )}
    
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
                                disabled={state.isConfirmed}
                                className={`border p-2 w-full rounded ${state.isConfirmed ? 'bg-gray-100' : ''}`}
                            />
                            <label className="block text-sm font-medium text-gray-700 mt-4 mb-1">Page Purpose</label>
                            <textarea
                                name="purpose"
                                value={page.purpose}
                                onChange={(e) => handlePageChange(pageIndex, e)}
                                disabled={state.isConfirmed}
                                className={`border p-2 w-full rounded h-24 ${state.isConfirmed ? 'bg-gray-100' : ''}`}
                            />
                        </div>
                        {!state.isConfirmed && (
                            <button
                                onClick={() => onDeletePage(pageIndex)}
                                className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
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
                                            isDragDisabled={state.isConfirmed}
                                        >
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="mb-2 bg-gray-50 p-4 rounded shadow-sm"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">☰</span>
                                                        <div className="flex-1">
                                                            {component}
                                                            {state.isConfirmed && state.componentContext[component] && (
                                                                <div className="mt-4 p-4 bg-white rounded border border-gray-300">
                                                                    <h4 className="text-lg font-bold mb-2">{component} Context</h4>
                                                                    {Object.entries(state.componentContext[component]).map(([key, value]) => (
                                                                        <div key={key} className="mb-2">
                                                                            <label className="block text-sm font-medium text-gray-700">
                                                                                {key}
                                                                            </label>
                                                                            <input
                                                                                type="text"
                                                                                value={value}
                                                                                onChange={(e) => updateState({
                                                                                    componentContext: {
                                                                                        ...state.componentContext,
                                                                                        [component]: {
                                                                                            ...state.componentContext[component],
                                                                                            [key]: e.target.value
                                                                                        }
                                                                                    }
                                                                                })}
                                                                                className="border p-2 rounded w-full"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!state.isConfirmed && (
                                                            <button
                                                                onClick={() => handleDeleteComponent(pageIndex, componentIndex)}
                                                                className="text-red-500 hover:text-red-600 transition-colors"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
    
                    {!state.isConfirmed && (
                        <div className="flex items-center mt-4">
                            <input
                                type="text"
                                value={state.newComponent}
                                onChange={(e) => updateState({ newComponent: e.target.value })}
                                placeholder="New Component"
                                className="border p-2 rounded flex-1"
                            />
                            <button
                                onClick={() => handleAddComponent(pageIndex)}
                                className="ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                Add Component
                            </button>
                        </div>
                    )}
                </div>
            ))}
    
            {!state.isConfirmed && (
                <button
                    onClick={confirmPagePlan}
                    disabled={!canConfirmPlan}
                    className={`mt-4 bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors
                        ${!canConfirmPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Confirm Page Plan
                </button>
            )}
    
            {state.isConfirmed && !state.isContextConfirmed && (
                <div className="mt-6">
                    {state.loadingContext ? (
                        <p className="text-blue-500 font-semibold">Generating Component Context...</p>
                    ) : state.contextError ? (
                        <div>
                            <p className="text-red-600 font-semibold mb-2">{state.contextError}</p>
                            <button
                                onClick={confirmPagePlan}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={confirmContext}
                            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 transition-colors"
                        >
                            Confirm Context and Proceed
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}