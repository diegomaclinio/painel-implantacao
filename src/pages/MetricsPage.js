// src/pages/MetricsPage.js
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Container, Grid, Paper, Typography, Box, CircularProgress, Divider, IconButton } from '@mui/material';
import { useNavigate, useOutletContext } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function MetricsPage() {
  const navigate = useNavigate();
  const { perfilUsuario } = useOutletContext();
  const [clientes, setClientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (perfilUsuario && perfilUsuario.funcao !== 'supervisor') {
      navigate('/');
    }
  }, [perfilUsuario, navigate]);

  useEffect(() => {
    const qClientes = query(collection(db, "clientes"));
    const unsubscribeClientes = onSnapshot(qClientes, (snapshot) => {
      setClientes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    const qUsuarios = query(collection(db, "usuarios"));
    const unsubscribeUsuarios = onSnapshot(qUsuarios, (snapshot) => {
      setUsuarios(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeClientes();
      unsubscribeUsuarios();
    };
  }, []);

  const etapasNomes = [
    'Primeiro Contato (Boas Vindas)', 'Instalação do Software', 'Treinamento Inicial',
    'Validação de Dados', 'Acompanhamento Pós-Implantação', 'Pesquisa de Satisfação',
  ];

  const tecnicos = usuarios.filter(u => u.funcao === 'implantacao');
  
  const dataDistribuicao = {
    labels: tecnicos.map(t => t.nome),
    datasets: [{
      label: 'Clientes por Técnico',
      data: tecnicos.map(t => clientes.filter(c => c.idTecnicoImplantacao === t.id).length),
      backgroundColor: ['#3f51b5', '#f50057', '#4caf50', '#ff9800', '#2196f3', '#9c27b0'],
      hoverOffset: 4,
    }],
  };

  const dataEtapas = {
    labels: etapasNomes,
    datasets: [{
      label: 'Nº de Clientes com a Etapa Concluída',
      data: etapasNomes.map((nomeEtapa, index) => 
        clientes.filter(c => c.etapas && c.etapas[index]?.concluida).length
      ),
      backgroundColor: 'rgba(63, 81, 181, 0.5)',
      borderColor: 'rgba(63, 81, 181, 1)',
      borderWidth: 1,
    }],
  };
  
  const totalClientes = clientes.length;
  const clientesConcluidos = clientes.filter(c => c.etapas?.every(e => e.concluida)).length;

  if (loading || !perfilUsuario || perfilUsuario.funcao !== 'supervisor') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ backgroundColor: '#f4f6f8', minHeight: '100vh', py: 2}}>
      <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}><ArrowBackIcon /></IconButton>
            <Typography variant="h4" component="h1">Dashboard de Métricas</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

        {/* CONTEÚDO COMPLETO DA PÁGINA DE MÉTRICAS */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6">Total de Clientes Ativos</Typography>
              <Typography variant="h3" color="primary">{totalClientes}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6">Clientes 100% Concluídos</Typography>
              <Typography variant="h3" color="primary">{clientesConcluidos}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 2, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6">Total de Técnicos</Typography>
              <Typography variant="h3" color="primary">{tecnicos.length}</Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>Progresso das Etapas (Nº de Clientes)</Typography>
              <Box sx={{ position: 'relative', flexGrow: 1 }}>
                <Bar options={{ responsive: true, maintainAspectRatio: false }} data={dataEtapas} />
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" gutterBottom>Distribuição de Clientes</Typography>
              <Box sx={{ position: 'relative', flexGrow: 1 }}>
                <Doughnut options={{ responsive: true, maintainAspectRatio: false }} data={dataDistribuicao} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default MetricsPage;