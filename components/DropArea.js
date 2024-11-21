// DropArea.js
import React from 'react';
import { useDrop } from 'react-dnd';

const DropArea = ({ onDropComponent, children }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'COMPONENT',
    drop: (item, monitor) => {
      const offset = monitor.getClientOffset();
      onDropComponent(item.componentName, offset);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
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
