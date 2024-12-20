import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { IconArrowsMaximize, IconSettings, IconReload, IconX } from '@tabler/icons-react';
import ErrorBoundary from './ErrorBoundary';

const Wrapper = styled.div`
    border: ${({ hideDragging }) => (hideDragging ? 'none' : '1px solid #ddd')};
    padding-top: ${({ hideDragging }) => (hideDragging ? '20px' : '20px')};
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    height: ${({ dimensions }) => `${dimensions.height}px`};
    width: ${({ dimensions }) => `${dimensions.width}px`};    
    left: ${({ position }) => `${position.x}px`};
    top: ${({ position }) => `${position.y - 20}px`};
    box-sizing: border-box;
`;

const ComponentContainer = styled.div`
    max-width: ${({ maxWidth }) => `${maxWidth}px`};
    max-height: ${({ maxHeight }) => `${maxHeight}px`};
    transform: ${({ scale }) => `scale(${scale})`};
    transform-origin: top left;
`;

const ComponentContent = styled.div`
    width: auto;
    height: auto;
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
    userSelect: none,
    position: absolute;
    top: 0;
    left: 0;
    .gear-icon {
        cursor: pointer;
    }
`;

const ResizeHandle = styled.div`
    position: absolute;
    background-color: rgba(0,0,0,0.5);
    color: white;
    userSelect: none,
    cursor: nwse-resize;
    padding: 15px 5px 5px 15px;
    bottom: -22px;
    border-radius:0%;
    border-top-left-radius:100%;
    right: -2px;
    display: ${({ hideDragging }) => (hideDragging ? 'none' : 'flex')};
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

const BaseButton = styled.button`
    margin-top: 5px;
    padding: 6px 12px;
    background-color: #fbfbfb;
    color: black;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid #ddd;
    width: 100%;
    display: flex; /* Use flexbox for alignment */
    align-items: center; /* Align items vertically */
    
    & > svg {
        margin-left: 8px; /* Add spacing between text and icon */
    }
`;


const DynamicComponentWrapper = ({
    componentCode,
    componentName,
    regenerateComponent,
    componentProps = {},
    hideDragging,
    dimensions: initialDimensions = null,    
    position = { x: 0, y: 0 },
    onPositionChange,
    onComponentCodeUpdate,
    onResize,
    onRemove,
}) => {
    const [Component, setComponent] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [dimensions, setDimensions] = useState(initialDimensions || { width: 200, height: 100 });
    const [resizing, setResizing] = useState(false);
    const [initialMousePosition, setInitialMousePosition] = useState(null);
    const [initialComponentPosition, setInitialComponentPosition] = useState(null);
    const [initialComponentDimensions, setInitialComponentDimensions] = useState(initialDimensions);
    const componentRef = useRef(null);

    useEffect(() => {
        try {
            const GeneratedComponent = new Function('React', 'styled', `return ${componentCode}`)(React, styled);
            setComponent(() => GeneratedComponent);
        } catch (error) {
            console.error(`Error compiling component '${componentName}':`, error);
            setComponent(() => () => <div>Error loading {componentName}</div>);
        }
    }, [componentCode, componentName]);

    useEffect(() => {
        if (initialDimensions) {
          setDimensions(initialDimensions);
          setInitialComponentDimensions(initialDimensions);
        }
      }, [initialDimensions]);
    
      useEffect(() => {
        if (!initialDimensions && componentRef.current) {
          const { offsetWidth, offsetHeight } = componentRef.current;
          const measuredDimensions = {
            width: offsetWidth || 200,
            height: offsetHeight || 100,
          };
    
          setDimensions(measuredDimensions);
    
          if (onResize) {
            onResize(measuredDimensions);
          }
        }
      }, [componentCode, onResize]);
      
      const handleMouseDown = (event) => {
        if (hideDragging) return;
        event.preventDefault();
        setDragging(true);
        setInitialMousePosition({ x: event.pageX, y: event.pageY });
        setInitialComponentPosition(position);
    };
    
    const handleMouseMove = useCallback(
        (event) => {
            const dropArea = document.getElementById('drop-area');
            const dropAreaRect = dropArea.getBoundingClientRect();

            if (dragging) {
                const deltaX = event.pageX - initialMousePosition.x;
                const deltaY = event.pageY - initialMousePosition.y;
                const newX = initialComponentPosition.x + deltaX;
                const newY = initialComponentPosition.y + deltaY;
    
                // Calculate maximum allowed positions
                const maxX = dropAreaRect.width - dimensions.width;
                const maxY = dropAreaRect.height - dimensions.height;
    
                // Constrain positions within drop area boundaries
                const constrainedX = Math.max(0, Math.min(newX, maxX));
                const constrainedY = Math.max(0, Math.min(newY, maxY));
    
                const newPosition = {
                    x: constrainedX,
                    y: constrainedY,
                };
    
                onPositionChange(newPosition);
            }         
              if (resizing) {
                const deltaX = event.clientX - initialMousePosition.x;
                const deltaY = event.clientY - initialMousePosition.y;
              
                // Calculate new dimensions
                const newWidth = Math.max(50, initialComponentDimensions.width + deltaX);
                const newHeight = Math.max(50, initialComponentDimensions.height + deltaY);
              
                // Calculate maximum allowed dimensions based on the component's position
                const maxWidth = dropAreaRect.width - position.x;
                const maxHeight = dropAreaRect.height - position.y;
              
                // Constrain dimensions to not exceed the drop area boundaries
                const constrainedWidth = Math.min(newWidth, maxWidth);
                const constrainedHeight = Math.min(newHeight, maxHeight);
              
                const newDimensions = {
                  width: constrainedWidth,
                  height: constrainedHeight,
                };
              
                setDimensions(newDimensions);
              
                if (onResize) {
                  onResize(newDimensions); // Update dimensions in the parent state
                }
              
                // Update component code if necessary
                const updatedCode = updateComponentCode(componentCode, newDimensions.width, newDimensions.height);
                if (onComponentCodeUpdate) {
                  onComponentCodeUpdate(updatedCode);
                }
              }
              
        },
        [
            dragging,
            resizing,
            initialMousePosition,
            initialComponentPosition,
            initialComponentDimensions,
            onResize,
            onComponentCodeUpdate,
            componentCode,
        ]
    );

    const handleMouseUp = useCallback(() => {
        setDragging(false);
        setResizing(false);
    }, []);

    useEffect(() => {
        if (dragging || resizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, resizing, handleMouseMove, handleMouseUp]);
    

    const handleResizeMouseDown = (event) => {
        event.preventDefault();
        setResizing(true);
        setInitialMousePosition({ x: event.clientX, y: event.clientY });
        setInitialComponentDimensions(dimensions);
    };

    const handleRegenerate = () => {
        const userModification = prompt(`Provide details for modifying "${componentName}"`);
        if (userModification) {
            regenerateComponent(userModification);
        } else {
            alert('Regeneration canceled.');
        }
    };

    // Utility to update component.code dynamically with new width and height
    const updateComponentCode = (code, width, height) => {
        try {
          // Find the first styled.div block and append width and height to it
          return code.replace(
            /styled\.div`([^`]*)`/, // Regex to match the first styled.div
            (match, styles) => {
              // Check if the styles already have width/height defined
              const updatedStyles = styles
                .replace(/width:.*?;/, '') // Remove existing width if present
                .replace(/height:.*?;/, ''); // Remove existing height if present
      
              // Append the new width and height
              return `styled.div\`${updatedStyles} width: ${width}px; height: ${height}px;\``;
            }
          );
        } catch (error) {
          console.error('Error updating component code:', error);
          return code; // Return the original code in case of error
        }
      };
      
      const handleResizeStop = (e, data) => {
        const newDimensions = { width: data.size.width, height: data.size.height };

        // Update dimensions in the parent state
        if (onResize) {
            onResize(newDimensions);
        }

        // Update the component code if necessary
        if (onComponentCodeUpdate) {
            const updatedCode = updateComponentCode(componentCode, newDimensions.width, newDimensions.height);
            onComponentCodeUpdate(updatedCode);
        }
    };

    const handleRemoveComponent = () => {
        setDropdownOpen(false);
        if (onRemove) {
            onRemove();
        }
    };

    return (
        <Wrapper
            hideDragging={hideDragging}
            position={position}
            dimensions={dimensions}
            onResizeStop={handleResizeStop}
        >
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
                <BaseButton onClick={handleRegenerate}><IconReload size={14}/><p style={{marginLeft:5}}>Regenerate</p></BaseButton>
                <BaseButton onClick={handleRemoveComponent}><IconX size={14}/><p style={{marginLeft:5}}>Remove</p></BaseButton>
            </Dropdown>
            <ErrorBoundary>
                {Component ? (
                    <ComponentContainer
                        style={{
                            width: `${dimensions.width}px`,
                            height: `${dimensions.height}px`,
                        }}
                    >
                        <Component {...componentProps} />
                        <ResizeHandle onMouseDown={handleResizeMouseDown} hideDragging={hideDragging}><IconArrowsMaximize size={18}/></ResizeHandle>
                    </ComponentContainer>
                ) : (
                    <div style={{ color: 'gray' }}>Loading component: {componentName}...</div>
                )}
            </ErrorBoundary>
        </Wrapper>
    );
};


export default DynamicComponentWrapper;
