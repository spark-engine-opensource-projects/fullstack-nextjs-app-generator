"use client"
import { useState } from 'react';
import MultiStepForm from './components/MultiStepForm';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ErrorBoundary from './components/ErrorBoundary';

export default function Home() {
    const [formData, setFormData] = useState(null);
    const [isFormComplete, setIsFormComplete] = useState(false);
    const [isDashboardComplete, setIsDashboardComplete] = useState(false);
    const [finalData, setFinalData] = useState(null);

    const handleFormComplete = (data) => {
        setFormData(data);
        setIsFormComplete(true);
    };

    const handleSaveData = (data) => {
        setFinalData(data);
        setIsDashboardComplete(true);
        console.log('Final data:', data);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Next.js Application Builder</h1>
            {!isFormComplete ? (
                <MultiStepForm onComplete={handleFormComplete} />
            ) : !isDashboardComplete ? (
                <Dashboard formData={formData} onSubmit={handleSaveData} />
            ) : (
                // <ErrorBoundary>
                    <ProjectDashboard projectData={finalData} />
                // </ErrorBoundary> 
            )}
        </div>
    );
}