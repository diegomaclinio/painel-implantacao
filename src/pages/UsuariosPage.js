// src/pages/UsuariosPage.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { useOutletContext } from 'react-router-dom';
import { Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Select, MenuItem, Tooltip, Box, CircularProgress, Chip } from '@mui/material';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

export default function UsuariosPage() {
  const { perfilUsuario } = useOutletContext();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfilUsuario?.funcao !== 'supervisor') {
      setLoading(false);
      return;
    }
    const unsubscribe = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [perfilUsuario]);

  const handleUpdateUser = async (userId, field, value) => {
    const userDocRef = doc(db, 'usuarios', userId);
    try {
      await updateDoc(userDocRef, { [field]: value });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  if (perfilUsuario?.funcao !== 'supervisor') {
    return <Typography sx={{ p: 3 }}>Acesso negado. Apenas supervisores podem ver esta página.</Typography>;
  }

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>Gerenciamento de Colaboradores</Typography>
      <TableContainer>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nome</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Função</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usuarios.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>{user.nome}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={user.funcao}
                    onChange={(e) => handleUpdateUser(user.id, 'funcao', e.target.value)}
                    variant="standard"
                    disabled={user.id === perfilUsuario.uid}
                    sx={{ minWidth: 150 }}
                  >
                    <MenuItem value="implantacao">Técnico de Implantação</MenuItem>
                    <MenuItem value="primeiro_contato">Técnico de Primeiro Contato</MenuItem>
                    <MenuItem value="suporte">Técnico de Suporte</MenuItem>
                    <MenuItem value="supervisor">Supervisor</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Chip label={user.status === 'inativo' ? 'Inativo' : 'Ativo'} color={user.status === 'inativo' ? 'error' : 'success'} size="small"/>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title={user.status === 'inativo' ? 'Ativar Usuário' : 'Desativar Usuário'}>
                    <span>
                      <IconButton 
                        onClick={() => handleUpdateUser(user.id, 'status', user.status === 'inativo' ? 'ativo' : 'inativo')}
                        disabled={user.id === perfilUsuario.uid}
                      >
                        {user.status === 'inativo' ? <ToggleOffIcon /> : <ToggleOnIcon color="success" />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}