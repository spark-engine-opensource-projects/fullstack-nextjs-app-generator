import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { IconSettings } from '@tabler/icons-react';
import ErrorBoundary from './ErrorBoundary';

const Wrapper = styled.div`
    border: ${({ hideDragging }) => (hideDragging ? 'none' : '1px solid #ddd')};
    padding-top: ${({ hideDragging }) => (hideDragging ? '20px' : '20px')};
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    left: ${({ position }) => `${position.x}px`};
    top: ${({ position }) => `${position.y}px`};
`;

const DragHandleBar = styled.div`
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    display: ${({ hideDragging }) => (hideDragging ? 'none' : 'flex')};
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    cursor: move;
    position: absolute;
    top: 0;
    left: 0;
    .gear-icon {
        cursor: pointer;
    }
`;

const Dropdown = styled.div`
    position: absolute;
    top: 24px;
    right: 8px;
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: ${({ isOpen }) => (isOpen ? 'block' : 'none')};
`;

const RegenerateButton = styled.button`
    margin-top: 5px;
    padding: 6px 12px;
    background-color: #fbfbfb;
    color: black;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #ddd;
    width: 100%;
`;

const DynamicComponentWrapper = ({
    componentCode,
    componentName,
    regenerateComponent,
    componentProps = {},
    hideDragging,
    position = { x: 0, y: 0 },
    onPositionChange,
}) => {
    const [Component, setComponent] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [initialMousePosition, setInitialMousePosition] = useState(null);
    const [initialComponentPosition, setInitialComponentPosition] = useState(null);

    useEffect(() => {
        try {
            const GeneratedComponent = new Function('React', 'styled', `return ${componentCode}`)(React, styled);
            setComponent(() => GeneratedComponent);
        } catch (error) {
            console.error(`Error compiling component '${componentName}':`, error);
            setComponent(() => () => <div>Error loading {componentName}</div>);
        }
    }, [componentCode, componentName]);

    const handleMouseDown = (event) => {
        if (hideDragging) return;
        event.preventDefault();
        setDragging(true);
        setInitialMousePosition({ x: event.clientX, y: event.clientY });
        setInitialComponentPosition(position);
    };

    const handleMouseMove = useCallback(
        (event) => {
            if (!dragging) return;
            const deltaX = event.clientX - initialMousePosition.x;
            const deltaY = event.clientY - initialMousePosition.y;
            const newPosition = {
                x: initialComponentPosition.x + deltaX,
                y: initialComponentPosition.y + deltaY,
            };
            onPositionChange(newPosition);
        },
        [dragging, initialMousePosition, initialComponentPosition, onPositionChange]
    );

    const handleMouseUp = useCallback(() => {
        if (dragging) {
            setDragging(false);
        }
    }, [dragging]);

    useEffect(() => {
        if (dragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragging, handleMouseMove, handleMouseUp]);

    const handleRegenerate = () => {
        const userModification = prompt(`Provide details for modifying "${componentName}"`);
        if (userModification) {
            regenerateComponent(userModification);
        } else {
            alert('Regeneration canceled.');
        }
    };

    return (
        <Wrapper hideDragging={hideDragging} position={position}>
            <DragHandleBar
                className="component-drag-handle"
                hideDragging={hideDragging}
                onMouseDown={handleMouseDown}
            >
                <span></span>
                <IconSettings
                    className="gear-icon"
                    size={16}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                />
            </DragHandleBar>
            <Dropdown isOpen={dropdownOpen}>
                <div>{componentName}</div>
                <RegenerateButton onClick={handleRegenerate}>Regenerate</RegenerateButton>
            </Dropdown>
            <ErrorBoundary>
                {Component ? <Component {...componentProps} /> : <div>Loading {componentName}...</div>}
            </ErrorBoundary>
        </Wrapper>
    );
};

export default DynamicComponentWrapper;
