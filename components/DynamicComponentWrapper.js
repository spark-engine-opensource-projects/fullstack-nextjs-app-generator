import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ErrorBoundary from './ErrorBoundary';

const DynamicComponentWrapper = ({ componentCode, componentName, regenerateComponent, componentProps = {} }) => {
    const [Component, setComponent] = useState(null);

    useEffect(() => {
        // Dynamically compile the component code and set it as state
        try {
            const GeneratedComponent = new Function('React', 'styled', `return ${componentCode}`)(React, styled);
            setComponent(() => GeneratedComponent); // Use a function to preserve the component reference
        } catch (error) {
            console.error(`Error compiling component '${componentName}':`, error);
            setComponent(() => () => <div>Error loading {componentName}</div>);
        }
    }, [componentCode, componentName]);

    // Handle regeneration
    const handleRegenerate = () => {
        const userModification = prompt(`Please provide details on how you'd like to modify the component "${componentName}"`);
        if (userModification) {
            regenerateComponent(userModification);
        } else {
            alert('Component regeneration was canceled.');
        }
    };

    return (
        <div style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px' }}>
            <ErrorBoundary>
                {Component ? (
                    <Component {...componentProps} />
                ) : (
                    <div>Loading {componentName}...</div>
                )}
            </ErrorBoundary>
            <button onClick={handleRegenerate} className="py-2 px-4 bg-blue-500 text-white rounded mt-2">
                Regenerate Component
            </button>
        </div>
    );
};

export default DynamicComponentWrapper;
