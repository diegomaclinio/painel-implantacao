// src/components/PrivateLayout.js
import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Layout from './Layout';
import { CircularProgress, Box } from '@mui/material';

export default function PrivateLayout() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perfilUsuario, setPerfilUsuario] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPerfilUsuario({ ...docSnap.data(), uid: user.uid });
        } else {
          setPerfilUsuario(null);
        }
      } else {
        setUser(null);
        setPerfilUsuario(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return user && perfilUsuario 
    ? <Layout perfilUsuario={perfilUsuario}><Outlet context={{ perfilUsuario }} /></Layout> 
    : <Navigate to="/login" />;
}