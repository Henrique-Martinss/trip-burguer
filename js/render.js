/* ============================================================
   TRIP BURGUER — Renderização de Cards de Produto
   Compartilhado entre index.html e marmitas.html
   ============================================================ */

/**
 * Formata um valor para moeda BR: ex. 7,50 / 1.234,50
 * (sem prefixo R$ — o template adiciona manualmente para controle)
 */
function TB_formatBRL(valor) {
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Alterna a descrição entre expandida e recolhida.
 * Opera no wrapper .burguer-desc-wrap do card individual.
 */
function TB_toggleDesc(btn) {
  const wrap     = btn.closest('.burguer-desc-wrap');
  const expanded = wrap.classList.toggle('expanded');
  btn.innerHTML  = expanded ? '▲ ver menos' : '▼ ver mais';
  btn.classList.toggle('btn-ver-mais-ativo', expanded);
}

/**
 * Gera o HTML de um card de produto.
 * - Bebidas: sem descrição, sem padding extra
 * - Esgotados: overlay ESGOTADO + botão desativado
 * @param {Object} produto
 * @returns {string} HTML do card
 */
function TB_renderCard(produto) {
  const esc      = s => String(s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const esgotado = !!produto.esgotado;
  const isBebida = produto.categoria === 'bebidas';

  const tagHtml = produto.tag
    ? `<span class="burguer-tag" style="background-color:${esc(produto.tagColor || '#8C2493')}">${esc(produto.tag)}</span>`
    : '';

  const overlayHtml = esgotado
    ? `<div class="esgotado-overlay"><span class="esgotado-badge">ESGOTADO</span></div>`
    : '';

  const imgSrc = produto.imagemUrl
    ? esc(produto.imagemUrl)
    : 'https://placehold.co/400x300/141414/555555?text=Sem+Foto';

  const addBtnHtml = esgotado
    ? `<button class="btn-add-cart btn-esgotado" disabled>Indisponível</button>`
    : `<button class="btn-add-cart"
         data-nome="${esc(produto.nome)}"
         data-preco="${produto.preco}"
         data-cat="${esc(produto.categoria)}"
         onclick="adicionarAoCarrinho(this)">
         🛒 Adicionar
       </button>`;

  // Bebidas não exibem descrição
  let descHtml = '';
  if (!isBebida && produto.descricao) {
    const textoLongo = produto.descricao.length > 70;
    if (textoLongo) {
      // Wrapper colapsável com botão posicionado no final
      descHtml = `
        <div class="burguer-desc-wrap">
          <p class="burguer-desc">${esc(produto.descricao)}</p>
          <button class="btn-ver-mais" onclick="TB_toggleDesc(this)">▼ ver mais</button>
        </div>`;
    } else {
      descHtml = `<p class="burguer-desc">${esc(produto.descricao)}</p>`;
    }
  }

  return `
    <article class="burguer-card${esgotado ? ' card-esgotado' : ''}${isBebida ? ' bebida-card' : ''}">
      <div class="burguer-image">
        <img src="${imgSrc}" alt="${esc(produto.nome)}" loading="lazy">
        ${tagHtml}
        ${overlayHtml}
      </div>
      <div class="burguer-content">
        <h3 class="burguer-name">${esc(produto.nome)}</h3>
        ${descHtml}
        <div class="burguer-footer">
          <span class="burguer-price">R$ ${TB_formatBRL(produto.preco)}</span>
          ${addBtnHtml}
        </div>
      </div>
    </article>`;
}

/**
 * Renderiza lista de produtos em um elemento grid.
 * Esgotados vão sempre para o final.
 * @param {Array}   produtos
 * @param {Element} gridEl
 */
function TB_renderGrid(produtos, gridEl) {
  if (!gridEl) return;

  const disponiveis = produtos.filter(p => !p.esgotado).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const esgotados   = produtos.filter(p =>  p.esgotado).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
  const ordenados   = [...disponiveis, ...esgotados];

  if (ordenados.length === 0) {
    gridEl.innerHTML = `
      <div class="categoria-vazia">
        <span>🍽️</span>
        <p>Em breve novidades por aqui!</p>
        <p class="categoria-vazia-sub">Fique ligado no nosso cardápio.</p>
      </div>`;
    return;
  }

  gridEl.innerHTML = ordenados.map(TB_renderCard).join('');
}

/**
 * Renderiza lista de depoimentos no grid público
 * @param {Array} avaliacoes 
 * @param {Element} gridEl 
 */
function TB_renderAvaliacoesPublic(avaliacoes, gridEl) {
  if (!gridEl) return;
  if (!avaliacoes || avaliacoes.length === 0) {
    gridEl.innerHTML = '<p style="color:var(--muted);text-align:center;grid-column:1/-1;">Ainda não há depoimentos. Seja o primeiro a avaliar!</p>';
    return;
  }
  
  gridEl.innerHTML = avaliacoes.map(av => {
    const estrelas = '★'.repeat(av.estrelas || 5) + '☆'.repeat(5 - (av.estrelas || 5));
    const esc = s => String(s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `
      <div class="depoimento-card">
        <div class="stars">${estrelas}</div>
        <p class="depoimento-text">"${esc(av.texto)}"</p>
        <p class="depoimento-author">— ${esc(av.autor)}</p>
      </div>`;
  }).join('');
}
