// src/components/kanban/KanbanCard.js
import React from 'react';
import { Paper, Typography, Chip } from '@mui/material';
import { Draggable } from 'react-beautiful-dnd';
import { Link } from 'react-router-dom';

export default function KanbanCard({ cliente, index }) {
  const totalEtapas = (cliente.etapasPreImplantacao?.length || 0) + (cliente.etapasImplantacao?.length || 0);
  const concluidas = (cliente.etapasPreImplantacao?.filter(e => e.concluida).length || 0) + (cliente.etapasImplantacao?.filter(e => e.concluida).length || 0);
  const progresso = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;

  return (
    <Draggable draggableId={cliente.id} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            p: 2,
            mb: 2,
            backgroundColor: snapshot.isDragging ? '#e3f2fd' : 'white',
            '&:hover': {
              backgroundColor: '#f5f5f5'
            },
          }}
          elevation={snapshot.isDragging ? 4 : 1}
        >
          <Link to={`/cliente/${cliente.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Typography variant="h6" component="h3" sx={{ mb: 1 }}>{cliente.nomeCliente}</Typography>
          </Link>
          <Chip label={`Progresso: ${progresso}%`} color="primary" size="small"/>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Responsável: {cliente.contatoNome || 'N/A'}
          </Typography>
        </Paper>
      )}
    </Draggable>
  );
}