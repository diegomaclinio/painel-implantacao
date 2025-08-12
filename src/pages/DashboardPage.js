// src/pages/DashboardPage.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { auth, db } from '../firebaseConfig';
import { collection, query, onSnapshot, doc, deleteDoc, updateDoc, getDoc, where, addDoc, Timestamp } from "firebase/firestore";
import AdicionarClienteForm from '../components/AdicionarClienteForm';
import KanbanBoard from '../components/kanban/KanbanBoard';
import { Container, Grid, IconButton, Select, MenuItem, Box, Typography, Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, Button as MuiButton, ToggleButtonGroup, ToggleButton, CircularProgress, DialogTitle, List, ListItem, ListItemText, Paper, Divider, TextField, Tooltip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress, InputAdornment } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

function DashboardPage() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);
  const [tecnicos, setTecnicos] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [alertas, setAlertas] = useState([]);
  const [alertaDialogOpen, setAlertaDialogOpen] = useState(false);
  const [proximasTarefas, setProximasTarefas] = useState([]);
  const isInitialMount = useRef(true);
  const [alertaClienteModal, setAlertaClienteModal] = useState({ open: false, clienteId: null, clienteNome: '' });
  const [motivoAlerta, setMotivoAlerta] = useState('');
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const podeAdicionarCliente = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.funcao === 'primeiro_contato';
  const podeAtribuirTecnico = perfilUsuario?.funcao === 'supervisor' || perfilUsuario?.funcao === 'primeiro_contato';

  const handleViewChange = (event, newViewMode) => { if (newViewMode !== null) { setViewMode(newViewMode); } };
  const handleExcluirClick = (id) => { setClienteParaExcluir(id); setDialogOpen(true); };

  const handleConfirmarExclusao = async () => {
    if (clienteParaExcluir) {
      try {
        await deleteDoc(doc(db, 'clientes', clienteParaExcluir));
        setSnackbar({ open: true, message: 'Cliente excluído com sucesso!', severity: 'success' });
      } catch (error) { setSnackbar({ open: true, message: 'Erro ao excluir cliente.', severity: 'error' }); }
      finally { setDialogOpen(false); setClienteParaExcluir(null); }
    }
  };

  const handleAtribuirTecnico = async (clienteId, tecnicoId) => {
    try {
      await updateDoc(doc(db, 'clientes', clienteId), { idTecnicoImplantacao: tecnicoId || null });
      setSnackbar({ open: true, message: 'Técnico atribuído com sucesso!', severity: 'success' });
    } catch (error) { setSnackbar({ open: true, message: 'Erro ao atribuir técnico.', severity: 'error' }); }
  };

  const handleAlertarSupervisor = async () => {
    if (!motivoAlerta.trim()) return;
    try {
      await addDoc(collection(db, 'alertasSupervisor'), {
        clienteId: alertaClienteModal.clienteId, clienteNome: alertaClienteModal.clienteNome,
        motivo: motivoAlerta, tecnicoId: perfilUsuario.uid, tecnicoNome: perfilUsuario.nome,
        data: Timestamp.now(), status: 'pendente'
      });
      setSnackbar({ open: true, message: 'Supervisor alertado com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao enviar alerta.', severity: 'error' });
    } finally {
      setAlertaClienteModal({ open: false, clienteId: null, clienteNome: '' });
      setMotivoAlerta('');
    }
  };

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const perfil = { ...docSnap.data(), uid: user.uid };
          setPerfilUsuario(perfil);
          if (perfil.funcao === 'supervisor' || perfil.funcao === 'primeiro_contato') {
            const tecnicosQuery = query(collection(db, "usuarios"), where("funcao", "==", "implantacao"));
            onSnapshot(tecnicosQuery, (snapshot) => setTecnicos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
          }
        }
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!perfilUsuario) return;
    setLoading(true);
    let q;
    if (perfilUsuario.funcao === 'supervisor' || perfilUsuario.funcao === 'suporte') {
      q = query(collection(db, "clientes"));
    } else if (perfilUsuario.funcao === 'primeiro_contato') {
      q = query(collection(db, "clientes"), where("idTecnicoImplantacao", "==", null));
    } else {
      q = query(collection(db, "clientes"), where("idTecnicoImplantacao", "==", perfilUsuario.uid));
    }
    const unsubscribeClientes = onSnapshot(q, (querySnapshot) => {
      const clientesData = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setClientes(clientesData);
      setLoading(false);

      const hoje = dayjs();
      const alertasEncontrados = [];
      const tarefasEncontradas = [];
      clientesData.forEach(cliente => {
        if (cliente.dataPrevImplantacao) {
          const dataAlvo = dayjs(cliente.dataPrevImplantacao.toDate());
          const diff = dataAlvo.diff(hoje, 'day');
          if (diff >= 0 && diff <= 5) {
            const totalEtapas = (cliente.etapasPreImplantacao?.length || 0) + (cliente.etapasImplantacao?.length || 0);
            const concluidas = (cliente.etapasPreImplantacao?.filter(e => e.concluida).length || 0) + (cliente.etapasImplantacao?.filter(e => e.concluida).length || 0);
            const progresso = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;
            alertasEncontrados.push({
              clienteNome: cliente.nomeCliente, tipo: 'Previsão de Implantação', diasRestantes: diff, data: dataAlvo.format('DD/MM/YYYY'), progresso
            });
          }
        }
        const proximaEtapa = cliente.etapasImplantacao?.find(e => !e.concluida);
        if (proximaEtapa) {
          tarefasEncontradas.push({ clienteId: cliente.id, clienteNome: cliente.nomeCliente, nomeEtapa: proximaEtapa.nome });
        }
      });
      setProximasTarefas(tarefasEncontradas);
      if (alertasEncontrados.length > 0 && isInitialMount.current) {
        setAlertas(alertasEncontrados);
        setAlertaDialogOpen(true);
        isInitialMount.current = false;
      }
    });
    return () => unsubscribeClientes();
  }, [perfilUsuario]);

  const filteredClientes = useMemo(() => {
    if (!searchTerm) return clientes;
    return clientes.filter(c => c.nomeCliente.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [clientes, searchTerm]);

  const renderTable = () => (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Cliente</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Responsável</TableCell>
            <TableCell sx={{ fontWeight: 'bold', minWidth: 150 }}>Progresso</TableCell>
            {podeAtribuirTecnico && <TableCell sx={{ fontWeight: 'bold', minWidth: 200 }}>Técnico Responsável</TableCell>}
            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={podeAtribuirTecnico ? 5 : 4} align="center"><CircularProgress /></TableCell></TableRow>
          ) : (
            filteredClientes.map((cliente) => {
              const totalEtapas = (cliente.etapasPreImplantacao?.length || 0) + (cliente.etapasImplantacao?.length || 0);
              const concluidas = (cliente.etapasPreImplantacao?.filter(e => e.concluida).length || 0) + (cliente.etapasImplantacao?.filter(e => e.concluida).length || 0);
              const progresso = totalEtapas > 0 ? Math.round((concluidas / totalEtapas) * 100) : 0;
              return (
                <TableRow key={cliente.id} hover>
                  <TableCell component={Link} to={`/cliente/${cliente.id}`} sx={{ textDecoration: 'none', color: 'inherit', fontWeight: '500', cursor: 'pointer' }}>{cliente.nomeCliente}</TableCell>
                  <TableCell>{cliente.contatoNome || 'N/A'}<br /><Typography variant="caption">{cliente.contatoTelefone || ''}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: '100%', mr: 1 }}><LinearProgress variant="determinate" value={progresso} /></Box>
                      <Box sx={{ minWidth: 35 }}><Typography variant="body2" color="text.secondary">{`${progresso}%`}</Typography></Box>
                    </Box>
                  </TableCell>
                  {podeAtribuirTecnico && (
                    <TableCell>
                      <Select size="small" sx={{ width: '100%' }} value={cliente.idTecnicoImplantacao || ''} onChange={(e) => handleAtribuirTecnico(cliente.id, e.target.value)} displayEmpty>
                        <MenuItem value=""><em>Ninguém</em></MenuItem>
                        {tecnicos.map(t => <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>)}
                      </Select>
                    </TableCell>
                  )}
                  <TableCell align="right">
                    {perfilUsuario?.funcao === 'implantacao' && (
                      <Tooltip title="Alertar Supervisor">
                        <IconButton size="small" color="warning" onClick={() => setAlertaClienteModal({ open: true, clienteId: cliente.id, clienteNome: cliente.nomeCliente })}>
                          <ReportProblemIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {perfilUsuario?.funcao === 'supervisor' && (
                      <Tooltip title="Mover para a Lixeira">
                        <IconButton size="small" onClick={() => handleExcluirClick(cliente.id)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth={false} sx={{ mt: -2, mx: -1 }}>
      {podeAdicionarCliente ? (
        <>
          <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)}>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogContent><AdicionarClienteForm setSnackbar={setSnackbar} perfilUsuario={perfilUsuario} onClose={() => setFormDialogOpen(false)} /></DialogContent>
          </Dialog>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h5">Clientes Ativos</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TextField size="small" variant="outlined" placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>), }} />
              <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
                <ToggleButton value="list" aria-label="visualização em lista"><ViewListIcon /></ToggleButton>
                <ToggleButton value="kanban" aria-label="visualização kanban"><ViewKanbanIcon /></ToggleButton>
              </ToggleButtonGroup>
              <MuiButton variant="contained" startIcon={<AddIcon />} onClick={() => setFormDialogOpen(true)}>Novo Cliente</MuiButton>
            </Box>
          </Box>
          {viewMode === 'list' ? renderTable() : (loading ? <CircularProgress /> : <KanbanBoard clientes={filteredClientes} />)}
        </>
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom><EventBusyIcon sx={{ verticalAlign: 'bottom', mr: 1 }} />Meus Alertas</Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {alertas.length > 0 ? alertas.map((a, i) => (
                  <ListItem key={i}>
                    <ListItemText primary={a.clienteNome} secondary={`${a.tipo} em ${a.diasRestantes} dia(s)`} />
                  </ListItem>
                )) : (
                  <Typography variant="body2" color="text.secondary">Nenhum prazo próximo.</Typography>
                )}
              </List>
            </Paper>

            {perfilUsuario?.funcao !== 'suporte' && (
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom><PlaylistAddCheckIcon sx={{ verticalAlign: 'bottom', mr: 1 }} />Minhas Próximas Tarefas</Typography>
                <Divider sx={{ mb: 1 }} />
                <List dense>
                  {proximasTarefas.length > 0 ? proximasTarefas.map((t, i) => (
                    <ListItem key={i} component={Link} to={`/cliente/${t.clienteId}`} button>
                      <ListItemText primary={t.clienteNome} secondary={`Próxima etapa: ${t.nomeEtapa}`} />
                    </ListItem>
                  )) : (
                    <Typography variant="body2" color="text.secondary">Nenhuma tarefa pendente.</Typography>
                  )}
                </List>
              </Paper>
            )}
          </Grid>

          <Grid item xs={12} lg={8}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h5">Meus Clientes</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField
                  size="small"
                  variant="outlined"
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewChange} size="small">
                  <ToggleButton value="list" aria-label="visualização em lista"><ViewListIcon /></ToggleButton>
                  <ToggleButton value="kanban" aria-label="visualização kanban"><ViewKanbanIcon /></ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Box>
            {viewMode === 'list' ? renderTable() : (loading ? <CircularProgress /> : <KanbanBoard clientes={filteredClientes} />)}
          </Grid>
        </Grid>
      )}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Mover cliente para a Lixeira?</DialogTitle>
        <DialogContent><DialogContentText>Esta ação moverá o cliente para a lixeira. Ele poderá ser recuperado depois.</DialogContentText></DialogContent>
        <DialogActions><MuiButton onClick={() => setDialogOpen(false)}>Cancelar</MuiButton><MuiButton onClick={handleConfirmarExclusao} color="error">Mover para Lixeira</MuiButton></DialogActions>
      </Dialog>
      <Dialog open={alertaDialogOpen} onClose={() => setAlertaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alertas de Prazos Próximos!</DialogTitle>
        <DialogContent>
          <List>
            {alertas.map((alerta, index) => (<ListItem key={index}><ListItemText primary={`${alerta.tipo} com ${alerta.clienteNome}`} secondary={alerta.diasRestantes > 0 ? `Vence em ${alerta.diasRestantes} dia(s) - ${alerta.data} (Progresso: ${alerta.progresso}%)` : `Vence HOJE! - ${alerta.data} (Progresso: ${alerta.progresso}%)`} /></ListItem>))}
          </List>
        </DialogContent>
        <DialogActions><MuiButton onClick={() => setAlertaDialogOpen(false)}>Entendido</MuiButton></DialogActions>
      </Dialog>
      <Dialog open={alertaClienteModal.open} onClose={() => setAlertaClienteModal({ open: false, clienteId: null, clienteNome: '' })} fullWidth>
        <DialogTitle>Alertar Supervisor sobre {alertaClienteModal.clienteNome}</DialogTitle>
        <DialogContent>
          <TextField autoFocus multiline rows={4} margin="dense" label="Motivo do Alerta" type="text" fullWidth variant="standard" value={motivoAlerta} onChange={(e) => setMotivoAlerta(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setAlertaClienteModal({ open: false, clienteId: null, clienteNome: '' })}>Cancelar</MuiButton>
          <MuiButton onClick={handleAlertarSupervisor}>Enviar Alerta</MuiButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DashboardPage;