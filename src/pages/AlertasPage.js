// src/pages/AlertasPage.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Paper, Typography, List, ListItem, ListItemText, Divider, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "alertasSupervisor"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlertas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleResolverAlerta = async (alertaId) => {
    const alertaDocRef = doc(db, 'alertasSupervisor', alertaId);
    try {
      await updateDoc(alertaDocRef, { status: 'resolvido' });
    } catch (error) {
      console.error("Erro ao resolver alerta:", error);
    }
  };
  
  const alertasPendentes = alertas.filter(a => a.status === 'pendente');
  const alertasResolvidos = alertas.filter(a => a.status === 'resolvido');

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>Alertas dos Clientes</Typography>
      
      <Typography variant="h6" gutterBottom>Pendentes</Typography>
      <List>
        {alertasPendentes.map(alerta => (
          <ListItem key={alerta.id} divider secondaryAction={
            <Button variant="contained" size="small" onClick={() => handleResolverAlerta(alerta.id)}>Marcar como Resolvido</Button>
          }>
            <ListItemText
              primary={<Box component={Link} to={`/cliente/${alerta.clienteId}`} sx={{color: 'inherit', textDecoration: 'none'}}><strong>{alerta.clienteNome}</strong></Box>}
              secondary={<>{`"${alerta.motivo}"`}<br/>{`- Por: ${alerta.tecnicoNome} em ${new Date(alerta.data.seconds * 1000).toLocaleDateString('pt-BR')}`}</>}
            />
          </ListItem>
        ))}
        {alertasPendentes.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ml: 2}}>Nenhum alerta pendente.</Typography>}
      </List>
      
      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>Resolvidos</Typography>
      <List>
        {alertasResolvidos.map(alerta => (
          <ListItem key={alerta.id} divider>
            <ListItemText
              primary={<Box component={Link} to={`/cliente/${alerta.clienteId}`} sx={{color: 'inherit', textDecoration: 'none'}}><strong>{alerta.clienteNome}</strong></Box>}
              secondary={<>{`"${alerta.motivo}"`}<br/>{`- Por: ${alerta.tecnicoNome} em ${new Date(alerta.data.seconds * 1000).toLocaleDateString('pt-BR')}`}</>}
            />
          </ListItem>
        ))}
         {alertasResolvidos.length === 0 && <Typography variant="body2" color="text.secondary" sx={{ml: 2}}>Nenhum alerta resolvido.</Typography>}
      </List>
    </Paper>
  );
}