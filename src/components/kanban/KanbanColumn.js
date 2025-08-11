// src/components/kanban/KanbanColumn.js
import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { Droppable } from 'react-beautiful-dnd';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, clientes }) {
  return (
    <Paper sx={{ width: 300, minWidth: 300, p: 1, backgroundColor: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" sx={{ p: 1, textAlign: 'center', fontWeight: 'bold' }}>
        {column.title}
      </Typography>
      <Droppable droppableId={column.id} type="CARD">
        {(provided, snapshot) => (
          <Box
            ref={provided.innerRef}
            {...provided.droppableProps}
            sx={{
              flexGrow: 1,
              minHeight: '500px',
              transition: 'background-color 0.2s ease',
              backgroundColor: snapshot.isDraggingOver ? '#e3f2fd' : 'transparent',
              borderRadius: 1,
              p: 1
            }}
          >
            {clientes.map((cliente, index) => (
              <KanbanCard key={cliente.id} cliente={cliente} index={index} />
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </Paper>
  );
}