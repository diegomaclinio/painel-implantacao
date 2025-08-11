// Arquivo: src/firebaseConfig.js

// Importando as funções necessárias do SDK do Firebase que vamos usar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// O objeto de configuração que você copiou do console do Firebase
// TODO: Substitua os valores abaixo pelos valores do SEU projeto!
const firebaseConfig = {
  apiKey: "AIzaSyCwpitWUnF-f-7G7wEE6iMt-wB_KH4aUwY",
  authDomain: "painel-implantacao.firebaseapp.com",
  projectId: "painel-implantacao",
  storageBucket: "painel-implantacao.firebasestorage.app",
  messagingSenderId: "15936518141",
  appId: "1:15936518141:web:50094f947a19c254e08b94"
};

// Inicializando o aplicativo Firebase com as nossas configurações
const app = initializeApp(firebaseConfig);

// Exportando os serviços que vamos usar em outras partes do nosso sistema
// db: nosso banco de dados Firestore
// auth: nosso sistema de autenticação
export const db = getFirestore(app);
export const auth = getAuth(app);