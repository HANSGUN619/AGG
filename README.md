# ARENA//GG — notícias e análises de e-sports

**ARENA//GG** é um blog acadêmico sobre o cenário competitivo de **League of Legends**, **VALORANT** e **Counter-Strike 2**. O portal reúne destaques das modalidades, notícias de fontes identificadas, reportagens originais e informações sobre partidas.

**[🌐 Acessar o site publicado](https://hansgun619.github.io/AGG/)** · **[📁 Repositório no GitHub](https://github.com/HANSGUN619/AGG)**

## Páginas do blog

| Página | Conteúdo |
| --- | --- |
| [Home](index.html) | Apresentação do blog, três destaques com imagens clicáveis, manchetes e reportagens. |
| [League of Legends](league-of-legends.html) | Notícias, análises e informações sobre o competitivo de LoL. |
| [VALORANT](valorant.html) | Notícias, estratégias e cobertura do cenário profissional de VALORANT. |
| [Counter-Strike 2](counter-strike-2.html) | Notícias, torneios e análises sobre CS2. |
| [Contato](contato.html) | Formulário demonstrativo para composição e prévia de mensagens. |

A **Home** apresenta o objetivo do portal e contém três cards fixos — um para cada modalidade — com **imagem, breve descrição e link para a página correspondente**. Esses links fazem parte do HTML e não dependem de JavaScript para funcionar.

## Funcionalidades

- **Notícias atualizadas automaticamente:** manchetes de fontes externas, com título, data, resumo, fotografia quando disponível e crédito.
- **Leitura dentro do ARENA//GG:** as chamadas levam a uma visualização da notícia no portal, com acesso à fonte original para leitura completa.
- **Reportagens autorais:** textos editoriais escritos para o projeto, incluindo uma cobertura das negociações entre Zeus e a Hanwha Life Esports (HLE).
- **Resultados e partidas:** seção informativa com placares de referência; **não representa resultados ao vivo**.
- **Layout responsivo:** páginas adaptadas para celulares e computadores, com navegação compartilhada.

> **Transparência editorial:** os resumos automáticos não reproduzem integralmente matérias de outros sites. A reportagem completa deve ser consultada na fonte indicada. Imagens externas podem não estar disponíveis; nesses casos, o portal utiliza ilustrações locais como alternativa.

## De onde vêm as notícias?

O atualizador [`scripts/attnot.py`](scripts/attnot.py) consulta as seguintes fontes públicas:

- **LoL e VALORANT:** [Riot Games News API comunitária](https://github.com/Soraclee/riotgames-news-api), mantida por Soraclee.
- **CS2:** [feed RSS da HLTV](https://www.hltv.org/rss/news).

O script gera [`data/noticias.json`](data/noticias.json). O arquivo [`script.js`](script.js) lê os dados e atualiza as manchetes exibidas no navegador. Quando uma fonte não responde, o atualizador tenta preservar os dados existentes daquela modalidade.

A publicação usa **GitHub Actions**, configurado em [`.github/workflows/publicar-site.yml`](.github/workflows/publicar-site.yml). O fluxo executa o Python e publica o site no GitHub Pages quando há um novo commit na branch `main`, quando acionado manualmente e, normalmente, em intervalos programados de **seis horas**. A execução programada pode sofrer atrasos.

**Importante:** o JSON gerado durante a publicação integra o site servido pelo GitHub Pages. Ele não precisa aparecer como um novo commit no repositório após cada atualização.

## Tecnologias utilizadas

- **HTML5** — estrutura das cinco páginas;
- **CSS3** — identidade visual e responsividade;
- **JavaScript** — navegação, notícias, reportagens e interações;
- **Python 3** — coleta e preparação das manchetes;
- **GitHub Actions + GitHub Pages** — automação e hospedagem.

## Executar localmente

Depois de baixar ou clonar o repositório, abra um terminal na pasta do projeto e execute:

```bash
python -m http.server 8000
```

Acesse **http://localhost:8000/** no navegador. Um servidor local é recomendado porque o navegador pode bloquear a leitura do arquivo JSON quando a Home é aberta diretamente por `file://`.

Para atualizar as notícias manualmente, execute antes:

```bash
python scripts/attnot.py
```

## Estrutura principal

```text
AGG/
├── index.html
├── league-of-legends.html
├── valorant.html
├── counter-strike-2.html
├── contato.html
├── style.css
├── script.js
├── assets/
│   ├── arena.svg
│   ├── league.svg
│   ├── valorant.svg
│   └── counter-strike.svg
├── data/
│   └── noticias.json
├── scripts/
│   └── attnot.py
├── .github/
│   └── workflows/
│       └── publicar-site.yml
└── README.md
```

## Sobre o projeto

Desenvolvido como **atividade acadêmica de desenvolvimento web**, com tema **e-sports**. Trata-se de um projeto educacional independente, **sem vínculo oficial com a Riot Games, a Valve, a HLTV ou as equipes citadas**. Nomes, notícias e imagens de terceiros pertencem aos respectivos titulares; fontes e créditos são apresentados quando disponíveis.
