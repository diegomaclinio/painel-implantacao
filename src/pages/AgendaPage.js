// src/pages/AgendaPage.js
import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Autocomplete, IconButton, List, ListItem, ListItemText, CircularProgress, Tooltip, Paper } from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs from 'dayjs';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useOutletContext } from 'react-router-dom';

export default function AgendaPage() {
  const { perfilUsuario } = useOutletContext();
  const [eventos, setEventos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeEventos = onSnapshot(collection(db, "agendamentos"), (snapshot) => {
      const eventosData = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        start: doc.data().start.toDate(),
        end: doc.data().end.toDate(),
        extendedProps: doc.data().extendedProps,
        backgroundColor: '#1976d2', borderColor: '#1976d2',
      }));
      setEventos(eventosData);
      setLoading(false);
    });
    const unsubscribeClientes = onSnapshot(collection(db, "clientes"), (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => a.nomeCliente.localeCompare(b.nomeCliente)));
    });
    return () => { unsubscribeEventos(); unsubscribeClientes(); };
  }, []);

  const handleDateClick = (arg) => {
    setIsEditing(false);
    setCurrentEvent({
      start: arg.date,
      extendedProps: { clienteId: '', clienteNome: '', descricao: '', nomeParticipante: '', contatoParticipante: '' }
    });
    setOpen(true);
  };

  const handleEventClick = (arg) => {
    setSelectedEvent(arg.event);
    setViewOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setViewOpen(false);
    setSelectedEvent(null);
    setCurrentEvent(null);
  };
  
  const handleEditClick = () => {
    setIsEditing(true);
    setCurrentEvent({
        id: selectedEvent.id,
        start: selectedEvent.start,
        extendedProps: selectedEvent.extendedProps
    });
    setViewOpen(false);
    setOpen(true);
  };

  const handleSaveEvent = async () => {
    const { clienteId, clienteNome } = currentEvent.extendedProps;
    if (!clienteId || !currentEvent.start) {
      alert("Por favor, selecione um cliente e uma hora.");
      return;
    }
    
    const eventData = {
      title: clienteNome,
      start: Timestamp.fromDate(currentEvent.start),
      end: Timestamp.fromDate(currentEvent.start),
      extendedProps: {
        clienteId: clienteId,
        clienteNome: clienteNome,
        descricao: currentEvent.extendedProps.descricao,
        nomeParticipante: currentEvent.extendedProps.nomeParticipante,
        contatoParticipante: currentEvent.extendedProps.contatoParticipante,
        autor: auth.currentUser.displayName,
        autorId: auth.currentUser.uid,
      },
    };

    try {
      if (isEditing) {
        const eventRef = doc(db, 'agendamentos', currentEvent.id);
        await updateDoc(eventRef, eventData);
      } else {
        await addDoc(collection(db, 'agendamentos'), eventData);
      }
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    }
    handleClose();
  };
  
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Tem certeza que deseja excluir este agendamento?")) {
        try {
            await deleteDoc(doc(db, 'agendamentos', eventId));
        } catch (error) {
            console.error("Erro ao excluir agendamento:", error);
        }
        handleClose();
    }
  };

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>; }

  const podeGerenciarEvento = selectedEvent && (perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.uid === selectedEvent.extendedProps.autorId);

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, '.fc-header-toolbar': { flexDirection: { xs: 'column', md: 'row' } } }}>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth' }}
          events={eventos}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={true}
          locale={ptBrLocale}
          height="75vh"
        />
      </Paper>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Editar Agendamento' : 'Agendar Novo Treinamento'}</DialogTitle>
        <DialogContent>
          <Autocomplete
            options={clientes}
            getOptionLabel={(option) => option.nomeCliente || ''}
            value={clientes.find(c => c.id === currentEvent?.extendedProps.clienteId) || null}
            onChange={(event, newValue) => {
              setCurrentEvent(prev => ({ ...prev, extendedProps: { ...prev.extendedProps, clienteId: newValue?.id || '', clienteNome: newValue?.nomeCliente || '' } }));
            }}
            renderInput={(params) => <TextField {...params} label="Buscar cliente..." margin="normal" />}
          />
          <TextField margin="normal" fullWidth label="Nome do Participante" value={currentEvent?.extendedProps.nomeParticipante || ''} onChange={(e) => setCurrentEvent(prev => ({...prev, extendedProps: {...prev.extendedProps, nomeParticipante: e.target.value}}))} />
          <TextField margin="normal" fullWidth label="Contato do Participante" value={currentEvent?.extendedProps.contatoParticipante || ''} onChange={(e) => setCurrentEvent(prev => ({...prev, extendedProps: {...prev.extendedProps, contatoParticipante: e.target.value}}))} />
          <TimePicker label="Hora do Treinamento" value={dayjs(currentEvent?.start)} onChange={(newValue) => setCurrentEvent(prev => ({...prev, start: newValue.toDate()}))} sx={{ width: '100%', mt: 2 }} />
          <TextField margin="normal" fullWidth label="Descrição (Ex: Treinamento Financeiro)" value={currentEvent?.extendedProps.descricao || ''} onChange={(e) => setCurrentEvent(prev => ({...prev, extendedProps: {...prev.extendedProps, descricao: e.target.value}}))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button onClick={handleSaveEvent} variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>

      {selectedEvent && (
        <Dialog open={viewOpen} onClose={handleClose}>
          <DialogTitle sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            {selectedEvent.title}
            {podeGerenciarEvento && (
              <Box>
                <Tooltip title="Editar Agendamento"><IconButton onClick={handleEditClick}><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Excluir Agendamento"><IconButton onClick={() => handleDeleteEvent(selectedEvent.id)}><DeleteIcon /></IconButton></Tooltip>
              </Box>
            )}
          </DialogTitle>
          <DialogContent>
            <List>
              <ListItem><ListItemText primary="Participante" secondary={selectedEvent.extendedProps.nomeParticipante || 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Contato" secondary={selectedEvent.extendedProps.contatoParticipante || 'N/A'} /></ListItem>
              <ListItem><ListItemText primary="Descrição" secondary={selectedEvent.extendedProps.descricao || 'Nenhuma'} /></ListItem>
              <ListItem><ListItemText primary="Data" secondary={dayjs(selectedEvent.start).format('DD/MM/YYYY')} /></ListItem>
              <ListItem><ListItemText primary="Hora" secondary={dayjs(selectedEvent.start).format('HH:mm')} /></ListItem>
              <ListItem><ListItemText primary="Agendado por" secondary={selectedEvent.extendedProps.autor} /></ListItem>
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Fechar</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}