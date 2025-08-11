// src/components/AdicionarClienteForm.js
import React, { useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Box, TextField, Button, Select, MenuItem, FormControl, InputLabel, Grid } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

function AdicionarClienteForm({ setSnackbar, perfilUsuario, onClose }) {
  const [nomeCliente, setNomeCliente] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [prioridade, setPrioridade] = useState('Normal');
  const [dataProxContato, setDataProxContato] = useState(null);
  const [dataPrevImplantacao, setDataPrevImplantacao] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeCliente) {
      setSnackbar({ open: true, message: 'Por favor, preencha o nome do cliente.', severity: 'warning' });
      return;
    }
    try {
      const novoCliente = {
        nomeCliente,
        contatoNome,
        contatoTelefone,
        prioridade,
        dataEntrada: Timestamp.now(),
        observacoes: [],
        idTecnicoImplantacao: null,
        idTecnicoPrimeiroContato: perfilUsuario?.uid || null,
        etapaPrincipal: 'backlog',
        statusGeral: 'ativo',
        motivoArquivamento: null,
        etapasPreImplantacao: [
          { nome: 'Contrato Assinado', concluida: false },
          { nome: 'Pagamento da Taxa de Implantação', concluida: false },
          { nome: 'Agendamento Inicial', concluida: false },
        ],
        etapasImplantacao: [
          { nome: 'Instalação do Software', concluida: false },
          { nome: 'Treinamento Básico', concluida: false },
          { nome: 'Importação de Dados', concluida: false },
          { nome: 'Treinamento Avançado', concluida: false },
          { nome: 'Go-Live (Início do Uso)', concluida: false },
          { nome: 'Acompanhamento Pós-Implantação', concluida: false },
        ],
        dataProxContato: dataProxContato ? Timestamp.fromDate(dataProxContato.toDate()) : null,
        dataPrevImplantacao: dataPrevImplantacao ? Timestamp.fromDate(dataPrevImplantacao.toDate()) : null,
      };
      await addDoc(collection(db, "clientes"), novoCliente);
      setSnackbar({ open: true, message: 'Cliente adicionado com sucesso!', severity: 'success' });
      
      setNomeCliente(''); 
      setContatoNome(''); 
      setContatoTelefone(''); 
      setPrioridade('Normal');
      setDataProxContato(null);
      setDataPrevImplantacao(null);
      onClose();

    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao adicionar cliente.', severity: 'error' });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1, width: { sm: 500 } }}>
      <Grid container spacing={2}>
        <Grid item xs={12}><TextField fullWidth label="Nome da Empresa/Cliente" value={nomeCliente} onChange={(e) => setNomeCliente(e.target.value)} required /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Nome do Responsável" value={contatoNome} onChange={(e) => setContatoNome(e.target.value)} /></Grid>
        <Grid item xs={12} sm={6}><TextField fullWidth label="Fone do Responsável" value={contatoTelefone} onChange={(e) => setContatoTelefone(e.target.value)} /></Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Prioridade</InputLabel>
            <Select value={prioridade} label="Prioridade" onChange={(e) => setPrioridade(e.target.value)}>
              <MenuItem value="Normal">Normal</MenuItem>
              <MenuItem value="Atenção">Atenção</MenuItem>
              <MenuItem value="Urgente">Urgente</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker format="DD/MM/YYYY" label="Próximo Contato" value={dataProxContato} onChange={(newValue) => setDataProxContato(newValue)} sx={{ width: '💯%' }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <DatePicker format="DD/MM/YYYY" label="Previsão de Implantação" value={dataPrevImplantacao} onChange={(newValue) => setDataPrevImplantacao(newValue)} sx={{ width: '💯%' }} />
        </Grid>
        <Grid item xs={12}>
          <Button type="submit" variant="contained" fullWidth size="large">Adicionar Cliente</Button>
        </Grid>
      </Grid>
    </Box>
  );
}
export default AdicionarClienteForm;