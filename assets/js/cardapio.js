document.addEventListener("DOMContentLoaded", function () {

    const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1xu29wPJfbZep4kOraJq4ANNnvBzANlKMLKoaK7ERRCs/export?format=csv&gid=1927074546';

    const containerProdutos = document.getElementById("lista-produtos");
    const indicadorCarregamento = document.getElementById("indicador-carregamento");

    function parseCSV(text) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const rows = [];

        for (let i = 1; i < lines.length; i++) {
            const row = {};

            const values = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

            if (values.length === headers.length) {
                for (let j = 0; j < headers.length; j++) {
                    let value = values[j].trim();
                    if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }
                    row[headers[j]] = value;
                }
                rows.push(row);
            }
        }
        return rows;
    }

    function renderizarProdutos(produtos) {

        containerProdutos.innerHTML = "";

        if (produtos.length === 0) {
            containerProdutos.innerHTML = '<p class="text-center">Nenhum produto encontrado.</p>';
            return;
        }

        produtos.forEach(produto => {
            const semEstoque = produto.estoque === 0;

            const cardHTML = `
               <div class="col-12 col-md-6 col-lg-3 d-flex align-items-stretch">
                    <div class="card card-produto w-100">
                        <img src="${produto.imagem_url || 'https://via.placeholder.com/300x200.png?text=Sem+Imagem'}" class="card-img-top" alt="${produto.nome}">
                        <div class="card-body">
                            <h5 class="card-title">${produto.nome}</h5>
                            <p class="card-text">${produto.descricao}</p>
                            <p class="preco">
                                ${produto.preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                            <button class="btn btn-adicionar-carrinho mt-auto" ${semEstoque ? 'disabled' : ''}>
                                ${semEstoque ? 'Esgotado' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            containerProdutos.innerHTML += cardHTML;
        });
    }

    function carregarCardapio() {
        indicadorCarregamento.style.display = 'block';

        fetch(GOOGLE_SHEET_CSV_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na requisição: ' + response.statusText);
                }
                return response.text();
            })
            .then(csvText => {
                const produtosCsv = parseCSV(csvText);

                const produtosFormatados = produtosCsv.map(p => ({
                    ...p,
                    id: p.id,
                    preco: Number(String(p.preco || '0').replace(',', '.')),
                    estoque: p.estoque && p.estoque.toLowerCase() === 'ilimitado' ? 'ilimitado' : Number(p.estoque || 0),
                }));

                const produtosValidos = produtosFormatados.filter(p => p.nome && !isNaN(p.preco));

                renderizarProdutos(produtosValidos);
            })
            .catch(error => {
                console.error("ERRO:", error);
                containerProdutos.innerHTML = `<div class="col-12"><p class="text-center text-danger">Não foi possível carregar o cardápio. Tente novamente mais tarde.</p></div>`;
            });
    }

    carregarCardapio();
});