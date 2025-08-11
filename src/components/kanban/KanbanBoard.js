// src/components/kanban/KanbanBoard.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Box, CircularProgress } from '@mui/material';
import KanbanColumn from './KanbanColumn';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

// As colunas agora são definidas aqui, de forma fixa
const initialColumns = {
  'backlog': { id: 'backlog', title: 'Backlog', clienteIds: [] },
  'execucao': { id: 'execucao', title: 'Em Execução', clienteIds: [] },
  'pendente': { id: 'pendente', title: 'Pendente', clienteIds: [] },
  'concluido': { id: 'concluido', title: 'Concluído', clienteIds: [] },
};

// A ordem das colunas também é fixa
const columnOrder = ['backlog', 'execucao', 'pendente', 'concluido'];

export default function KanbanBoard({ clientes }) {
  const [columns, setColumns] = useState(null);

  useEffect(() => {
    if (clientes) {
      const newColumns = JSON.parse(JSON.stringify(initialColumns));
      clientes.forEach(cliente => {
        const etapa = cliente.etapaPrincipal || 'backlog';
        if (newColumns[etapa]) {
          newColumns[etapa].clienteIds.push(cliente.id);
        } else {
            // Se um cliente tem uma etapa que não existe mais, coloca no backlog
            newColumns['backlog'].clienteIds.push(cliente.id);
        }
      });
      setColumns(newColumns);
    }
  }, [clientes]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }
    
    const start = columns[source.droppableId];
    const finish = columns[destination.droppableId];

    const startClienteIds = Array.from(start.clienteIds);
    startClienteIds.splice(source.index, 1);
    const newStart = { ...start, clienteIds: startClienteIds };

    const finishClienteIds = Array.from(finish.clienteIds);
    finishClienteIds.splice(destination.index, 0, draggableId);
    const newFinish = { ...finish, clienteIds: finishClienteIds };

    if (start === finish) {
        setColumns(prev => ({ ...prev, [newStart.id]: newStart }));
    } else {
        setColumns(prev => ({ ...prev, [newStart.id]: newStart, [newFinish.id]: newFinish }));
    }

    try {
      const clienteRef = doc(db, 'clientes', draggableId);
      await updateDoc(clienteRef, { etapaPrincipal: destination.droppableId });
    } catch (error) {
      console.error("Erro ao atualizar etapa do cliente:", error);
      setColumns(prev => ({...prev, [start.id]: start, [finish.id]: finish}));
    }
  };

  if (!columns) return <CircularProgress />;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
        {(provided) => (
          <Box 
            {...provided.droppableProps}
            ref={provided.innerRef}
            sx={{ display: 'flex', gap: 2, overflowX: 'auto', p: 1 }}
          >
            {columnOrder.map((columnId) => {
              const column = columns[columnId];
              const columnClientes = column.clienteIds.map(clienteId => clientes.find(c => c.id === clienteId)).filter(Boolean);
              return <KanbanColumn key={column.id} column={column} clientes={columnClientes} />;
            })}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}