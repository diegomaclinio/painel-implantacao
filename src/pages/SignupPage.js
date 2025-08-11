// src/pages/SignupPage.js
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { TextField, Button, Box, Select, MenuItem, FormControl, InputLabel, Typography } from '@mui/material';

function SignupPage() {
  const { perfilUsuario } = useOutletContext();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [funcao, setFuncao] = useState('implantacao');
  const [error, setError] = useState('');

  useEffect(() => {
    if (perfilUsuario && perfilUsuario.funcao !== 'supervisor') {
      navigate('/');
    }
  }, [perfilUsuario, navigate]);
  
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const user = userCredential.user;
      await updateProfile(user, { displayName: nome });
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome, email: email, funcao: funcao,
      });
      alert(`Usuário ${nome} criado com sucesso!`);
      navigate('/');
    } catch (err) {
      setError('Falha ao criar conta. Verifique os dados ou tente outro email.');
      console.error(err);
    }
  };

  if (!perfilUsuario || perfilUsuario.funcao !== 'supervisor') {
    return null; 
  }

  return (
    <Box sx={{ p: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 1, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>Cadastrar Novo Colaborador</Typography>
      <Box component="form" onSubmit={handleSignup}>
        <TextField fullWidth margin="normal" label="Nome Completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <TextField fullWidth margin="normal" label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <TextField fullWidth margin="normal" label="Senha Inicial (genérica)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <FormControl fullWidth margin="normal">
          <InputLabel>Função</InputLabel>
          <Select value={funcao} label="Função" onChange={(e) => setFuncao(e.target.value)}>
            <MenuItem value="implantacao">Técnico de Implantação</MenuItem>
            <MenuItem value="primeiro_contato">Técnico de Primeiro Contato</MenuItem>
            <MenuItem value="suporte">Técnico de Suporte</MenuItem>
            <MenuItem value="supervisor">Supervisor</MenuItem>
          </Select>
        </FormControl>
        {error && <Typography color="error" align="center" sx={{mb: 2}}>{error}</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Cadastrar</Button>
      </Box>
    </Box>
  );
}
export default SignupPage;