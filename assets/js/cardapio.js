document.addEventListener("DOMContentLoaded", function () {
    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1xu29wPJfbZep4kOraJq4ANNnvBzANlKMLKoaK7ERRCs/export?format=csv&gid=1927074546';

    const containerProdutos = document.getElementById("lista-produtos");
    const produtoModal = new bootstrap.Modal(document.getElementById('produtoModal'));
    const carrinhoItensContainer = document.getElementById('carrinho-itens-container');
    const carrinhoVazioMsg = document.getElementById('carrinho-vazio-mensagem');
    const carrinhoFooter = document.getElementById('carrinho-footer');
    const subtotalCarrinhoEl = document.getElementById('subtotal-carrinho');

    let todosOsProdutos = [];
    let produtoAtualNaModal = null;


    function atualizarContadorCarrinho() {
        const carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        const totalItens = carrinho.reduce((total, item) => total + item.quantidade, 0);
        document.querySelector('.cart a').textContent = `Carrinho (${totalItens})`;
    }

 
    function renderizarCarrinho() {
        const carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        carrinhoItensContainer.innerHTML = '';


        if (carrinho.length === 0) {
            carrinhoVazioMsg.classList.remove('d-none');
            carrinhoFooter.classList.add('d-none');
            return;
        }

        carrinhoVazioMsg.classList.add('d-none'); 
        carrinhoFooter.classList.remove('d-none'); 

        let subtotal = 0;
        carrinho.forEach(item => {
            const itemTotal = item.preco * item.quantidade;
            subtotal += itemTotal;

            const itemHTML = `
                <div class="carrinho-item">
                    <img src="${item.imagem_url}" alt="${item.nome}" class="carrinho-item-img">
                    <div class="carrinho-item-info">
                        <h6>${item.nome}</h6>
                        <span class="text-muted">${item.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </div>
                    <div class="carrinho-item-controles">
                        <div class="input-group">
                            <button class="btn btn-outline-secondary btn-qtd-menos" data-produto-id="${item.id}">-</button>
                            <input type="text" class="form-control text-center" value="${item.quantidade}" readonly>
                            <button class="btn btn-outline-secondary btn-qtd-mais" data-produto-id="${item.id}">+</button>
                        </div>
                        <button class="btn btn-remover-item" data-produto-id="${item.id}"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>`;
            carrinhoItensContainer.innerHTML += itemHTML;
        });

        subtotalCarrinhoEl.textContent = subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    //FUNCOES PARA OS BTN DOS CARRINHOS
    function adicionarAoCarrinho(produto, quantidade) {
        if (!produto || quantidade <= 0) return;
        let carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        const itemExistente = carrinho.find(item => item.id === produto.id);
        if (itemExistente) {
            itemExistente.quantidade += quantidade;
        } else {
            carrinho.push({ ...produto, quantidade: quantidade });
        }
        localStorage.setItem('carrinhoFastmarket', JSON.stringify(carrinho));
        atualizarContadorCarrinho();
        renderizarCarrinho();
        produtoModal.hide();
    }
    
    function removerDoCarrinho(produtoId) {
        let carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        carrinho = carrinho.filter(item => item.id !== produtoId);
        localStorage.setItem('carrinhoFastmarket', JSON.stringify(carrinho));
        atualizarContadorCarrinho();
        renderizarCarrinho();
    }

    function atualizarQuantidadeCarrinho(produtoId, novaQuantidade) {
        let carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        const item = carrinho.find(item => item.id === produtoId);
        if (item) {
            if (novaQuantidade <= 0) {
                removerDoCarrinho(produtoId);
            } else {
                item.quantidade = novaQuantidade;
                localStorage.setItem('carrinhoFastmarket', JSON.stringify(carrinho));
                atualizarContadorCarrinho();
                renderizarCarrinho();
            }
        }
    }

    function atualizarPrecoModal() {
        if (!produtoAtualNaModal) return;
        const quantidade = parseInt(document.getElementById('input-quantidade').value);
        const precoTotal = produtoAtualNaModal.preco * quantidade;
        const precoFormatado = precoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('btn-adicionar-com-preco').textContent = `Adicionar ${precoFormatado}`;
    }

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const row = {};
            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (values.length === headers.length) {
                for (let j = 0; j < headers.length; j++) {
                    let value = values[j].trim().replace(/^"|"$/g, '');
                    row[headers[j]] = value;
                }
                rows.push(row);
            }
        }
        return rows;
    }

    function renderizarProdutos(produtos) {
        containerProdutos.innerHTML = "";
        if (!produtos.length) {
            containerProdutos.innerHTML = '<p class="text-center">Nenhum produto encontrado.</p>';
            return;
        }
        produtos.forEach(produto => {
            const semEstoque = produto.estoque === 0;
            const cardHTML = `
               <div class="col-6 col-md-6 col-lg-3 d-flex align-items-stretch">
                    <div class="card card-produto w-100 ${semEstoque ? 'disabled' : ''}" 
                         style="${semEstoque ? 'cursor: not-allowed; opacity: 0.7;' : 'cursor: pointer;'}"
                         ${semEstoque ? '' : `data-bs-toggle="modal" data-bs-target="#produtoModal" data-produto-id="${produto.id}"`}>
                        <img src="${produto.imagem_url || 'https://via.placeholder.com/300x200.png?text=Sem+Imagem'}" class="card-img-top" alt="${produto.nome}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">${produto.nome}</h5>
                            <p class="card-text">${produto.descricao}</p>
                            <p class="preco mt-auto">${produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        </div>
                    </div>
                </div>`;
            containerProdutos.innerHTML += cardHTML;
        });
    }

    function carregarCardapio() {
        document.getElementById("indicador-carregamento").style.display = 'block';
        fetch(GOOGLE_SHEET_CSV_URL)
            .then(response => response.ok ? response.text() : Promise.reject(response.statusText))
            .then(csvText => {
                const produtosCsv = parseCSV(csvText);
                todosOsProdutos = produtosCsv
                    .filter(p => p.ativo && p.ativo.toLowerCase() === 'true')
                    .map(p => ({
                        ...p,
                        preco: Number(String(p.preco || '0').replace(',', '.')),
                        estoque: p.estoque?.toLowerCase() === 'ilimitado' ? Infinity : Number(p.estoque || 0),
                    }))
                    .filter(p => p.nome && !isNaN(p.preco));
                renderizarProdutos(todosOsProdutos);
            })
            .catch(error => {
                console.error("ERRO:", error);
                containerProdutos.innerHTML = `<div class="col-12"><p class="text-center text-danger">Não foi possível carregar o cardápio.</p></div>`;
            });
    }


    document.getElementById('produtoModal').addEventListener('show.bs.modal', function (event) {
        const produtoId = event.relatedTarget.getAttribute('data-produto-id');
        produtoAtualNaModal = todosOsProdutos.find(p => p.id === produtoId);
        if (!produtoAtualNaModal) return;
        document.getElementById('modalProdutoNome').textContent = produtoAtualNaModal.nome;
        document.getElementById('modalProdutoImagem').src = produtoAtualNaModal.imagem_url || 'https://via.placeholder.com/300x200.png?text=Sem+Imagem';
        document.getElementById('modalProdutoDescricao').textContent = produtoAtualNaModal.descricao_longa || produtoAtualNaModal.descricao;
        document.getElementById('modalProdutoPreco').textContent = produtoAtualNaModal.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const containerAlergenos = document.getElementById('container-alergenos');

        if (produtoAtualNaModal.alergenos) {
            containerAlergenos.innerHTML = `<div class="info-alergenos">Contém: ${produtoAtualNaModal.alergenos}</div>`;
        } else {
            containerAlergenos.innerHTML = '';
        }

        document.getElementById('container-selo').innerHTML = '';
        document.getElementById('container-tempo-preparo').innerHTML = '';
        document.getElementById('container-calorias').innerHTML = '';
        document.getElementById('input-quantidade').value = 1;

        atualizarPrecoModal();
    });

    document.getElementById('btn-aumentar-qtd').addEventListener('click', () => {
        const input = document.getElementById('input-quantidade');
        input.value = parseInt(input.value) + 1;
        atualizarPrecoModal();
    });
    document.getElementById('btn-diminuir-qtd').addEventListener('click', () => {
        const input = document.getElementById('input-quantidade');
        if (parseInt(input.value) > 1) {
            input.value = parseInt(input.value) - 1;
            atualizarPrecoModal();
        }
    });
    document.getElementById('btn-adicionar-com-preco').addEventListener('click', () => {
        const quantidade = parseInt(document.getElementById('input-quantidade').value);
        adicionarAoCarrinho(produtoAtualNaModal, quantidade);
    });

    //botoes do carrinho
    carrinhoItensContainer.addEventListener('click', function(event) {
        const target = event.target.closest('button');
        if (!target) return;

        const produtoId = target.dataset.produtoId;
        const carrinho = JSON.parse(localStorage.getItem('carrinhoFastmarket')) || [];
        const item = carrinho.find(i => i.id === produtoId);

        if (target.classList.contains('btn-remover-item')) {
            removerDoCarrinho(produtoId);
        } else if (target.classList.contains('btn-qtd-mais')) {
            atualizarQuantidadeCarrinho(produtoId, item.quantidade + 1);
        } else if (target.classList.contains('btn-qtd-menos')) {
            atualizarQuantidadeCarrinho(produtoId, item.quantidade - 1);
        }
    });

    atualizarContadorCarrinho();
    renderizarCarrinho(); 
    carregarCardapio();
});