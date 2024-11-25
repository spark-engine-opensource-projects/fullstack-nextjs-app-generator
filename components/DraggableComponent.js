import React from 'react';
import { useDrag } from 'react-dnd';

const DraggableComponent = ({ componentName, disabled }) => {

    const [{ isDragging }, drag] = useDrag(
        () => ({
            type: 'COMPONENT',
            item: { componentName }, // Ensure this matches projectComponents
            canDrag: !disabled, // Prevent dragging if disabled
            collect: (monitor) => ({
                isDragging: !!monitor.isDragging(),
            }),
        }),
        [disabled]
    );

    return (
        <div
            ref={disabled ? null : drag} // Disable drag ref if disabled
            style={{
                opacity: isDragging ? 0.5 : disabled ? 0.3 : 1, // Dim if dragging or disabled
                cursor: disabled ? 'not-allowed' : 'move',
                padding: '8px',
                border: '1px solid #ccc',
                marginBottom: '5px',
                borderRadius: '4px',
                backgroundColor: '#fff',
            }}
        >
            {componentName}
        </div>
    );
};

export default DraggableComponent;
