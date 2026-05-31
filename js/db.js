/* ============================================================
   TRIP BURGER — Camada de Dados (Data Layer)
   🔥 FIRESTORE ATIVADO: Todos os dados armazenados no Cloud Firestore
   ============================================================ */

const TB_COLLECTION_PRODUTOS = 'produtos';
const TB_COLLECTION_CONFIG   = 'config';
const TB_COLLECTION_PEDIDOS  = 'pedidos';
const TB_COLLECTION_AVALIACOES = 'avaliacoes';

// Senha do admin (frontend only — trocar por Firebase Auth depois)
const ADMIN_SENHA = 'trip2026';

// ---- Seed de produtos iniciais (para populate inicial no Firestore) ----
const SEED_PRODUTOS = [
  {
    categoria: 'hamburgueres',
    nome: 'Clássico Smash',
    descricao: 'Blend de carne 180g smashado na chapa, queijo cheddar americano, alface, tomate, picles e molho especial da casa.',
    preco: 35.00, tag: 'MAIS PEDIDO', tagColor: '#8C2493',
    imagemUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028663556/AHFfZC39PEFFWQ9nJRFVdh/burger_classico_6020c460.jpg',
    esgotado: false, ordem: 0
  },
  {
    categoria: 'hamburgueres',
    nome: 'Triplo Bacon',
    descricao: 'Dois blends de 150g smashados, bacon crocante, cebola caramelizada, duplo cheddar e molho barbecue defumado.',
    preco: 45.00, tag: 'DESTAQUE', tagColor: '#CC2200',
    imagemUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028663556/AHFfZC39PEFFWQ9nJRFVdh/burger_bacon_c4a128c1.jpg',
    esgotado: false, ordem: 1
  },
  {
    categoria: 'hamburgueres',
    nome: 'Vegan Smash',
    descricao: 'Blend de grão-de-bico e lentilha, abacate fresco, cebola roxa, tomate, alface e maionese vegana.',
    preco: 38.00, tag: 'VEGANO', tagColor: '#4caf50',
    imagemUrl: 'https://d2xsxph8kpxj0f.cloudfront.net/310419663028663556/AHFfZC39PEFFWQ9nJRFVdh/burger_vegano_ea1c5cec.jpg',
    esgotado: false, ordem: 2
  }
];

// Firebase já foi inicializado em script.js

// ============================================================
// INICIALIZAÇÃO — Verificar e popular Firestore com seed se vazio
// ============================================================
async function TB_initDB() {
  try {
    // Verificar se há produtos no Firestore
    const snap = await firestoreDB.collection(TB_COLLECTION_PRODUTOS).limit(1).get();
    if (snap.empty) {
      // Se vazio, popular com SEED_PRODUTOS
      console.log('📦 Populando Firestore com produtos iniciais...');
      for (const produto of SEED_PRODUTOS) {
        await firestoreDB.collection(TB_COLLECTION_PRODUTOS).add({
          ...produto,
          criadoEm: new Date(),
          atualizadoEm: new Date()
        });
      }
      console.log('✓ Seed de produtos adicionada ao Firestore');
    }
  } catch (e) {
    console.error('❌ TB_initDB erro:', e);
  }
}

// ============================================================
// CRUD DE PRODUTOS — FIRESTORE
// ============================================================

async function TB_getProdutos(categoria) {
  try {
    let query = firestoreDB.collection(TB_COLLECTION_PRODUTOS);
    if (categoria) {
      query = query.where('categoria', '==', categoria);
    }
    // Removido query.orderBy('ordem', 'asc') para evitar erro de índice composto no Firestore
    const snap = await query.get();
    
    // Obter os dados e ordenar localmente (JavaScript)
    let produtos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    produtos.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    
    return produtos;
  } catch (e) {
    console.error('❌ TB_getProdutos erro:', e);
    return [];
  }
}

// ============================================================
// REALTIME FOLLOWERS
// ============================================================

function TB_listenProdutos(categoria, callback) {
  let query = firestoreDB.collection(TB_COLLECTION_PRODUTOS);
  if (categoria) {
    query = query.where('categoria', '==', categoria);
  }
  
  return query.onSnapshot(snap => {
    let produtos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    produtos.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    callback(produtos);
  }, error => {
    console.error('❌ TB_listenProdutos erro:', error);
    callback([]);
  });
}

function TB_listenAllProdutos(callback) {
  return firestoreDB.collection(TB_COLLECTION_PRODUTOS).onSnapshot(snap => {
    let produtos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(produtos);
  }, error => {
    console.error('❌ TB_listenAllProdutos erro:', error);
    callback([]);
  });
}

async function TB_addProduto(produto) {
  try {
    const docRef = await firestoreDB.collection(TB_COLLECTION_PRODUTOS).add({
      ...produto,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    });
    return { id: docRef.id, ...produto };
  } catch (e) {
    console.error('❌ TB_addProduto erro:', e);
    throw e;
  }
}

async function TB_updateProduto(id, dados) {
  try {
    await firestoreDB.collection(TB_COLLECTION_PRODUTOS).doc(id).update({
      ...dados,
      atualizadoEm: new Date()
    });
    return { id, ...dados };
  } catch (e) {
    console.error('❌ TB_updateProduto erro:', e);
    throw e;
  }
}

async function TB_deleteProduto(id) {
  try {
    await firestoreDB.collection(TB_COLLECTION_PRODUTOS).doc(id).delete();
  } catch (e) {
    console.error('❌ TB_deleteProduto erro:', e);
    throw e;
  }
}

// ============================================================
// UPLOAD DE IMAGEM — FIREBASE STORAGE
// ============================================================
async function TB_uploadImagem(file) {
  try {
    if (!file) throw new Error('Nenhum arquivo selecionado');
    
    const timestamp = Date.now();
    const nomeArquivo = `${timestamp}_${file.name}`;
    const storageRef = fbStorage.ref(`produtos/${nomeArquivo}`);
    
    // Upload do arquivo
    await storageRef.put(file);
    
    // Obter URL de download
    const downloadURL = await storageRef.getDownloadURL();
    console.log('✓ Imagem enviada:', downloadURL);
    return downloadURL;
  } catch (e) {
    console.error('❌ TB_uploadImagem erro:', e);
    throw e;
  }
}

// ============================================================
// AUTENTICAÇÃO DO ADMIN
// 🔥 FIREBASE AUTHENTICATION ATIVADO
// ============================================================
async function TB_fazerLogin(email, senha) {
  try {
    await fbAuth.signInWithEmailAndPassword(email, senha);
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    throw error; // Lança o erro para tratar a mensagem na UI
  }
}

async function TB_fazerLogout() {
  try {
    await fbAuth.signOut();
  } catch (error) {
    console.error('❌ Erro ao fazer logout:', error);
  }
}

function TB_isLogado() {
  return fbAuth.currentUser !== null;
}

// ============================================================
// CONFIGURAÇÃO DO SITE — FIRESTORE
// ============================================================
async function TB_getConfig() {
  try {
    const snap = await firestoreDB.collection(TB_COLLECTION_CONFIG).doc('site').get();
    return snap.exists ? snap.data() : { whatsapp: '5554999381351', mostrarAvaliacoes: true, valorSalada: 5.00 };
  } catch (e) {
    console.error('❌ TB_getConfig erro:', e);
    return { whatsapp: '5554999381351', mostrarAvaliacoes: true, valorSalada: 5.00 };
  }
}

function TB_listenConfig(callback) {
  return firestoreDB.collection(TB_COLLECTION_CONFIG).doc('site')
    .onSnapshot(snap => {
      const config = snap.exists ? snap.data() : { whatsapp: '5554999381351', mostrarAvaliacoes: true, valorSalada: 5.00 };
      callback(config);
    }, error => {
      console.error('❌ TB_listenConfig erro:', error);
      callback({ whatsapp: '5554999381351', mostrarAvaliacoes: true, valorSalada: 5.00 });
    });
}

async function TB_saveConfig(config) {
  try {
    await firestoreDB.collection(TB_COLLECTION_CONFIG).doc('site').set(config, { merge: true });
    console.log('✓ Configuração salva');
  } catch (e) {
    console.error('❌ TB_saveConfig erro:', e);
    throw e;
  }
}

// ============================================================
// HORÁRIO DE FUNCIONAMENTO — FIRESTORE
// ============================================================

async function TB_getHorarioStatus() {
  try {
    const snap = await firestoreDB.collection(TB_COLLECTION_CONFIG).doc('horarios').get();
    return snap.exists ? snap.data() : { aberturaManual: null };
  } catch (e) {
    console.error('❌ TB_getHorarioStatus erro:', e);
    return { aberturaManual: null };
  }
}

function TB_listenHorarioStatus(callback) {
  return firestoreDB.collection(TB_COLLECTION_CONFIG).doc('horarios')
    .onSnapshot(snap => {
      const status = snap.exists ? snap.data() : { aberturaManual: null };
      callback(status);
    }, error => {
      console.error('❌ TB_listenHorarioStatus erro:', error);
      callback({ aberturaManual: null });
    });
}

async function TB_saveHorarioStatus(status) {
  try {
    await firestoreDB.collection(TB_COLLECTION_CONFIG).doc('horarios').set(status, { merge: true });
    console.log('✓ Status de horário salvo');
  } catch (e) {
    console.error('❌ TB_saveHorarioStatus erro:', e);
    throw e;
  }
}

/**
 * Verifica se a loja está aberta (considerando horário automático e controle manual)
 * @param {Object} statusManual - Status do controle manual (se houver)
 * @returns {Object} { aberto: boolean, motivo: string }
 */
function TB_verificarSeAberto(statusManual = null) {
  // Se está fechado manualmente, retorna false
  if (statusManual && statusManual.aberturaManual === false) {
    return { aberto: false, motivo: 'Loja fechada manualmente' };
  }

  // Se está aberto manualmente, retorna true
  if (statusManual && statusManual.aberturaManual === true) {
    return { aberto: true, motivo: 'Loja aberta manualmente' };
  }

  // Caso contrário, verifica o horário automático
  return verificarSeAberto();
}

// ============================================================
// AVALIAÇÕES — FIRESTORE
// ============================================================

function TB_listenAvaliacoes(callback) {
  return firestoreDB.collection(TB_COLLECTION_AVALIACOES)
    .onSnapshot(snap => {
      let avaliacoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordenar por data (mais recentes primeiro)
      avaliacoes.sort((a, b) => {
        const ta = a.criadoEm && a.criadoEm.toMillis ? a.criadoEm.toMillis() : Date.now();
        const tb = b.criadoEm && b.criadoEm.toMillis ? b.criadoEm.toMillis() : Date.now();
        return tb - ta;
      });
      callback(avaliacoes);
    }, error => {
      console.error('❌ TB_listenAvaliacoes erro:', error);
      callback([]);
    });
}

async function TB_addAvaliacao(avaliacao) {
  try {
    const docRef = await firestoreDB.collection(TB_COLLECTION_AVALIACOES).add({
      ...avaliacao,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...avaliacao };
  } catch (e) {
    console.error('❌ TB_addAvaliacao erro:', e);
    throw e;
  }
}

async function TB_updateAvaliacao(id, dados) {
  try {
    await firestoreDB.collection(TB_COLLECTION_AVALIACOES).doc(id).update({
      ...dados,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error('❌ TB_updateAvaliacao erro:', e);
    throw e;
  }
}

async function TB_deleteAvaliacao(id) {
  try {
    await firestoreDB.collection(TB_COLLECTION_AVALIACOES).doc(id).delete();
  } catch (e) {
    console.error('❌ TB_deleteAvaliacao erro:', e);
    throw e;
  }
}

// ============================================================
// GERENCIAMENTO DE PEDIDOS — FIRESTORE
// ============================================================

async function TB_addPedido(pedido) {
  try {
    const docRef = await firestoreDB.collection(TB_COLLECTION_PEDIDOS).add({
      ...pedido,
      status: 'recebido', // recebido, preparando, entregue
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...pedido, status: 'recebido' };
  } catch (e) {
    console.error('❌ TB_addPedido erro:', e);
    throw e;
  }
}

function TB_listenPedidos(callback) {
  return firestoreDB.collection(TB_COLLECTION_PEDIDOS)
    .onSnapshot(snap => {
      let pedidos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordenar do mais recente para o mais antigo localmente
      pedidos.sort((a, b) => {
        const ta = a.criadoEm && a.criadoEm.toMillis ? a.criadoEm.toMillis() : Date.now();
        const tb = b.criadoEm && b.criadoEm.toMillis ? b.criadoEm.toMillis() : Date.now();
        return tb - ta;
      });
      callback(pedidos);
    }, error => {
      console.error('❌ TB_listenPedidos erro:', error);
      callback([]);
    });
}

async function TB_updatePedidoStatus(id, novoStatus) {
  try {
    await firestoreDB.collection(TB_COLLECTION_PEDIDOS).doc(id).update({
      status: novoStatus,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error('❌ TB_updatePedidoStatus erro:', e);
    throw e;
  }
}

async function TB_deletePedido(id) {
  try {
    await firestoreDB.collection(TB_COLLECTION_PEDIDOS).doc(id).delete();
  } catch (e) {
    console.error('❌ TB_deletePedido erro:', e);
    throw e;
  }
}
