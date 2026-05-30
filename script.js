/* ============================================================
   TRIP BURGER — JavaScript
   Design: Dark Forge Premium — Industrial Dark Gourmet
   Funcionalidades: Navbar, animações, Carrinho, Modal, WhatsApp
                    + Renderização dinâmica de produtos (db.js/render.js)
   ============================================================ */

// ========== NAVBAR SCROLL EFFECT ==========
const firebaseConfig = {
  apiKey: "AIzaSyAtD50vwrWbb1z0k239KkC3VcTELm2SGRc",
  authDomain: "trip-burguer.firebaseapp.com",
  databaseURL: "https://trip-burguer-default-rtdb.firebaseio.com",
  projectId: "trip-burguer",
  storageBucket: "trip-burguer.firebasestorage.app",
  messagingSenderId: "750797200394",
  appId: "1:750797200394:web:07ae813155f5e97388d3f3"
};

// ========== INICIALIZAR FIREBASE ==========
firebase.initializeApp(firebaseConfig);
const firestoreDB = firebase.firestore();
const fbAuth = firebase.auth();
const fbStorage = firebase.storage();

const navbar = document.querySelector('.navbar');
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ========== MOBILE MENU TOGGLE ==========
menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
});

// ========== FADE UP ANIMATION ON SCROLL ==========
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.animate-fade-up').forEach(el => observer.observe(el));

// ========== SMOOTH SCROLL ==========
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            const target = document.querySelector(href);
            window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
        }
    });
});

// (parallax removido — tratado via CSS background-attachment: fixed)

// ========== HOVER EFFECTS ==========
document.querySelectorAll('.diferencial-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.borderColor = '#8C2493');
    card.addEventListener('mouseleave', () => card.style.borderColor = 'rgba(151, 99, 172, 0.12)');
});

document.querySelectorAll('.depoimento-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.borderColor = '#8C2493');
    card.addEventListener('mouseleave', () => card.style.borderColor = 'rgba(201, 168, 76, 0.1)');
});

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', () => link.style.color = '#8C2493');
    link.addEventListener('mouseleave', () => link.style.color = '#ffffff');
});

document.querySelectorAll('.footer-links a').forEach(link => {
    link.addEventListener('mouseenter', () => link.style.color = '#8C2493');
    link.addEventListener('mouseleave', () => link.style.color = '#888');
});

const whatsappFloat = document.querySelector('.whatsapp-float');
if (whatsappFloat) {
    whatsappFloat.addEventListener('mouseenter', () => {
        whatsappFloat.style.transform = 'scale(1.12)';
        whatsappFloat.style.boxShadow = '0 6px 28px rgba(37, 211, 102, 0.6)';
    });
    whatsappFloat.addEventListener('mouseleave', () => {
        whatsappFloat.style.transform = 'scale(1)';
        whatsappFloat.style.boxShadow = '0 4px 20px rgba(37, 211, 102, 0.4)';
    });
}

// ========== CARRINHO DE COMPRAS ==========
let carrinho = [];
let _adicionaisBebidas = [];   // cache dos produtos de bebidas
let _adicionaisMolhos  = [];   // cache dos produtos de molhos
let _pendingItem       = null; // item aguardando confirmação de adicionais
let _adicionaisSelecionados = []; // [ {nome, preco, qty} ]
let _valorSaladaGlobal = 0;

// ========== HORÁRIO DE FUNCIONAMENTO ==========
let _horarioStatus = { aberturaManual: null };
let _unsubscribeHorario = null;

const carrinhoDrawer  = document.getElementById('carrinhoDrawer');
const carrinhoOverlay = document.getElementById('carrinhoOverlay');
const carrinhoVazio   = document.getElementById('carrinhoVazio');
const carrinhoLista   = document.getElementById('carrinhoLista');
const carrinhoFooter  = document.getElementById('carrinhoFooter');
const carrinhoTotal   = document.getElementById('carrinhoTotal');
const carrinhoBadge   = document.getElementById('carrinhoBadge');
const modalOverlay    = document.getElementById('modalOverlay');
const resumoLista     = document.getElementById('resumoLista');
const resumoTotal     = document.getElementById('resumoTotal');
const enderecoFields  = document.getElementById('enderecoFields');
const inputRua        = document.getElementById('inputRua');
const inputNumero     = document.getElementById('inputNumero');
const inputBairro     = document.getElementById('inputBairro');
const inputReferencia = document.getElementById('inputReferencia');
const toast           = document.getElementById('toast');

function abrirCarrinho() {
    carrinhoDrawer.classList.add('open');
    carrinhoOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    navMenu.classList.remove('active');
}

function fecharCarrinho() {
    carrinhoDrawer.classList.remove('open');
    carrinhoOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('btnCarrinhoNav').addEventListener('click', abrirCarrinho);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { fecharCarrinho(); fecharModalDireto(); }
});

function adicionarAoCarrinho(btn) {
    const nome  = btn.dataset.nome;
    const preco = parseFloat(btn.dataset.preco);
    const cat = btn.dataset.cat;

    // Feedback visual no botão
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '✓ Adicionando...';
    btn.classList.add('added');
    setTimeout(() => {
        btn.innerHTML = textoOriginal;
        btn.classList.remove('added');
    }, 1500);

    abrirModalAdicionais(nome, preco, cat);
}

function alterarQty(nome, delta) {
    const item = carrinho.find(i => i.nome === nome);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) carrinho = carrinho.filter(i => i.nome !== nome);
    atualizarCarrinhoUI();
}

function removerItem(nome) {
    carrinho = carrinho.filter(i => i.nome !== nome);
    atualizarCarrinhoUI();
}

function calcularTotal() {
    return carrinho.reduce((acc, item) => acc + item.preco * item.qty, 0);
}

function formatBRL(valor) {
    return 'R$ ' + Number(valor).toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function atualizarCarrinhoUI() {
    const totalQty = carrinho.reduce((acc, i) => acc + i.qty, 0);
    const totalVal = calcularTotal();

    if (totalQty > 0) {
        carrinhoBadge.style.display = 'inline-flex';
        carrinhoBadge.textContent = totalQty;
        carrinhoBadge.style.animation = 'none';
        void carrinhoBadge.offsetWidth;
        carrinhoBadge.style.animation = '';
    } else {
        carrinhoBadge.style.display = 'none';
    }

    if (carrinho.length === 0) {
        carrinhoVazio.style.display = 'flex';
        carrinhoLista.style.display = 'none';
        carrinhoFooter.style.display = 'none';
    } else {
        carrinhoVazio.style.display = 'none';
        carrinhoLista.style.display = 'flex';
        carrinhoFooter.style.display = 'flex';

        carrinhoLista.innerHTML = '';
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.className = 'carrinho-item';
            li.innerHTML = `
                <div class="item-info">
                    <span class="item-nome">${item.nome}</span>
                    <span class="item-preco-unit">${formatBRL(item.preco)} cada</span>
                </div>
                <div class="item-controles">
                    <button class="item-qty-btn" onclick="alterarQty('${item.nome}', -1)" aria-label="Diminuir">−</button>
                    <span class="item-qty">${item.qty}</span>
                    <button class="item-qty-btn" onclick="alterarQty('${item.nome}', 1)" aria-label="Aumentar">+</button>
                </div>
                <span class="item-subtotal">${formatBRL(item.preco * item.qty)}</span>
                <button class="item-remover" onclick="removerItem('${item.nome}')" aria-label="Remover item">🗑</button>
            `;
            carrinhoLista.appendChild(li);
        });

        carrinhoTotal.textContent = formatBRL(totalVal);
    }
}

// ========== TOAST ==========
let toastTimer;
function mostrarToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ========== MODAL DE ADICIONAIS ==========
function abrirModalAdicionais(nome, preco, cat) {
    _pendingItem = { nome, preco, cat };
    _adicionaisSelecionados = [];

    // Gerenciamento da seção de salada (só para marmitas)
    const secaoSalada = document.getElementById('secaoSaladaMarmita');
    const radioSaladaNao = document.getElementById('radioSaladaNao');
    const precoSaladaEl = document.getElementById('precoSaladaMarmita');
    
    if (secaoSalada) {
        if (cat === 'marmitas') {
            secaoSalada.style.display = 'block';
            if (radioSaladaNao) radioSaladaNao.checked = true;
            if (precoSaladaEl) {
                precoSaladaEl.style.display = 'none';
                precoSaladaEl.textContent = `+ R$ ${TB_formatBRL(_valorSaladaGlobal)}`;
            }
        } else {
            secaoSalada.style.display = 'none';
            if (radioSaladaNao) radioSaladaNao.checked = true;
        }
    }

    // Popula bebidas
    const listaBeb = document.getElementById('listaAdicionaisBebidas');
    listaBeb.innerHTML = _adicionaisBebidas.length
        ? _adicionaisBebidas.filter(b => !b.esgotado).map(b => `
            <div class="adicional-item">
                <div class="adicional-info">
                    <span class="adicional-nome">${b.nome}</span>
                    <span class="adicional-preco">+ R$ ${TB_formatBRL(b.preco)}</span>
                </div>
                <div class="adicional-controles">
                    <button class="adicional-btn" onclick="alterarAdicional('beb','${b.nome}',${b.preco},-1)">−</button>
                    <span class="adicional-qty" id="adqty_beb_${b.nome.replace(/\s/g,'_')}">0</span>
                    <button class="adicional-btn" onclick="alterarAdicional('beb','${b.nome}',${b.preco},1)">+</button>
                </div>
            </div>`).join('')
        : '<p style="color:#555;font-family:Inter,sans-serif;font-size:.9rem;">Nenhuma bebida disponível.</p>';

    // Popula molhos
    const listaMol = document.getElementById('listaAdicionaisMolhos');
    listaMol.innerHTML = _adicionaisMolhos.length
        ? _adicionaisMolhos.filter(m => !m.esgotado).map(m => `
            <div class="adicional-item">
                <div class="adicional-info">
                    <span class="adicional-nome">${m.nome}</span>
                    <span class="adicional-preco">+ R$ ${TB_formatBRL(m.preco)}</span>
                </div>
                <div class="adicional-controles">
                    <button class="adicional-btn" onclick="alterarAdicional('mol','${m.nome}',${m.preco},-1)">−</button>
                    <span class="adicional-qty" id="adqty_mol_${m.nome.replace(/\s/g,'_')}">0</span>
                    <button class="adicional-btn" onclick="alterarAdicional('mol','${m.nome}',${m.preco},1)">+</button>
                </div>
            </div>`).join('')
        : '<p style="color:#555;font-family:Inter,sans-serif;font-size:.9rem;">Nenhum molho disponível.</p>';

    document.getElementById('adicionalSubtitulo').textContent =
        cat === 'marmitas' ? `Escolha bebidas, molhos ou salada para acompanhar a sua ${nome}` : `Escolha bebidas ou molhos para acompanhar o ${nome}`;
    document.getElementById('modalAdicionais').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function TB_onChangeSaladaMarmita() {
    const radioSim = document.getElementById('radioSaladaSim');
    const precoEl = document.getElementById('precoSaladaMarmita');
    
    if (radioSim && radioSim.checked) {
        if (precoEl) precoEl.style.display = 'inline';
    } else {
        if (precoEl) precoEl.style.display = 'none';
    }
}

function alterarAdicional(tipo, nome, preco, delta) {
    const key = `${tipo}_${nome}`;
    let ex = _adicionaisSelecionados.find(a => a.key === key);
    if (!ex) {
        ex = { key, nome, preco, qty: 0 };
        _adicionaisSelecionados.push(ex);
    }
    ex.qty = Math.max(0, ex.qty + delta);
    const prefix = tipo === 'beb' ? 'adqty_beb_' : 'adqty_mol_';
    const el = document.getElementById(prefix + nome.replace(/\s/g, '_'));
    if (el) el.textContent = ex.qty;
}

function fecharModalAdicionais(event) {
    if (event.target === document.getElementById('modalAdicionais')) fecharModalAdicionaisDireto();
}

function fecharModalAdicionaisDireto() {
    document.getElementById('modalAdicionais').classList.remove('active');
    document.body.style.overflow = '';
    // Limpar campo de observação
    const obsEl = document.getElementById('inputObservacao');
    if (obsEl) obsEl.value = '';
    _pendingItem = null;
    _adicionaisSelecionados = [];
}

function confirmarAdicionaisEIrParaCarrinho() {
    if (!_pendingItem) return;

    const { nome, preco, cat } = _pendingItem;
    const observacao = (document.getElementById('inputObservacao')?.value || '').trim();
    const radioSim = document.getElementById('radioSaladaSim');
    
    // Se for marmita e tiver salada marcada
    const comSalada = (cat === 'marmitas' && radioSim && radioSim.checked);
    const obsSalada = comSalada ? 'Com Salada Mista' : '';
    
    let obsFinal = [obsSalada, observacao].filter(Boolean).join(' | ');

    // Adiciona o item principal (com observação se existir)
    const itemNomeCompleto = obsFinal ? `${nome} (obs: ${obsFinal})` : nome;
    const precoFinalItem = comSalada ? (preco + _valorSaladaGlobal) : preco;
    
    const ex = carrinho.find(i => i.nome === itemNomeCompleto);
    if (ex) ex.qty++;
    else carrinho.push({ nome: itemNomeCompleto, preco: precoFinalItem, qty: 1 });

    // Adiciona adicionais selecionados
    _adicionaisSelecionados.forEach(ad => {
        if (ad.qty <= 0) return;
        const exAd = carrinho.find(i => i.nome === ad.nome);
        if (exAd) exAd.qty += ad.qty;
        else carrinho.push({ nome: ad.nome, preco: ad.preco, qty: ad.qty });
    });

    fecharModalAdicionaisDireto();
    atualizarCarrinhoUI();
    mostrarToast(`🛒 ${nome} adicionado ao carrinho!`);
    abrirCarrinho();
}

// ========== MODAL DE FINALIZAÇÃO ==========
function abrirModalPedido() {
    if (carrinho.length === 0) {
        mostrarToast('⚠️ Adicione itens ao carrinho primeiro!');
        return;
    }

    resumoLista.innerHTML = '';
    carrinho.forEach(item => {
        const li = document.createElement('li');
        li.className = 'resumo-item';
        li.innerHTML = `
            <span class="resumo-item-nome">
                <span class="resumo-item-qty">${item.qty}×</span>
                ${item.nome}
            </span>
            <span class="resumo-item-preco">${formatBRL(item.preco * item.qty)}</span>
        `;
        resumoLista.appendChild(li);
    });
    resumoTotal.textContent = formatBRL(calcularTotal());

    fecharCarrinho();
    setTimeout(() => {
        modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 200);
}

function fecharModal(event) {
    if (event.target === modalOverlay) fecharModalDireto();
}

function fecharModalDireto() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

function TB_onChangePagamento() {
    const select = document.getElementById('selectPagamento');
    const trocoContainer = document.getElementById('trocoContainer');
    if (select.value === 'dinheiro') {
        trocoContainer.style.display = 'block';
    } else {
        trocoContainer.style.display = 'none';
        document.getElementById('inputTroco').value = '';
    }
}

async function enviarParaWhatsApp() {
    // ========== VERIFICAR HORÁRIO ==========
    const statusAberto = TB_verificarSeAberto(_horarioStatus);
    if (!statusAberto.aberto) {
        fecharModalDireto();
        mostrarToast(`❌ ${statusAberto.motivo}\n⏰ Próximo horário: ${obterProximoHorarioAbertura()}`);
        return;
    }

    const camposObrig = [
        { el: inputRua,    nome: 'rua / avenida' },
        { el: inputNumero, nome: 'número' },
        { el: inputBairro, nome: 'bairro' },
    ];
    for (const campo of camposObrig) {
        if (!campo.el.value.trim()) {
            campo.el.focus();
            campo.el.style.borderColor = '#CC2200';
            campo.el.style.boxShadow   = '0 0 0 3px rgba(204,34,0,0.2)';
            mostrarToast('Preencha o campo: ' + campo.nome);
            setTimeout(() => {
                campo.el.style.borderColor = '';
                campo.el.style.boxShadow   = '';
            }, 2200);
            return;
        }
    }

    const endereco = {
        rua: inputRua.value.trim(),
        numero: inputNumero.value.trim(),
        bairro: inputBairro.value.trim(),
        referencia: inputReferencia.value.trim()
    };

    const linhas = [];
    linhas.push('*NOVO PEDIDO - TRIP BURGER*');
    linhas.push('----------------------------');
    linhas.push('');
    linhas.push('*Itens do pedido:*');

    carrinho.forEach(item => {
        linhas.push(`  ${item.qty}x ${item.nome}  ->  ${formatBRL(item.preco * item.qty)}`);
    });

    linhas.push('');
    linhas.push(`*Total: ${formatBRL(calcularTotal())}*`);
    linhas.push('');
    linhas.push('----------------------------');
    linhas.push('*Tipo:* Delivery');
    linhas.push(`*Rua/Av.:* ${endereco.rua}`);
    linhas.push(`*Numero:* ${endereco.numero}`);
    linhas.push(`*Bairro:* ${endereco.bairro}`);
    if (endereco.referencia) linhas.push(`*Ref.:* ${endereco.referencia}`);

    // Verificar e incluir observações dos itens
    const itensComObs = carrinho.filter(i => i.nome.includes('(obs:'));
    if (itensComObs.length > 0) {
        linhas.push('');
        linhas.push('*Observações:*');
        itensComObs.forEach(i => {
            const obs = i.nome.match(/\(obs: (.+)\)/);
            if (obs) linhas.push(`  - ${obs[1]}`);
        });
    }

    const selectPagamento = document.getElementById('selectPagamento');
    if (!selectPagamento.value) {
        selectPagamento.focus();
        selectPagamento.style.borderColor = '#CC2200';
        mostrarToast('Selecione uma forma de pagamento!');
        setTimeout(() => selectPagamento.style.borderColor = '', 2200);
        return;
    }

    const formaPagamento = selectPagamento.options[selectPagamento.selectedIndex].text;
    linhas.push('');
    linhas.push(`*Pagamento:* ${formaPagamento}`);
    
    let trocoPara = '';
    if (selectPagamento.value === 'dinheiro') {
        const inputTroco = document.getElementById('inputTroco').value.trim();
        if (inputTroco) {
            trocoPara = inputTroco;
            linhas.push(`*Troco para:* ${trocoPara}`);
        } else {
            linhas.push('*Troco:* Não precisa');
        }
    }

    linhas.push('');
    linhas.push('');
    linhas.push('Aguardo confirmacao!');

    const pedidoObj = {
        itens: carrinho.map(i => ({ nome: i.nome, preco: i.preco, qty: i.qty })),
        total: calcularTotal(),
        tipo: 'delivery',
        endereco,
        pagamento: {
            metodo: selectPagamento.value,
            troco: trocoPara || null
        }
    };

    if (selectPagamento.value === 'pix') {
        abrirModalPix(pedidoObj, linhas.join('\n'));
        return;
    }

    finalizarPedidoLocal(pedidoObj, linhas.join('\n'));
}

// ========== LÓGICA DO PIX ==========
let _pedidoAtual = null;
let _mensagemAtual = '';

function finalizarPedidoLocal(pedidoObj, mensagem) {
    const numero   = '5554981507387';
    const url      = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensagem);

    TB_addPedido(pedidoObj).catch(e => console.warn('Pedido não salvo no Firestore:', e));
    window.open(url, '_blank');

    fecharModalDireto();
    carrinho = [];
    atualizarCarrinhoUI();
    mostrarToast('Pedido enviado pelo WhatsApp!');
}

function abrirModalPix(pedidoObj, mensagemBase) {
    _pedidoAtual = pedidoObj;
    _mensagemAtual = mensagemBase;

    fecharModalDireto();
    const modalPix = document.getElementById('modalPix');
    modalPix.classList.add('active');
    document.body.style.overflow = 'hidden';

    document.getElementById('pixLoading').style.display = 'flex';
    document.getElementById('pixContainer').style.display = 'none';
    const btn = document.getElementById('btnConfirmarPix');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';

    // Requisição para o nosso Backend Node.js
    const BACKEND_URL = 'https://trip-burguer.onrender.com';
    
    fetch(`${BACKEND_URL}/api/pix/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            transaction_amount: pedidoObj.total,
            description: 'Pedido Trip Burger'
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) throw new Error(data.error);

        document.getElementById('pixLoading').style.display = 'none';
        document.getElementById('pixContainer').style.display = 'block';

        document.getElementById('pixQRCode').src = 'data:image/png;base64,' + data.qr_code_base64;
        document.getElementById('inputCopiaCola').value = data.qr_code;

        _mensagemAtual = mensagemBase + `\n\n*Aviso:* Pagamento PIX gerado (ID MP: ${data.payment_id})`;

        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    })
    .catch(err => {
        console.error('Erro PIX:', err);
        mostrarToast('Erro ao gerar PIX. Tente outra forma de pagamento ou avise no WhatsApp.');
        fecharModalPixDireto();
        setTimeout(() => abrirModalPedido(), 500);
    });
}

function fecharModalPix(event) {
    if (event.target === document.getElementById('modalPix')) fecharModalPixDireto();
}

function fecharModalPixDireto() {
    document.getElementById('modalPix').classList.remove('active');
    document.body.style.overflow = '';
}

function copiarPix() {
    const input = document.getElementById('inputCopiaCola');
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    
    mostrarToast('Código PIX copiado!');
    const btn = document.getElementById('btnCopiarPix');
    btn.textContent = '✅ Copiado!';
    setTimeout(() => {
        btn.textContent = '📄 Copiar Código Pix';
    }, 2000);
}

function confirmarPixEEnviar() {
    finalizarPedidoLocal(_pedidoAtual, _mensagemAtual);
    fecharModalPixDireto();
}


// ========== INICIALIZAÇÃO — RENDERIZAÇÃO DINÂMICA ==========
function initApp() {
    TB_initDB();

    // Listener de horário
    _unsubscribeHorario = TB_listenHorarioStatus(status => {
        _horarioStatus = status;
        atualizarIndicadorHorario();
    });

    const grids = [
        { id: 'hamburgueresGrid', cat: 'hamburgueres' },
        { id: 'xisGrid',         cat: 'xis' },
        { id: 'combosGrid',      cat: 'combos' },
        { id: 'porcoesGrid',     cat: 'porcoes' },
        { id: 'molhosGrid',      cat: 'molhos' },
        { id: 'bebidasGrid',     cat: 'bebidas' }
    ];

    grids.forEach(g => {
        const gridEl = document.getElementById(g.id);
        if (gridEl) {
            TB_listenProdutos(g.cat, produtos => {
                TB_renderGrid(produtos, gridEl);
                // Atualiza cache de adicionais
                if (g.cat === 'bebidas') _adicionaisBebidas = produtos;
                if (g.cat === 'molhos')  _adicionaisMolhos  = produtos;
            });
        }
    });

    TB_listenConfig(config => {
        const secao = document.getElementById('secaoDepoimentos');
        if (secao) {
            secao.style.display = config.mostrarAvaliacoes !== false ? '' : 'none';
        }
        
        if (config.valorSalada !== undefined) {
            _valorSaladaGlobal = config.valorSalada;
        }
    });

    const avaliacoesGrid = document.getElementById('avaliacoesGridPublic');
    if (avaliacoesGrid) {
        TB_listenAvaliacoes(avaliacoes => {
            if (typeof TB_renderAvaliacoesPublic === 'function') {
                TB_renderAvaliacoesPublic(avaliacoes, avaliacoesGrid);
            }
        });
    }

    // Atualizar indicador de horário a cada minuto
    setInterval(atualizarIndicadorHorario, 60000);
}

document.addEventListener('DOMContentLoaded', initApp);

/**
 * Atualizar indicador visual de horário no navbar
 */
function atualizarIndicadorHorario() {
    const statusAberto = TB_verificarSeAberto(_horarioStatus);
    
    // Criar ou atualizar o indicador
    let indicador = document.getElementById('indicadorHorario');
    
    if (!indicador) {
        indicador = document.createElement('div');
        indicador.id = 'indicadorHorario';
        indicador.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${statusAberto.aberto ? '#4caf50' : '#CC2200'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-family: 'Oswald', sans-serif;
            font-size: 0.9rem;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            letter-spacing: 0.05em;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(indicador);
    }
    
    const icon = statusAberto.aberto ? '🟢 Aberto' : '🔴 Fechado';
    indicador.innerHTML = icon;
    indicador.style.background = statusAberto.aberto ? '#4caf50' : '#CC2200';
}

console.log('✓ Trip Burger - Landing Page carregada com sucesso!');
console.log('✓ Carrinho, produtos dinâmicos e animações ativos.');