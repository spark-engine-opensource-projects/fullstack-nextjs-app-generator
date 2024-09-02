"use client";

import { useState } from 'react';
import MultiStepForm from './components/MultiStepForm';
import Dashboard from './components/Dashboard';
import ProjectDashboard from './components/ProjectDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import { IconBrandDiscord, IconBrandGithub } from '@tabler/icons-react';

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
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
            <header className="w-full flex items-center justify-between p-4 bg-white shadow-md mb-8">
                <div className="flex items-center">
                    <img src="/logo.png" w="140px" h="100%" alt="Logo" className="h-8 w-8 mr-2" />
                </div>
                <div className="flex space-x-4">
                    <a href="https://discord.gg/VAQA5c32jM" target="_blank" rel="noopener noreferrer">
                        <IconBrandDiscord size={24} />
                    </a>
                    <a href="https://github.com/spark-engine-opensource-projects" target="_blank" rel="noopener noreferrer">
                        <IconBrandGithub size={24} />
                    </a>
                </div>
            </header>
            <h1 className="text-sm font-medium text-gray-500">Next.js Application Builder</h1>
            <main className="flex-grow flex items-center justify-center w-full mb-12">
                <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                    {!isFormComplete ? (
                        <MultiStepForm onComplete={handleFormComplete} />
                    ) : !isDashboardComplete ? (
                        <Dashboard formData={formData} onSubmit={handleSaveData} />
                    ) : (
                        <ErrorBoundary>
                            <ProjectDashboard projectData={finalData} />
                        </ErrorBoundary>
                    )}
                </div>
            </main>
        </div>
    );
}
