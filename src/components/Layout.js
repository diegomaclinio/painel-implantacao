// src/components/Layout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Menu, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button as MuiButton, Snackbar, Alert, Divider, IconButton, Badge } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { auth, db } from '../firebaseConfig';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const drawerWidth = 240;

export default function Layout({ children, perfilUsuario }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [alertasPendentes, setAlertasPendentes] = useState(0);

  useEffect(() => {
    if (perfilUsuario?.funcao === 'supervisor') {
      const q = query(collection(db, 'alertasSupervisor'), where('status', '==', 'pendente'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setAlertasPendentes(snapshot.size);
      });
      return () => unsubscribe();
    }
  }, [perfilUsuario]);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleMenu = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleOpenDialog = () => { setDialogOpen(true); handleClose(); };
  const handleLogout = () => { signOut(auth); };

  const handleChangePassword = async () => {
    if (novaSenha.length < 6) {
      setSnackbar({ open: true, message: 'A nova senha deve ter no mínimo 6 caracteres.', severity: 'error' });
      return;
    }
    const user = auth.currentUser;
    const credencial = EmailAuthProvider.credential(user.email, senhaAtual);
    try {
      await reauthenticateWithCredential(user, credencial);
      await updatePassword(user, novaSenha);
      setSnackbar({ open: true, message: 'Senha alterada com sucesso!', severity: 'success' });
      setDialogOpen(false);
      setSenhaAtual('');
      setNovaSenha('');
    } catch (error) {
      setSnackbar({ open: true, message: 'Senha atual incorreta. Tente novamente.', severity: 'error' });
    }
  };

  const menuItems = [
    { text: 'Clientes', icon: <DashboardIcon />, path: '/', role: ['supervisor', 'implantacao', 'primeiro_contato', 'suporte'] },
    { text: 'Agenda', icon: <CalendarMonthIcon />, path: '/agenda', role: ['supervisor', 'implantacao', 'primeiro_contato', 'suporte'] },
    { text: 'Alertas de Clientes', icon: <Badge badgeContent={alertasPendentes} color="error"><NotificationsIcon /></Badge>, path: '/alertas', role: ['supervisor'] },
    { text: 'Métricas', icon: <AssessmentIcon />, path: '/metricas', role: ['supervisor'] },
    { text: 'Cadastrar Colaborador', icon: <PersonAddIcon />, path: '/signup', role: ['supervisor'] },
    { text: 'Gerenciar Colaboradores', icon: <PeopleIcon />, path: '/usuarios', role: ['supervisor'] },
  ];

  const drawer = (
    <div>
      <Toolbar><Typography variant="h6" noWrap component="div">Painel</Typography></Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          perfilUsuario && item.role.includes(perfilUsuario.funcao) && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton selected={location.pathname === item.path} onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          )
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` }, ml: { sm: `${drawerOpen ? drawerWidth : 0}px` }, transition: (theme) => theme.transitions.create(['margin', 'width'], { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen, }), }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}><MenuIcon /></IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>Gestão de Implantação</Typography>
          {perfilUsuario && (
            <>
              <MuiButton color="inherit" onClick={handleMenu}>{perfilUsuario.nome}</MuiButton>
              <Menu id="menu-appbar" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={handleOpenDialog}>Alterar Senha</MenuItem>
                <MenuItem onClick={handleLogout}><ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>Sair</MenuItem>
              </Menu>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer variant="persistent" anchor="left" open={drawerOpen} sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' }, }}>
        {drawer}
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3, transition: (theme) => theme.transitions.create('margin', { easing: theme.transitions.easing.sharp, duration: theme.transitions.duration.leavingScreen, }), marginLeft: `-${drawerWidth}px`, ...(drawerOpen && { transition: (theme) => theme.transitions.create('margin', { easing: theme.transitions.easing.easeOut, duration: theme.transitions.duration.enteringScreen, }), marginLeft: 0, }), }}>
        <Toolbar />
        {children}
      </Box>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Alterar Senha</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Senha Atual" type="password" fullWidth variant="standard" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} />
          <TextField margin="dense" label="Nova Senha" type="password" fullWidth variant="standard" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <MuiButton onClick={() => setDialogOpen(false)}>Cancelar</MuiButton>
          <MuiButton onClick={handleChangePassword}>Salvar Nova Senha</MuiButton>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}