import React from 'react';
import { useDrop } from 'react-dnd';

const DropArea = ({ onDropComponent, selectedPage, children }) => {
    const [{ isOver }, dropRef] = useDrop(
        () => ({
            accept: 'COMPONENT',
            drop: (item, monitor) => {
                console.log('Dropped Item:', item, 'on page:', selectedPage);
                const offset = monitor.getClientOffset();
                if (item && item.componentName) {
                    onDropComponent(item.componentName, offset);
                } else {
                    console.error('Dropped item missing componentName:', item);
                }
            },
            collect: (monitor) => ({
                isOver: !!monitor.isOver(),
            }),
        }),
        [selectedPage, onDropComponent] // Add dependencies here
    );

    return (
        <div
            ref={dropRef}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                border: '1px solid #ccc',
                background: isOver ? '#e6f7ff' : '#fff',
            }}
        >
            {children}
        </div>
    );
};

export default DropArea;
