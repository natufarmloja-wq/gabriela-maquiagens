// firebase-config.js
// Configuração e inicialização modular do Firebase SDK para Realtime Database e Auth.

// Configuração padrão que a cliente poderá atualizar se quiser colocar suas próprias credenciais.
// Por padrão, se não configurado ou se falhar, o app fará fallback automático usando LocalStorage,
// garantindo que o site NUNCA quebre para os clientes mesmo se o Firebase estiver desconfigurado.
const firebaseConfig = {
    apiKey: "AIzaSyAMkVy69maaeJS5Vgon04Mbtz8xowtttV0",
    authDomain: "gabmaquiagens-68f50.firebaseapp.com",
    databaseURL: "https://gabmaquiagens-68f50-default-rtdb.firebaseio.com",
    projectId: "gabmaquiagens-68f50",
    storageBucket: "gabmaquiagens-68f50.firebasestorage.app",
    messagingSenderId: "219483129850",
    appId: "1:219483129850:web:e318819bd2a47bdab68643"
};

// Variáveis globais do Firebase
let app, database, auth;
let isFirebaseActive = false;

// Tenta inicializar o Firebase. Em caso de credenciais inválidas ou fictícias, usará fallback LocalStorage.
try {
    if (typeof firebase !== 'undefined' && firebaseConfig.apiKey !== "SUA_API_KEY_AQUI") {
        // Inicialização com Firebase SDK V9/V10 compat (UMD)
        firebase.initializeApp(firebaseConfig);
        database = firebase.database();
        
        // Inicializa o Auth apenas se o script do Firebase Auth estiver carregado na página (ex: admin.html)
        if (typeof firebase.auth === 'function') {
            auth = firebase.auth();
        }
        
        isFirebaseActive = true;
        console.log("Firebase inicializado com sucesso!");
    } else {
        console.warn("Firebase não configurado ou rodando no modo local (Fallback LocalStorage ativo).");
    }
} catch (e) {
    console.error("Erro ao inicializar o Firebase. Ativando modo Fallback LocalStorage.", e);
}

// Produtos de Demonstração Iniciais para popular o catálogo caso o banco esteja vazio
const PRODUTOS_PADRAO = [
    {
        id: "-K1A_demo_001",
        sku: "GAB-001",
        nome: "Batom Matte Elegance Rosé",
        descricao: "Batom líquido matte de longa duração com acabamento confortável e cor aveludada intensa.",
        precoOriginal: 39.90,
        precoPromocional: 29.90,
        categoria: "maquiagem",
        imagem: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80",
        tamanhos: [],
        foraDeEstoque: false
    },
    {
        id: "-K1A_demo_002",
        sku: "GAB-002",
        nome: "Calça Feminina Wide Leg Dourada",
        descricao: "Calça pantalona wide leg confeccionada em tecido premium super elegante e confortável.",
        precoOriginal: 189.90,
        precoPromocional: null,
        categoria: "calça feminina",
        imagem: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
        tamanhos: ["P", "M", "G"],
        foraDeEstoque: false
    },
    {
        id: "-K1A_demo_003",
        sku: "GAB-003",
        nome: "Blusa Algodão Pima Soft",
        descricao: "Blusa gola redonda básica e essencial, feita 100% de algodão pima extremamente macio.",
        precoOriginal: 89.90,
        precoPromocional: 69.90,
        categoria: "blusas",
        imagem: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
        tamanhos: ["P", "M", "G", "GG"],
        foraDeEstoque: false
    },
    {
        id: "-K1A_demo_004",
        sku: "GAB-004",
        nome: "Pijama Satin Soft Shine",
        descricao: "Conjunto de pijama de cetim macio com detalhes rosé gold, ideal para noites relaxantes e sofisticadas.",
        precoOriginal: 149.90,
        precoPromocional: null,
        categoria: "pijama",
        imagem: "https://images.unsplash.com/photo-1562572159-4ebcd318f4dd?w=600&auto=format&fit=crop&q=80",
        tamanhos: ["M", "G"],
        foraDeEstoque: false
    }
];

// Funções Helpers para obter e salvar dados (Nuvem ou LocalStorage)
function obterProdutosDoBanco(callback) {
    if (isFirebaseActive) {
        database.ref('produtos').on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                // Converter objeto Firebase para array
                const lista = Object.keys(dados).map(key => ({
                    id: key,
                    ...dados[key]
                }));
                callback(lista);
            } else {
                // Banco vazio, insere padrões
                PRODUTOS_PADRAO.forEach(p => {
                    const novoRef = database.ref('produtos').push();
                    novoRef.set({
                        sku: p.sku,
                        nome: p.nome,
                        descricao: p.descricao,
                        precoOriginal: p.precoOriginal,
                        precoPromocional: p.precoPromocional,
                        categoria: p.categoria,
                        imagem: p.imagem,
                        tamanhos: p.tamanhos || [],
                        foraDeEstoque: p.foraDeEstoque || false
                    });
                });
                callback(PRODUTOS_PADRAO);
            }
        }, (error) => {
            console.error("Erro ao ler do Firebase, usando LocalStorage", error);
            obterProdutosDoLocalStorage(callback);
        });
    } else {
        obterProdutosDoLocalStorage(callback);
    }
}

function obterProdutosDoLocalStorage(callback) {
    let locais = localStorage.getItem('gabriela_produtos');
    if (!locais) {
        localStorage.setItem('gabriela_produtos', JSON.stringify(PRODUTOS_PADRAO));
        locais = JSON.stringify(PRODUTOS_PADRAO);
    }
    callback(JSON.parse(locais));
}

function salvarProdutoNoBanco(produto, callback) {
    const dadosSalvar = {
        sku: produto.sku,
        nome: produto.nome,
        descricao: produto.descricao,
        precoOriginal: parseFloat(produto.precoOriginal),
        precoPromocional: produto.precoPromocional ? parseFloat(produto.precoPromocional) : null,
        categoria: produto.categoria,
        imagem: produto.imagem || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600",
        tamanhos: produto.tamanhos || [],
        foraDeEstoque: produto.foraDeEstoque || false
    };

    if (isFirebaseActive) {
        if (produto.id) {
            database.ref('produtos/' + produto.id).set(dadosSalvar)
                .then(() => callback(true))
                .catch((e) => { console.error(e); callback(false); });
        } else {
            const novoRef = database.ref('produtos').push();
            novoRef.set(dadosSalvar)
                .then(() => callback(true))
                .catch((e) => { console.error(e); callback(false); });
        }
    } else {
        // LocalStorage fallback
        let locais = JSON.parse(localStorage.getItem('gabriela_produtos') || "[]");
        if (produto.id) {
            locais = locais.map(p => p.id === produto.id ? { ...p, ...dadosSalvar } : p);
        } else {
            const novoProduto = {
                id: 'local_' + Date.now(),
                ...dadosSalvar
            };
            locais.push(novoProduto);
        }
        localStorage.setItem('gabriela_produtos', JSON.stringify(locais));
        callback(true);
    }
}

function excluirProdutoDoBanco(id, callback) {
    if (isFirebaseActive) {
        database.ref('produtos/' + id).remove()
            .then(() => callback(true))
            .catch((e) => { console.error(e); callback(false); });
    } else {
        let locais = JSON.parse(localStorage.getItem('gabriela_produtos') || "[]");
        locais = locais.filter(p => p.id !== id);
        localStorage.setItem('gabriela_produtos', JSON.stringify(locais));
        callback(true);
    }
}
