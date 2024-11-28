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
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Header */}
            <header className="w-full flex items-center justify-between p-4 bg-white shadow-md">
                <div className="flex items-center">
                    <a href="https://sparkengine.ai">
                        <img src="/logo.png" alt="Logo" className="h-12 mr-2" />
                    </a>
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

            {/* Title */}
            <h1 className="text-center text-lg font-semibold text-gray-600 py-4">
                Fullstack Next.js Application Builder
            </h1>

            {/* Main Content */}
            <main className="flex-grow flex items-center justify-center w-full">
                <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-5xl">
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

            {/* Footer */}
            <footer className="text-center text-sm text-gray-500 py-4">
                © 2024 Spark Engine. All rights reserved.
            </footer>
        </div>
    );
}
