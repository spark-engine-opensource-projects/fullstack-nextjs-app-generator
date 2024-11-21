import React from 'react';
import DraggableComponent from './DraggableComponent';

const Sidebar = ({ availableComponents, droppedComponents }) => {
    return (
        <div style={{ width: '200px', background: '#f0f0f0', padding: '10px' }}>
            <h3>Components</h3>
            {availableComponents.map((componentName, index) => (
                <DraggableComponent
                    key={index}
                    componentName={componentName}
                    disabled={droppedComponents.includes(componentName)} // Disable if already dropped
                />
            ))}
        </div>
    );
};

export default Sidebar;
