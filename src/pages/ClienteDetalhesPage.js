// src/pages/ClienteDetalhesPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, Timestamp, addDoc, collection } from 'firebase/firestore';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import { Container, Paper, Typography, Box, Button, List, ListItem, ListItemText, Divider, CircularProgress, IconButton, Checkbox, LinearProgress, ListItemIcon, Grid, Dialog, DialogTitle, DialogContent, DialogActions, ListItemSecondaryAction, TextField, Select, MenuItem, FormControl, InputLabel, DialogContentText } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChecklistIcon from '@mui/icons-material/Checklist';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

function ClienteDetalhesPage() {
  const { clienteId } = useParams();
  const navigate = useNavigate();
  const { perfilUsuario } = useOutletContext();
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [progresso, setProgresso] = useState(0);
  const [checklistModal, setChecklistModal] = useState({ open: false, title: '', etapas: [], tipo: '', isReadOnly: true });
  const [editingComment, setEditingComment] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [finalizacaoModalOpen, setFinalizacaoModalOpen] = useState(false);
  const [finalizacaoData, setFinalizacaoData] = useState({ tipo: 'concluido', motivo: '' });

  const podeEditarPreImplantacao = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.funcao === 'primeiro_contato';
  const podeEditarImplantacao = perfilUsuario?.funcao === 'supervisor' || (perfilUsuario?.funcao === 'implantacao' && perfilUsuario?.uid === cliente?.idTecnicoImplantacao);
  const isReadOnlyGeral = perfilUsuario?.funcao === 'suporte';
  const podeEditarNome = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.funcao === 'primeiro_contato';
  const podeSolicitarFinalizacao = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.funcao === 'implantacao';

  useEffect(() => {
    const docRef = doc(db, 'clientes', clienteId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const dadosCliente = { id: docSnap.id, ...docSnap.data() };
        setCliente(dadosCliente);
        setEditedName(dadosCliente.nomeCliente);
        const totalEtapas = (dadosCliente.etapasPreImplantacao?.length || 0) + (dadosCliente.etapasImplantacao?.length || 0);
        const concluidas = (dadosCliente.etapasPreImplantacao?.filter(e => e.concluida).length || 0) + (dadosCliente.etapasImplantacao?.filter(e => e.concluida).length || 0);
        setProgresso(totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0);
      } else {
        setCliente(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [clienteId]);

  const handleSaveName = async () => {
    if (editedName.trim() === '') return;
    const clienteDocRef = doc(db, 'clientes', clienteId);
    try {
      await updateDoc(clienteDocRef, { nomeCliente: editedName });
      setIsEditingName(false);
    } catch (error) { console.error("Erro ao atualizar nome do cliente:", error); }
  };

  const handleOpenChecklist = (tipo) => {
    if (!cliente) return;
    if (tipo === 'pre') {
      setChecklistModal({ open: true, title: 'Checklist Pré-Implantação', etapas: cliente.etapasPreImplantacao || [], tipo: 'etapasPreImplantacao', isReadOnly: !podeEditarPreImplantacao });
    } else {
      setChecklistModal({ open: true, title: 'Checklist de Implantação', etapas: cliente.etapasImplantacao || [], tipo: 'etapasImplantacao', isReadOnly: !podeEditarImplantacao });
    }
  };

  const handleToggleEtapa = async (indexDaEtapa) => {
    if (checklistModal.isReadOnly) return;
    const novasEtapas = [...checklistModal.etapas];
    novasEtapas[indexDaEtapa].concluida = !novasEtapas[indexDaEtapa].concluida;
    const clienteDocRef = doc(db, 'clientes', clienteId);
    await updateDoc(clienteDocRef, { [checklistModal.tipo]: novasEtapas });
    setChecklistModal(prev => ({ ...prev, etapas: novasEtapas }));
  };

  const handleAdicionarComentario = async (e) => {
    e.preventDefault();
    if (isReadOnlyGeral || !novoComentario || novoComentario === '<p><br></p>') return;
    const comentario = {
      id: `comment_${Date.now()}`,
      texto: novoComentario,
      autor: auth.currentUser.displayName || 'N/A',
      autorId: auth.currentUser.uid,
      data: new Date()
    };
    const clienteDocRef = doc(db, 'clientes', clienteId);
    try {
      await updateDoc(clienteDocRef, { observacoes: arrayUnion(comentario) });
      setNovoComentario('');
    } catch (error) { console.error("Erro ao adicionar comentário: ", error); }
  };
  
  const handleExcluirComentario = async (comentarioParaExcluir) => {
    if (!window.confirm("Tem certeza que deseja excluir este comentário?")) return;
    const clienteDocRef = doc(db, 'clientes', clienteId);
    try {
      await updateDoc(clienteDocRef, { observacoes: arrayRemove(comentarioParaExcluir) });
    } catch (error) {
      console.error("Erro ao excluir comentário: ", error);
    }
  };

  const handleAbrirEdicao = (comentario) => {
    setEditingComment(comentario);
    setEditedText(comentario.texto);
  };

  const handleSalvarEdicao = async () => {
    if (!editingComment || !cliente) return;
    const novasObservacoes = cliente.observacoes.map(obs => 
      obs.id === editingComment.id ? { ...obs, texto: editedText } : obs
    );
    const clienteDocRef = doc(db, 'clientes', clienteId);
    try {
      await updateDoc(clienteDocRef, { observacoes: novasObservacoes });
    } catch (error) {
      console.error("Erro ao salvar edição: ", error);
    } finally {
      setEditingComment(null);
      setEditedText('');
    }
  };

  const handleDateChange = async (fieldName, newValue) => {
    if (isReadOnlyGeral) return;
    const clienteDocRef = doc(db, 'clientes', clienteId);
    try {
      await updateDoc(clienteDocRef, { [fieldName]: newValue ? Timestamp.fromDate(newValue.toDate()) : null });
    } catch (error) { console.error("Erro ao atualizar data: ", error); }
  };
  
  const handleSolicitarFinalizacao = async () => {
    if (!finalizacaoData.motivo.trim()) {
      alert('Por favor, adicione um motivo/justificativa.');
      return;
    }
    try {
      await addDoc(collection(db, 'solicitacoesFinalizacao'), {
        clienteId: cliente.id,
        clienteNome: cliente.nomeCliente,
        solicitanteId: perfilUsuario.uid,
        solicitanteNome: perfilUsuario.nome,
        tipo: finalizacaoData.tipo,
        motivo: finalizacaoData.motivo,
        data: Timestamp.now(),
        status: 'pendente'
      });
      alert('Solicitação de finalização enviada ao supervisor!');
      setFinalizacaoModalOpen(false);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      alert('Erro ao enviar solicitação.');
    }
  };

  if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>; }
  if (!cliente) { return <Typography>Cliente não encontrado.</Typography>; }

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
          {isEditingName ? (
            <>
              <TextField value={editedName} onChange={(e) => setEditedName(e.target.value)} variant="standard" autoFocus sx={{ flexGrow: 1, '& .MuiInput-input': { fontSize: '2.125rem' } }} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }} />
              <IconButton onClick={handleSaveName} color="primary"><SaveIcon /></IconButton>
              <IconButton onClick={() => setIsEditingName(false)}><CancelIcon /></IconButton>
            </>
          ) : (
            <>
              <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>{cliente.nomeCliente}</Typography>
              {podeEditarNome && !isReadOnlyGeral && (
                <IconButton onClick={() => { setIsEditingName(true); setEditedName(cliente.nomeCliente); }}><EditIcon /></IconButton>
              )}
            </>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">{`Progresso Geral: ${progresso}%`}</Typography>
            <LinearProgress variant="determinate" value={progresso} />
        </Box>
        <Grid container spacing={3} sx={{ my: 3 }}>
          <Grid item xs={12} sm={6}><DatePicker disabled={isReadOnlyGeral} format="DD/MM/YYYY" label="Próximo Contato" value={cliente.dataProxContato ? dayjs(cliente.dataProxContato.toDate()) : null} onChange={(newValue) => handleDateChange('dataProxContato', newValue)} sx={{ width: '100%' }} /></Grid>
          <Grid item xs={12} sm={6}><DatePicker disabled={isReadOnlyGeral} format="DD/MM/YYYY" label="Previsão de Implantação" value={cliente.dataPrevImplantacao ? dayjs(cliente.dataPrevImplantacao.toDate()) : null} onChange={(newValue) => handleDateChange('dataPrevImplantacao', newValue)} sx={{ width: '100%' }}/></Grid>
        </Grid>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, my: 3 }}>
          <Button variant="outlined" startIcon={<ChecklistIcon />} onClick={() => handleOpenChecklist('pre')}>Checklist Pré-Implantação</Button>
          <Button variant="outlined" startIcon={<ChecklistIcon />} onClick={() => handleOpenChecklist('implantacao')}>Checklist de Implantação</Button>
          {podeSolicitarFinalizacao && cliente.statusGeral === 'ativo' && (
            <Button variant="contained" color="error" startIcon={<ExitToAppIcon />} onClick={() => setFinalizacaoModalOpen(true)}>
              Finalizar Processo
            </Button>
          )}
        </Box>
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6">Observações e Histórico</Typography>
        <List>
          {cliente.observacoes?.sort((a, b) => b.data.seconds - a.data.seconds).map((obs, index) => {
            const podeGerenciar = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.uid === obs.autorId;
            return (
              <ListItem key={obs.id || index} divider alignItems="flex-start">
                <ListItemText
                  primary={<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(obs.texto) }} />}
                  secondary={`Por: ${obs.autor} - ${new Date(obs.data.seconds * 1000).toLocaleString('pt-BR')}`}
                />
                {podeGerenciar && !isReadOnlyGeral && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleAbrirEdicao(obs)}><EditIcon /></IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleExcluirComentario(obs)}><DeleteIcon /></IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>
        <Box component="form" onSubmit={handleAdicionarComentario} sx={{ mt: 4 }}>
          <ReactQuill 
            theme="snow" value={novoComentario} onChange={setNovoComentario}
            readOnly={isReadOnlyGeral} modules={{ toolbar: isReadOnlyGeral ? false : true }}
          />
          <Button type="submit" variant="contained" sx={{ mt: 2 }} disabled={isReadOnlyGeral}>Adicionar Comentário</Button>
        </Box>
      </Paper>
      <Dialog open={checklistModal.open} onClose={() => setChecklistModal({ open: false, title: '', etapas: [] })} fullWidth maxWidth="sm">
        <DialogTitle>{checklistModal.title}</DialogTitle>
        <DialogContent>
          <List>
            {checklistModal.etapas?.map((etapa, index) => (
              <ListItem key={index} dense button onClick={() => handleToggleEtapa(index)} disabled={checklistModal.isReadOnly}>
                <ListItemIcon><Checkbox edge="start" checked={etapa.concluida} tabIndex={-1} disableRipple disabled={checklistModal.isReadOnly} /></ListItemIcon>
                <ListItemText primary={etapa.nome} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChecklistModal({ open: false, title: '', etapas: [] })}>Fechar</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={!!editingComment} onClose={() => setEditingComment(null)} fullWidth maxWidth="md">
        <DialogTitle>Editar Comentário</DialogTitle>
        <DialogContent sx={{pt: '20px !important'}}><ReactQuill theme="snow" value={editedText} onChange={setEditedText} /></DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingComment(null)}>Cancelar</Button>
          <Button onClick={handleSalvarEdicao} variant="contained">Salvar Alterações</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={finalizacaoModalOpen} onClose={() => setFinalizacaoModalOpen(false)} fullWidth>
        <DialogTitle>Solicitar Finalização de Cliente</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb: 2}}>Selecione o tipo e descreva o motivo para a finalização do processo com este cliente.</DialogContentText>
          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Finalização</InputLabel>
            <Select value={finalizacaoData.tipo} label="Tipo de Finalização" onChange={(e) => setFinalizacaoData({...finalizacaoData, tipo: e.target.value})}>
              <MenuItem value="concluido">Concluído</MenuItem>
              <MenuItem value="suspenso">Suspenso</MenuItem>
              <MenuItem value="cancelado">Cancelado</MenuItem>
            </Select>
          </FormControl>
          <TextField fullWidth multiline rows={4} margin="normal" label="Motivo / Comentário Final" value={finalizacaoData.motivo} onChange={(e) => setFinalizacaoData({...finalizacaoData, motivo: e.target.value})} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinalizacaoModalOpen(false)}>Cancelar</Button>
          <Button onClick={handleSolicitarFinalizacao} variant="contained">Enviar Solicitação</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
export default ClienteDetalhesPage;