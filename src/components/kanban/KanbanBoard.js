// src/components/kanban/KanbanBoard.js
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Box, CircularProgress } from '@mui/material';
import KanbanColumn from './KanbanColumn';
import { db } from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

// --- AQUI ESTÁ A MUDANÇA COM OS NOVOS TÍTULOS ---
const initialColumns = {
  'backlog': { id: 'backlog', title: 'Inicio do Acompanhamento', clienteIds: [] },
  'execucao': { id: 'execucao', title: 'Cliente em Tratativa', clienteIds: [] },
  'pendente': { id: 'pendente', title: 'Implantado/Acompanhando', clienteIds: [] },
  'concluido': { id: 'concluido', title: 'Concluído', clienteIds: [] },
};

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
      // Reverte o estado em caso de erro no update
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