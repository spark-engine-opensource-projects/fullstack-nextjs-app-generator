import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ErrorBoundary from './ErrorBoundary';

const Wrapper = styled.div`
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 10px;
`;

const RegenerateButton = styled.button`
    display: block;
    margin-top: 20px; // Adjust this value to increase the spacing
    margin-bottom: 10px;
    padding: 10px 16px;
    background-color: #fbfbfb;
    color: black;
    border-radius: 4px;
    cursor: pointer;
`;

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
        <Wrapper>
            <ErrorBoundary>
                {Component ? (
                    <Component {...componentProps} />
                ) : (
                    <div>Loading {componentName}...</div>
                )}
            </ErrorBoundary>
            <RegenerateButton onClick={handleRegenerate}>
                Regenerate
            </RegenerateButton>
        </Wrapper>
    );
};

export default DynamicComponentWrapper;
