import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PagePlanStep from './steps/PagePlanStep';
import StylingStep from './steps/StylingStep';
import ApiStep from './steps/ApiStep';
import SchemaStep from './steps/SchemaStep';
import DashboardOverview from './steps/DashboardOverview';
import {
    generateSinglePagePlan,
    generateMultiplePagePlan,
    generateStylingPlan,
    generateApiPlan,
    generateSchema,
    modifySchema,
    generateComponentContext,
    mapComponentsToAPIs,
} from '../utils/api';

const INITIAL_STATE = {
    pages: [],
    context: {},
    styling: { colors: { primary: '#FFC400', secondary: '#FFD7BE', accent: '#8B4513' } },
    apis: [],
    apiMappings: {},
    databaseSchema: [],
};

export default function Dashboard({ formData, onSubmit }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState(formData);
    const [apiResult, setApiResult] = useState(INITIAL_STATE);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (currentStep !== 1) return;
            setLoading(true);
            setError(null);
            try {
                const result = data.appType === 'single'
                    ? await generateSinglePagePlan(data)
                    : await generateMultiplePagePlan(data);
                setApiResult(prev => ({ ...prev, pages: result.pages }));
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Failed to fetch data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentStep, data]);

    const handleNextStep = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let updates = {};
            switch (currentStep) {
                case 1: {
                    const styleResult = await generateStylingPlan({
                        purpose: data.purpose,
                        pages: apiResult.pages,
                        preferences: data.preferences
                    });
                    updates = { styling: styleResult };
                    break;
                }
                case 2: {
                    const apis = await generateApiPlan({
                        purpose: data.purpose,
                        pages: apiResult.pages
                    });
                    updates = { apis };
                    break;
                }
                case 3: {
                    const schema = await generateSchema(JSON.stringify({
                        purpose: data.purpose,
                        apis: apiResult.apis,
                        pages: apiResult.pages
                    }));
                    console.log(schema)
                    updates = { databaseSchema: schema };
                    break;
                }
                case 4: {
                    const mappings = await mapComponentsToAPIs(JSON.stringify({
                        APIs: apiResult.apis,
                        components: apiResult.context
                    }));
                    updates = { apiMappings: mappings };
                    break;
                }
            }
            setApiResult(prev => ({
                ...prev,
                ...updates
            }));
            setCurrentStep(prev => prev + 1);
        } catch (err) {
            console.error('Step error:', err);
            setError(`Failed to generate ${currentStep === 1 ? 'styling' : currentStep === 2 ? 'APIs' : currentStep === 3 ? 'mappings' : 'schema'}. Please retry.`);
        } finally {
            setLoading(false);
        }
    }, [currentStep, data, apiResult]);

    const handleRegenerate = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let updates = {};
            switch (currentStep) {
                case 1: {
                    const pages = await generateSinglePagePlan(data);
                    updates = { pages };
                    break;
                }
                case 2: {
                    const styleResult = await generateStylingPlan({
                        purpose: data.purpose,
                        pages: apiResult.pages,
                        preferences: data.preferences
                    });
                    updates = { styling: { colors: styleResult } };
                    break;
                }
                case 3: {
                    const apis = await generateApiPlan({
                        purpose: data.purpose,
                        pages: apiResult.pages
                    });
                    updates = { apis };
                    break;
                }
                case 4: {
                    const schema = await generateSchema({
                        purpose: data.purpose,
                        apis: apiResult.apis,
                        pages: apiResult.pages
                    });
                    updates = { databaseSchema: schema };
                    break;
                }
            }
            setApiResult(prev => ({
                ...prev,
                ...updates
            }));
        } catch (err) {
            console.error('Regenerate error:', err);
            setError('Failed to regenerate data. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [currentStep, data, apiResult]);

    const renderStep = useMemo(() => {
        const commonProps = {
            onRegenerate: handleRegenerate
        };

        switch (currentStep) {
            case 1:
                return (
                    <PagePlanStep
                        {...commonProps}
                        key="page-plan"
                        data={apiResult.pages}
                        onUpdate={(updatedPages) => setApiResult(prev => ({ ...prev, pages: updatedPages }))}
                        onAddPage={(newPage) => setApiResult(prev => ({
                            ...prev,
                            pages: [...prev.pages, { ...newPage, id: Date.now() }]
                        }))}
                        onDeletePage={(index) => setApiResult(prev => ({
                            ...prev,
                            pages: prev.pages.filter((_, i) => i !== index)
                        }))}
                        onContextCreate={generateComponentContext}
                        onPhaseComplete={(phaseData) => {
                            setApiResult(prev => ({ ...prev, ...phaseData }));
                            setTimeout(() => handleNextStep(), 0);
                        }}
                    />
                );
            case 2:
                return (
                    <StylingStep
                        {...commonProps}
                        key="styling"
                        styling={apiResult.styling}
                        onUpdate={(updatedStyling) => {
                            setApiResult(prev => ({ ...prev, styling: updatedStyling }))
                            setTimeout(() => handleNextStep(), 0);
                        }}
                    />
                );
            case 3:
                return (
                    <ApiStep
                        {...commonProps}
                        key="api"
                        apis={apiResult.apis}
                        onUpdate={(updatedApis) => {
                            setApiResult(prev => ({ ...prev, apis: updatedApis }))
                            setTimeout(() => handleNextStep(), 0);
                        }}
                        onAddApi={(newApi) => setApiResult(prev => ({
                            ...prev,
                            apis: [...prev.apis, { ...newApi, id: Date.now() }]
                        }))}
                        onDeleteApi={(index) => setApiResult(prev => ({
                            ...prev,
                            apis: prev.apis.filter((_, i) => i !== index)
                        }))}
                    />
                );
            case 4:
                return (
                    <SchemaStep
                        {...commonProps}
                        key="schema"
                        schema={apiResult.databaseSchema}
                        onUpdate={(updatedSchema) => {
                            setApiResult(prev => ({
                                ...prev,
                                databaseSchema: updatedSchema
                            }))
                            setTimeout(() => handleNextStep(), 0);
                        }}
                        onModifySchema={(prompt) => modifySchema(apiResult.databaseSchema, prompt)}
                    />
                );
            case 5:
                return <DashboardOverview key="overview" apiResult={apiResult} />;
            default:
                return null;
        }
    }, [currentStep, apiResult, handleRegenerate]);

    return (
        <div className="dashboard flex justify-center items-start p-6 bg-gray-50 min-h-screen">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl">
                {loading ? (
                    <div className="text-center text-lg">Loading...</div>
                ) : (
                    <>
                        {error && (
                            <div className="bg-red-100 text-red-800 p-4 rounded mb-4">
                                <p>{error}</p>
                                <button
                                    onClick={handleRegenerate}
                                    className="bg-red-500 text-white px-4 py-2 rounded mt-2 hover:bg-red-600"
                                >
                                    Retry
                                </button>
                            </div>
                        )}
                        {renderStep}
                        <div className="flex justify-end space-x-4 mt-6">
                            {currentStep < 5 && (
                                <button
                                    onClick={handleNextStep}
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === 5 && (
                                <button
                                    onClick={() => onSubmit({ ...data, ...apiResult })}
                                    className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                                >
                                    Save and Submit
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}