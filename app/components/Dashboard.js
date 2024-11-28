import React, { useState, useEffect } from 'react';
import PagePlanStep from './steps/PagePlanStep';
import StylingStep from './steps/StylingStep';
import ApiStep from './steps/ApiStep';
import SchemaStep from './steps/SchemaStep';
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

export default function Dashboard({ formData, onSubmit }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState(formData);
    const [apiResult, setApiResult] = useState({
        pages: [],
        context: {},
        styling: { colors: { primary: '#FFC400', secondary: '#FFD7BE', accent: '#8B4513' } },
        apis: [],
        apiMappings: {}, // Add apiMappings field to store the results
        databaseSchema: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                if (currentStep === 1) {
                    const result =
                        data.appType === 'single'
                            ? await generateSinglePagePlan(data)
                            : await generateMultiplePagePlan(data);
                    setApiResult((prev) => ({ ...prev, pages: result.pages }));
                }
            } catch (err) {
                setError('Failed to fetch data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (currentStep === 1) {
            fetchData();
        }
    }, [currentStep, data]);

    const handleNextStep = async () => {
        setLoading(true);
        setError(null);

        try {
            if (currentStep === 1) {
                const styling = await generateStylingPlan(data);
                setApiResult((prev) => ({ ...prev, styling }));
            } else if (currentStep === 2) {
                const apis = await generateApiPlan(
                    `Purpose: ${data.purpose}, Page details: ${JSON.stringify(apiResult.pages)}`
                );
                setApiResult((prev) => ({ ...prev, apis }));
            } else if (currentStep === 3) {
                // Generate API Mappings
                const prompt = {
                    APIs: apiResult.apis,
                    components: apiResult.context,
                };
                const apiMappings = await mapComponentsToAPIs(prompt);
                setApiResult((prev) => ({ ...prev, apiMappings }));
            } else if (currentStep === 4) {
                const schema = await generateSchema(
                    `Purpose: ${data.purpose}, API details: ${JSON.stringify(apiResult.apis)}`
                );
                setApiResult((prev) => ({ ...prev, databaseSchema: schema }));
            }

            setCurrentStep((prevStep) => prevStep + 1);
        } catch (err) {
            setError('Failed to load the next step. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegenerate = async () => {
        setLoading(true);
        setError(null);

        try {
            if (currentStep === 1) {
                const result =
                    data.appType === 'single'
                        ? await generateSinglePagePlan(data)
                        : await generateMultiplePagePlan(data);
                setApiResult((prev) => ({ ...prev, pages: result.pages }));
            } else if (currentStep === 2) {
                const styling = await generateStylingPlan(data);
                setApiResult((prev) => ({ ...prev, styling }));
            } else if (currentStep === 3) {
                const apis = await generateApiPlan(
                    `Purpose: ${data.purpose}, Page details: ${JSON.stringify(apiResult.pages)}`
                );
                setApiResult((prev) => ({ ...prev, apis }));
            } else if (currentStep === 4) {
                const schema = await generateSchema(
                    `Purpose: ${data.purpose}, API details: ${JSON.stringify(apiResult.apis)}`
                );
                setApiResult((prev) => ({ ...prev, databaseSchema: schema }));
            }
        } catch (err) {
            setError('Failed to regenerate data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePhaseComplete = (phaseData) => {
        // Merge the completed phase data into the apiResult
        setApiResult((prev) => ({ ...prev, ...phaseData }));
        handleNextStep()
    };

    const handleSave = () => {
        const combinedData = {
            ...data,
            ...apiResult,
        };
        onSubmit(combinedData);
    };

    const renderDashboardOverview = () => (
        <div className="dashboard-overview">
            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apiResult.pages.map((page, pageIndex) => (
                    <div key={pageIndex} className="bg-gray-100 p-4 rounded shadow">
                        <h3 className="text-lg font-bold mb-2">{page.name}</h3>
                        <p className="mb-4">{page.purpose}</p>
                        <div className="space-y-2">
                            {page.components.map((component, componentIndex) => (
                                <div
                                    key={componentIndex}
                                    className="bg-white p-4 rounded border border-gray-300 shadow-sm"
                                >
                                    <h4 className="font-semibold">{component}</h4>
                                    <p className="text-sm text-gray-600">
                                        API: {apiResult.apiMappings[component] || 'No API'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <PagePlanStep
                        data={apiResult.pages}
                        onUpdate={(updatedPages) => setApiResult((prev) => ({ ...prev, pages: updatedPages }))}
                        onAddPage={(newPage) =>
                            setApiResult((prev) => ({ ...prev, pages: [...prev.pages, newPage] }))
                        }
                        onDeletePage={(index) =>
                            setApiResult((prev) => ({
                                ...prev,
                                pages: prev.pages.filter((_, i) => i !== index),
                            }))
                        }
                        onRegenerate={handleRegenerate}
                        onContextCreate={generateComponentContext}
                        onPhaseComplete={(phaseData) =>
                            handlePhaseComplete({ pages: phaseData.pages, context: phaseData.context })
                        }
                    />
                );
            case 2:
                return (
                    <StylingStep
                        styling={apiResult.styling}
                        onUpdate={(updatedStyling) => setApiResult((prev) => ({ ...prev, styling: updatedStyling }))}
                        onRegenerate={handleRegenerate}
                    />
                );
            case 3:
                return (
                    <ApiStep
                        apis={apiResult.apis}
                        onUpdate={(updatedApis) => setApiResult((prev) => ({ ...prev, apis: updatedApis }))}
                        onAddApi={(newApi) =>
                            setApiResult((prev) => ({ ...prev, apis: [...prev.apis, newApi] }))
                        }
                        onDeleteApi={(index) =>
                            setApiResult((prev) => ({
                                ...prev,
                                apis: prev.apis.filter((_, i) => i !== index),
                            }))
                        }
                        onRegenerate={handleRegenerate}
                    />
                );
            case 4:
                return renderDashboardOverview(); // Render the dashboard overview after mappings
            default:
                return null;
        }
    };

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
                        {renderStep()}
                        <div className="flex justify-end space-x-4 mt-6">
                            {currentStep < 4 && (
                                <button
                                    onClick={handleNextStep}
                                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                                >
                                    Next
                                </button>
                            )}
                            {currentStep === 4 && (
                                <button
                                    onClick={handleSave}
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
