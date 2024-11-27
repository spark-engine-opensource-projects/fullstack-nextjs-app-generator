import React, { memo } from 'react';
import DraggableComponent from './DraggableComponent';

const Sidebar = memo(({ availableComponents, droppedComponents }) => {
  // Remove duplicates from availableComponents
  const uniqueComponents = Array.from(new Set(availableComponents));

  return (
    <div style={{ width: '200px', background: '#f0f0f0', padding: '10px' }}>
      <h3>Components</h3>
      {uniqueComponents.map((componentName, index) => {
        const isDisabled = droppedComponents.includes(componentName);
        return (
          <DraggableComponent
            key={index}
            componentName={componentName}
            disabled={isDisabled}
          />
        );
      })}
    </div>
  );
});

export default Sidebar;
