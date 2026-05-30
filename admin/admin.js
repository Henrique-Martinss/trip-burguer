/* ============================================================
   TRIP BURGER — Admin Panel JavaScript
   ============================================================ */

let adminCatAtual = 'hamburgueres';
let deletarIdPendente = null;

let unsubscribeProdutos = null;
let unsubscribeStats   = null;
let unsubscribePedidos  = null;
let unsubscribeAvaliacoes = null;
let unsubscribeHorarios = null;
let _secaoAtual = 'produtos'; // 'produtos' | 'pedidos' | 'avaliacoes' | 'config'
let _horarioStatusAdmin = { aberturaManual: null };

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  TB_initDB();
  
  // Escutar o estado de autenticação do Firebase
  fbAuth.onAuthStateChanged(user => {
    if (user) {
      mostrarPainel();
    } else {
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('adminPanel').style.display  = 'none';
    }
  });

  // Enter para logar
  document.getElementById('loginSenha').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminFazerLogin();
  });
  document.getElementById('loginEmail').addEventListener('keydown', e => {
    if (e.key === 'Enter') adminFazerLogin();
  });
});

// ========== LOGIN ==========
async function adminFazerLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const senha = document.getElementById('loginSenha').value;
  const erro  = document.getElementById('loginErro');
  const btnLogin = document.getElementById('btnLogin');

  erro.textContent = '';

  if (!email) { erro.textContent = 'Digite o email.'; return; }
  if (!senha) { erro.textContent = 'Digite a senha.'; return; }

  btnLogin.disabled = true;
  btnLogin.textContent = 'Entrando...';

  try {
    await TB_fazerLogin(email, senha);
    // onAuthStateChanged cuidará de mostrar o painel
  } catch (e) {
    let msg = 'Erro ao entrar. Verifique suas credenciais.';
    if (e.code === 'auth/invalid-credential' || e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') {
      msg = 'Email ou senha incorretos.';
    }
    erro.textContent = msg;
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginSenha').focus();
  } finally {
    btnLogin.disabled = false;
    btnLogin.textContent = 'Entrar';
  }
}

function adminToggleSenha() {
  const input = document.getElementById('loginSenha');
  const btn = document.getElementById('btnToggleSenha');
  
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.setAttribute('aria-label', 'Esconder senha');
    btn.setAttribute('title', 'Esconder senha');
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.setAttribute('aria-label', 'Mostrar senha');
    btn.setAttribute('title', 'Mostrar senha');
  }
}
function adminLogout() {
  if (unsubscribeProdutos) unsubscribeProdutos();
  if (unsubscribeStats) unsubscribeStats();
  if (unsubscribePedidos) unsubscribePedidos();
  if (unsubscribeAvaliacoes) unsubscribeAvaliacoes();
  if (unsubscribeHorarios) unsubscribeHorarios();
  unsubscribeProdutos = null;
  unsubscribeStats    = null;
  unsubscribePedidos  = null;
  unsubscribeAvaliacoes = null;
  unsubscribeHorarios = null;
  
  TB_fazerLogout();
  document.getElementById('adminPanel').style.display  = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginSenha').value = '';
}

function mostrarPainel() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminPanel').style.display  = 'flex';
  
  const savedTab = localStorage.getItem('tb_admin_active_tab') || 'produtos';
  adminNavegar(savedTab);
  
  iniciarStatsListener();
  adminInitPedidos();
  iniciarConfigListener();
  adminInitConfig();
}

let unsubscribeConfig = null;
function iniciarConfigListener() {
  if (unsubscribeConfig) return;
  unsubscribeConfig = TB_listenConfig(config => {
    const toggle = document.getElementById('toggleMostrarAvaliacoes');
    if(toggle) toggle.checked = config.mostrarAvaliacoes !== false;
    
    const inputSalada = document.getElementById('inputValorSalada');
    if(inputSalada && config.valorSalada !== undefined) {
      inputSalada.value = config.valorSalada;
    }
  });
}

// ========== NAVEGAÇÃO SIDEBAR ==========
function adminNavegar(secao) {
  _secaoAtual = secao;
  localStorage.setItem('tb_admin_active_tab', secao);

  document.getElementById('sidebarBtnProdutos').classList.toggle('active', secao === 'produtos');
  document.getElementById('sidebarBtnPedidos').classList.toggle('active', secao === 'pedidos');
  document.getElementById('sidebarBtnAvaliacoes').classList.toggle('active', secao === 'avaliacoes');
  document.getElementById('sidebarBtnConfig').classList.toggle('active', secao === 'config');

  document.getElementById('panelProdutos').style.display = secao === 'produtos' ? '' : 'none';
  document.getElementById('panelPedidos').style.display  = secao === 'pedidos'  ? '' : 'none';
  document.getElementById('panelAvaliacoes').style.display = secao === 'avaliacoes' ? '' : 'none';
  document.getElementById('panelConfig').style.display = secao === 'config' ? '' : 'none';

  if (secao === 'produtos' && !unsubscribeProdutos) {
    carregarAba(adminCatAtual);
  }
  
  if (secao === 'avaliacoes' && !unsubscribeAvaliacoes) {
    adminInitAvaliacoes();
  }

  if (secao === 'config') {
    adminInitConfig();
  }
}

// ========== ABAS / CATEGORIAS ==========
function adminMudarAba(btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  carregarAba(btn.dataset.cat);
}

const NOMES_CAT = {
  hamburgueres: '🍔 Hambúrgueres',
  xis:          '🌮 Xis',
  combos:       '🍔🍟 Combos',
  porcoes:      '🍟 Porções',
  molhos:       '🫙 Molhos',
  bebidas:      '🥤 Bebidas',
  marmitas:     '🍱 Marmitas'
};

function carregarAba(cat) {
  adminCatAtual = cat;
  document.getElementById('adminSectionTitle').textContent = NOMES_CAT[cat] || cat;

  const grid    = document.getElementById('adminGrid');
  grid.innerHTML = '<div class="admin-empty"><span class="admin-empty-icon">⏳</span><p>Carregando…</p></div>';

  if (unsubscribeProdutos) {
    unsubscribeProdutos();
  }

  unsubscribeProdutos = TB_listenProdutos(cat, produtos => {
    if (produtos.length === 0) {
      grid.innerHTML = `
        <div class="admin-empty">
          <span class="admin-empty-icon">📭</span>
          <p>Nenhum produto nesta categoria.</p>
          <p class="admin-empty-sub">Clique em "+ Adicionar Produto" para começar.</p>
        </div>`;
      return;
    }

    // Ordenar: disponíveis por ordem, esgotados no final
    const disp = produtos.filter(p => !p.esgotado);
    const esgo = produtos.filter(p =>  p.esgotado);
    const lista = [...disp, ...esgo];

    grid.innerHTML = lista.map(p => adminCardHTML(p)).join('');
  });
}

function adminCardHTML(p) {
  const imgSrc = p.imagemUrl || 'https://placehold.co/400x300/141414/555555?text=Sem+Foto';
  const tagHtml = p.tag
    ? `<span class="admin-card-tag" style="background:${p.tagColor||'#8C2493'}">${p.tag}</span>`
    : '';
  const statusHtml = p.esgotado
    ? `<span class="admin-card-status status-esgo">⛔ Esgotado</span>`
    : `<span class="admin-card-status status-ok">✅ Disponível</span>`;
  const toggleBtn = p.esgotado
    ? `<button class="btn-admin-action btn-disponivel" onclick="adminToggleEsgotado('${p.id}', false)">✅ Disponível</button>`
    : `<button class="btn-admin-action btn-esgo"     onclick="adminToggleEsgotado('${p.id}', true)">⛔ Esgotar</button>`;

  return `
    <div class="admin-card${p.esgotado ? ' admin-card-esgotado' : ''}" id="card-${p.id}">
      <img class="admin-card-img" src="${imgSrc}" alt="${p.nome}" loading="lazy">
      <div class="admin-card-body">
        ${tagHtml}
        <div class="admin-card-nome">${p.nome}</div>
        <div class="admin-card-desc">${p.descricao}</div>
        <div class="admin-card-preco">R$ ${TB_formatBRL(p.preco)}</div>
        ${statusHtml}
        <div class="admin-card-actions">
          <button class="btn-admin-action btn-editar"  onclick='adminAbrirModal(${JSON.stringify(p)})'>✏️ Editar</button>
          ${toggleBtn}
          <button class="btn-admin-action btn-deletar" onclick="adminAbrirDelete('${p.id}','${p.nome.replace(/'/g,"\\'")}')">🗑️</button>
        </div>
      </div>
    </div>`;
}

// ========== STATS ==========
function iniciarStatsListener() {
  if (unsubscribeStats) return;
  unsubscribeStats = TB_listenAllProdutos(todos => {
    const hamb   = todos.filter(p => p.categoria === 'hamburgueres').length;
    const xis    = todos.filter(p => p.categoria === 'xis').length;
    const beb    = todos.filter(p => p.categoria === 'bebidas').length;
    const marm   = todos.filter(p => p.categoria === 'marmitas').length;
    const comb   = todos.filter(p => p.categoria === 'combos').length;
    const porc   = todos.filter(p => p.categoria === 'porcoes').length;
    const molhos = todos.filter(p => p.categoria === 'molhos').length;
    const esgo   = todos.filter(p => p.esgotado).length;

    document.getElementById('statTotal').textContent  = todos.length;
    document.getElementById('statHamb').textContent   = hamb;
    document.getElementById('statXis').textContent    = xis;
    document.getElementById('statBeb').textContent    = beb;
    document.getElementById('statMarm').textContent   = marm;
    if (document.getElementById('statComb'))   document.getElementById('statComb').textContent   = comb;
    if (document.getElementById('statPorc'))   document.getElementById('statPorc').textContent   = porc;
    if (document.getElementById('statMolhos')) document.getElementById('statMolhos').textContent = molhos;
    document.getElementById('statEsgo').textContent   = esgo;
  });
}

// ========== PEDIDOS ==========
function adminInitPedidos() {
  if (unsubscribePedidos) return;
  unsubscribePedidos = TB_listenPedidos(pedidos => {
    renderPedidosKanban(pedidos);

    // Badge na sidebar
    const naoEntregues = pedidos.filter(p => p.status !== 'entregue').length;
    const badge = document.getElementById('pedidosBadge');
    badge.style.display = naoEntregues > 0 ? 'inline' : 'none';
    badge.textContent = naoEntregues;
  });
}

function renderPedidosKanban(pedidos) {
  const recebidos   = pedidos.filter(p => p.status === 'recebido');
  const preparando  = pedidos.filter(p => p.status === 'preparando');
  const prontos     = pedidos.filter(p => p.status === 'pronto');
  const entregues   = pedidos.filter(p => p.status === 'entregue');

  document.getElementById('countRecebido').textContent  = recebidos.length;
  document.getElementById('countPreparando').textContent = preparando.length;
  if(document.getElementById('countPronto')) document.getElementById('countPronto').textContent = prontos.length;
  document.getElementById('countEntregue').textContent  = entregues.length;

  document.getElementById('listaRecebido').innerHTML  = recebidos.length  ? recebidos.map(p  => pedidoCardHTML(p)).join('') : '<p class="pedido-vazio">Nenhum pedido.</p>';
  document.getElementById('listaPreparando').innerHTML = preparando.length ? preparando.map(p => pedidoCardHTML(p)).join('') : '<p class="pedido-vazio">Nenhum pedido.</p>';
  if(document.getElementById('listaPronto')) document.getElementById('listaPronto').innerHTML = prontos.length ? prontos.map(p => pedidoCardHTML(p)).join('') : '<p class="pedido-vazio">Nenhum pedido.</p>';
  document.getElementById('listaEntregue').innerHTML  = entregues.length  ? entregues.map(p  => pedidoCardHTML(p)).join('') : '<p class="pedido-vazio">Nenhum pedido.</p>';
}

function pedidoCardHTML(p) {
  const hora = p.criadoEm && p.criadoEm.toDate
    ? p.criadoEm.toDate().toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
    : 'Agora';

  const end = p.endereco
    ? `${p.endereco.rua}, ${p.endereco.numero} — ${p.endereco.bairro}${p.endereco.referencia ? ' (' + p.endereco.referencia + ')' : ''}`
    : 'Endereço não informado';

  const itensHtml = (p.itens || []).map(i =>
    `<li><span>${i.qty}x ${i.nome}</span><span>R$ ${TB_formatBRL(i.preco * i.qty)}</span></li>`
  ).join('');

  const actionsHtml = p.status === 'recebido'
    ? `<button class="btn-status btn-status-preparar" onclick="adminMudarStatusPedido('${p.id}','preparando')">👨‍🍳 Iniciar Preparo</button>
       <button class="btn-status btn-status-entregar" style="background:#5c5c5c;color:#fff;" onclick="adminMudarStatusPedido('${p.id}','pronto')">🛎️ Marcar Pronto</button>`
    : p.status === 'preparando'
    ? `<button class="btn-status btn-status-entregar" style="background:#d97706;color:#fff;" onclick="adminMudarStatusPedido('${p.id}','pronto')">🛎️ Marcar Pronto</button>
       <button class="btn-status btn-status-recebido" onclick="adminMudarStatusPedido('${p.id}','recebido')">↩ Voltar a Recebido</button>`
    : p.status === 'pronto'
    ? `<button class="btn-status btn-status-entregar" onclick="adminMudarStatusPedido('${p.id}','entregue')">✅ Marcar Entregue</button>
       <button class="btn-status btn-status-recebido" onclick="adminMudarStatusPedido('${p.id}','preparando')">↩ Voltar a Preparando</button>`
    : `<button class="btn-status btn-status-recebido" onclick="adminMudarStatusPedido('${p.id}','recebido')">↩ Reabrir Pedido</button>
       <button class="btn-status" style="background:#b91c1c;color:#fff;margin-top:0.5rem;" onclick="adminDeletarPedido('${p.id}')">🗑️ Arquivar/Excluir</button>`;

  return `
    <div class="pedido-card">
      <div class="pedido-card-id">#${p.id.substring(0,8).toUpperCase()}</div>
      <div class="pedido-card-hora">${hora}</div>
      <div class="pedido-card-endereco">📍 ${end}</div>
      <ul class="pedido-card-itens">${itensHtml}</ul>
      <div class="pedido-card-total">Total: R$ ${TB_formatBRL(p.total || 0)}</div>
      <div class="pedido-card-actions">${actionsHtml}</div>
    </div>`;
}

async function adminMudarStatusPedido(id, novoStatus) {
  try {
    await TB_updatePedidoStatus(id, novoStatus);
    const labels = { recebido: '📬 Voltou para Recebido', preparando: '👨‍🍳 Em preparo!', entregue: '✅ Pedido entregue!' };
    adminToast(labels[novoStatus] || 'Status atualizado');
  } catch (e) {
    adminToast('❌ Erro ao atualizar status: ' + e.message);
  }
}

async function adminDeletarPedido(id) {
  if (!confirm('Deseja realmente arquivar/excluir este pedido da lista?')) return;
  try {
    await TB_deletePedido(id);
    adminToast('🗑️ Pedido arquivado/excluído com sucesso.');
  } catch (e) {
    adminToast('❌ Erro ao arquivar pedido: ' + e.message);
  }
}

// ========== MODAL ADD/EDIT ==========
let fotoUrl = null;

function adminAbrirModal(produto) {
  fotoUrl = null;
  const isEdit = !!produto;

  document.getElementById('adminModalTitulo').textContent = isEdit ? 'Editar Produto' : 'Adicionar Produto';
  document.getElementById('editId').value         = isEdit ? produto.id : '';
  document.getElementById('inputNome').value      = isEdit ? produto.nome : '';
  document.getElementById('inputPreco').value     = isEdit ? produto.preco : '';
  document.getElementById('inputDesc').value      = isEdit ? produto.descricao : '';
  document.getElementById('inputCategoria').value = isEdit ? produto.categoria : adminCatAtual;
  document.getElementById('inputTag').value       = isEdit ? (produto.tag || '') : '';
  document.getElementById('inputTagColor').value  = isEdit ? (produto.tagColor || '#8C2493') : '#8C2493';
  document.getElementById('inputEsgotado').checked = isEdit ? !!produto.esgotado : false;

  // Preview da foto
  const preview  = document.getElementById('fotoPreview');
  const holder   = document.getElementById('fotoPlaceholder');
  if (isEdit && produto.imagemUrl) {
    preview.src           = produto.imagemUrl;
    preview.style.display = 'block';
    holder.style.display  = 'none';
    fotoUrl = produto.imagemUrl; // manter existente se não trocar
  } else {
    preview.src           = '';
    preview.style.display = 'none';
    holder.style.display  = 'flex';
  }

  document.getElementById('adminModalOverlay').classList.add('active');
}

function adminFecharModal() {
  document.getElementById('adminModalOverlay').classList.remove('active');
  document.getElementById('inputFoto').value = '';
  fotoUrl = null;
}

function adminPreviewFoto(input) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    adminToast('⚠️ Imagem muito grande! Use arquivos menores que 2MB.');
    input.value = '';
    return;
  }

  const preview = document.getElementById('fotoPreview');
  const holder  = document.getElementById('fotoPlaceholder');

  TB_uploadImagem(file).then(url => {
    fotoUrl               = url;
    preview.src           = url;
    preview.style.display = 'block';
    holder.style.display  = 'none';
  }).catch(() => adminToast('❌ Erro ao carregar imagem.'));
}

async function adminSalvarProduto() {
  const id        = document.getElementById('editId').value;
  const nome      = document.getElementById('inputNome').value.trim();
  const precoRaw  = document.getElementById('inputPreco').value;
  const descricao = document.getElementById('inputDesc').value.trim();
  const categoria = document.getElementById('inputCategoria').value;
  const tag       = document.getElementById('inputTag').value.trim().toUpperCase();
  const tagColor  = document.getElementById('inputTagColor').value;
  const esgotado  = document.getElementById('inputEsgotado').checked;

  // Validação
  if (!nome)     { adminToast('⚠️ Digite o nome do produto.'); return; }
  if (!precoRaw) { adminToast('⚠️ Digite o preço.'); return; }
  if (!descricao){ adminToast('⚠️ Digite a descrição.'); return; }

  const preco = parseFloat(precoRaw);
  if (isNaN(preco) || preco < 0) { adminToast('⚠️ Preço inválido.'); return; }

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    const dados = { nome, preco, descricao, categoria, tag, tagColor, esgotado, imagemUrl: fotoUrl || '' };

    if (id) {
      await TB_updateProduto(id, dados);
      adminToast('✅ Produto atualizado!');
    } else {
      const todos = await TB_getProdutos(categoria);
      dados.ordem = todos.length;
      await TB_addProduto(dados);
      adminToast('✅ Produto adicionado!');
    }

    adminFecharModal();
    // Atualização da UI é automática pelo onSnapshot
  } catch (e) {
    adminToast('❌ Erro ao salvar: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Produto';
  }
}

// ========== TOGGLE ESGOTADO ==========
async function adminToggleEsgotado(id, esgotado) {
  try {
    await TB_updateProduto(id, { esgotado });
    adminToast(esgotado ? '⛔ Produto marcado como esgotado!' : '✅ Produto disponível novamente!');
    // Atualização automática pelo onSnapshot
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

// ========== DELETE ==========
function adminAbrirDelete(id, nome) {
  deletarIdPendente = id;
  document.getElementById('deleteNome').textContent = `"${nome}"`;
  document.getElementById('deleteOverlay').classList.add('active');
}

function adminFecharDelete() {
  deletarIdPendente = null;
  document.getElementById('deleteOverlay').classList.remove('active');
}

async function adminConfirmarDelete() {
  if (!deletarIdPendente) return;
  try {
    await TB_deleteProduto(deletarIdPendente);
    adminToast('🗑️ Produto excluído.');
    adminFecharDelete();
    // Atualização automática pelo onSnapshot
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

// Fechar modais ao clicar no overlay
document.addEventListener('click', e => {
  if (e.target.id === 'adminModalOverlay') adminFecharModal();
  if (e.target.id === 'deleteOverlay')     adminFecharDelete();
  if (e.target.id === 'modalAvaliacaoOverlay') adminFecharModalAvaliacao();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { 
    adminFecharModal(); 
    adminFecharDelete(); 
    adminFecharModalAvaliacao();
  }
});

// ========== TOAST ==========
let toastTimer;
function adminToast(msg) {
  const t = document.getElementById('adminToast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ========== AVALIAÇÕES E CONFIG ==========
function adminInitAvaliacoes() {

  if (unsubscribeAvaliacoes) return;
  unsubscribeAvaliacoes = TB_listenAvaliacoes(avaliacoes => {
    renderAvaliacoesGrid(avaliacoes);
  });
}

async function adminToggleMostrarAvaliacoes(checkbox) {
  try {
    await TB_saveConfig({ mostrarAvaliacoes: checkbox.checked });
    adminToast(checkbox.checked ? '✅ Avaliações visíveis no site!' : '⛔ Avaliações ocultas no site!');
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

async function adminSalvarValorSalada() {
  const input = document.getElementById('inputValorSalada');
  const valor = parseFloat(input.value);
  if (isNaN(valor) || valor < 0) {
    adminToast('⚠️ Digite um valor válido para a salada.');
    return;
  }
  
  try {
    await TB_saveConfig({ valorSalada: valor });
    adminToast('✅ Valor da salada atualizado com sucesso!');
  } catch (e) {
    adminToast('❌ Erro ao salvar: ' + e.message);
  }
}

function renderAvaliacoesGrid(avaliacoes) {
  const grid = document.getElementById('avaliacoesGrid');
  if (avaliacoes.length === 0) {
    grid.innerHTML = '<div class="admin-empty"><span class="admin-empty-icon">⭐</span><p>Nenhuma avaliação cadastrada.</p></div>';
    return;
  }

  grid.innerHTML = avaliacoes.map(av => {
    const estrelas = '★'.repeat(av.estrelas) + '☆'.repeat(5 - av.estrelas);
    return `
      <div class="admin-card">
        <div class="admin-card-body">
          <div style="color:var(--purple);font-size:1.2rem;margin-bottom:0.5rem;">${estrelas}</div>
          <div class="admin-card-nome">${av.autor}</div>
          <div class="admin-card-desc" style="-webkit-line-clamp: 4; line-clamp: 4;">"${av.texto}"</div>
          <div class="admin-card-actions" style="margin-top:1rem;">
            <button class="btn-admin-action btn-editar" onclick='adminAbrirModalAvaliacao(${JSON.stringify(av)})'>✏️ Editar</button>
            <button class="btn-admin-action btn-deletar" onclick="adminDeletarAvaliacao('${av.id}')">🗑️ Excluir</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function adminAbrirModalAvaliacao(av) {
  const isEdit = !!av;
  document.getElementById('modalAvaliacaoTitulo').textContent = isEdit ? 'Editar Avaliação' : 'Adicionar Avaliação';
  document.getElementById('editAvaliacaoId').value = isEdit ? av.id : '';
  document.getElementById('inputAvaliacaoAutor').value = isEdit ? av.autor : '';
  document.getElementById('inputAvaliacaoTexto').value = isEdit ? av.texto : '';
  document.getElementById('inputAvaliacaoEstrelas').value = isEdit ? av.estrelas : '5';
  
  document.getElementById('modalAvaliacaoOverlay').classList.add('active');
}

function adminFecharModalAvaliacao() {
  document.getElementById('modalAvaliacaoOverlay').classList.remove('active');
}

async function adminSalvarAvaliacao() {
  const id = document.getElementById('editAvaliacaoId').value;
  const autor = document.getElementById('inputAvaliacaoAutor').value.trim();
  const texto = document.getElementById('inputAvaliacaoTexto').value.trim();
  const estrelas = parseInt(document.getElementById('inputAvaliacaoEstrelas').value, 10);

  if (!autor) { adminToast('⚠️ Digite o nome do cliente.'); return; }
  if (!texto) { adminToast('⚠️ Digite o depoimento.'); return; }

  const btn = document.getElementById('btnSalvarAvaliacao');
  btn.disabled = true;
  btn.textContent = 'Salvando…';

  try {
    if (id) {
      await TB_updateAvaliacao(id, { autor, texto, estrelas });
      adminToast('✅ Avaliação atualizada!');
    } else {
      await TB_addAvaliacao({ autor, texto, estrelas });
      adminToast('✅ Avaliação adicionada!');
    }
    adminFecharModalAvaliacao();
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Avaliação';
  }
}

async function adminDeletarAvaliacao(id) {
  if (!confirm('Deseja realmente excluir esta avaliação?')) return;
  try {
    await TB_deleteAvaliacao(id);
    adminToast('🗑️ Avaliação excluída.');
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

// ============================================================
// CONFIGURAÇÕES — HORÁRIOS
// ============================================================

function adminInitConfig() {
  if (unsubscribeHorarios) return;
  unsubscribeHorarios = TB_listenHorarioStatus(status => {
    _horarioStatusAdmin = status;
    atualizarStatusHorarioUI();
  });
  atualizarStatusHorarioUI();
}

function atualizarStatusHorarioUI() {
  const statusDiv = document.getElementById('statusHorarioDiv');
  if (!statusDiv) return;

  const statusAberto = TB_verificarSeAberto(_horarioStatusAdmin);
  
  if (_horarioStatusAdmin.aberturaManual === true) {
    statusDiv.innerHTML = '🟢 <strong>ABERTO MANUALMENTE</strong>';
    statusDiv.style.color = '#4caf50';
  } else if (_horarioStatusAdmin.aberturaManual === false) {
    statusDiv.innerHTML = '🔴 <strong>FECHADO MANUALMENTE</strong>';
    statusDiv.style.color = '#CC2200';
  } else {
    // Modo automático
    if (statusAberto.aberto) {
      statusDiv.innerHTML = `🟢 <strong>ABERTO</strong> (${statusAberto.periodo})`;
      statusDiv.style.color = '#4caf50';
    } else {
      const proximoHorario = obterProximoHorarioAbertura();
      statusDiv.innerHTML = `🔴 <strong>FECHADO</strong> — ${proximoHorario}`;
      statusDiv.style.color = '#CC2200';
    }
  }
}

async function adminAbrirManualmente() {
  try {
    await TB_saveHorarioStatus({ aberturaManual: true });
    adminToast('🟢 Loja ABERTA manualmente!');
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

async function adminFecharManualmente() {
  try {
    await TB_saveHorarioStatus({ aberturaManual: false });
    adminToast('🔴 Loja FECHADA manualmente!');
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}

async function adminRestaurarAuto() {
  try {
    await TB_saveHorarioStatus({ aberturaManual: null });
    adminToast('⚙️ Voltado ao modo AUTOMÁTICO!');
  } catch (e) {
    adminToast('❌ Erro: ' + e.message);
  }
}
