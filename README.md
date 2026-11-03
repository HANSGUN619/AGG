# ARENA//GG — portal de notícias de e-sports

Trabalho acadêmico em HTML, CSS, JavaScript e uma automação opcional em Python com GitHub Actions. A aplicação tem cinco páginas HTML: Home, League of Legends, VALORANT, Counter-Strike 2 e Contato. O menu principal aparece nas cinco.

## Como funcionam as notícias reais?

- A API pública mantida por **Soraclee** fornece dados de notícias oficiais da Riot Games para **League of Legends e VALORANT**.
- O **RSS da HLTV** fornece manchetes do competitivo de **Counter-Strike**.
- O script [`scripts/atualizar_noticias.py`](scripts/atualizar_noticias.py) obtém os feeds, separa os resultados por modalidade e gera `data/noticias.json`.
- `script.js` carrega esse arquivo e monta cards com **título, data, imagem e atribuição**, sempre levando ao link original em outra aba. O portal não hospeda as matérias integrais.
- O GitHub Actions tenta atualizar e publicar o portal **a cada seis horas**. Podem ocorrer atrasos e indisponibilidade das fontes; não são resultados em tempo real. Se uma fonte falhar, o script mantém as manchetes já existentes daquela modalidade.
- Os textos estáticos de análise são conteúdo original de demonstração e não devem ser confundidos com matérias de terceiros.

## Como colocar online e ligar a atualização automática (GitHub Pages)

1. Crie um repositório **público** no GitHub, por exemplo `arena-gg`, e envie **todos os arquivos e pastas** deste projeto para a raiz da branch **main**. Não envie só o ZIP sem extraí-lo.
2. No repositório, acesse **Settings > Pages > Build and deployment**. Em **Source**, selecione **GitHub Actions** (não "Deploy from a branch").
3. Vá à aba **Actions** e selecione **Publicar ARENA GG e atualizar noticias**. Clique em **Run workflow** (ou aguarde o primeiro workflow executado pelo push). Se o repositório solicitar habilitar Actions, habilite-o.
4. Acompanhe a execução na aba **Actions**. Quando o job *deploy* terminar, em **Settings > Pages** aparece o link **Visit site**.
5. Verifique as notícias na Home e nas páginas das modalidades. As primeiras notícias já estão presentes no arquivo `data/noticias.json`; após a primeira execução, o arquivo é regenerado durante o deploy com as notícias recuperadas naquele momento.
6. Copie para o PDF da AOP2 o link do repositório e o link do site publicado. Preencha a capa com seus dados e matrícula.

> **Atenção:** é importante selecionar a origem **GitHub Actions**, pois o workflow publica o próprio site com os novos dados. Caso você use *Deploy from a branch*, a automação não terá o mesmo efeito. O `data/noticias.json` **do repositório** permanece como curadoria inicial: as notícias novas são incluídas no site publicado a cada execução do workflow, sem criar commits automáticos.

## Ver no computador

Na pasta do projeto, execute:

```bash
python -m http.server 8000
```

Depois abra `http://localhost:8000/`. Abrir o arquivo `index.html` diretamente pelo gerenciador de arquivos pode impedir o carregamento de JSON por restrições do navegador (`file://`).

## Fontes

- [API comunitária de notícias Riot](https://github.com/Soraclee/riotgames-news-api)
- [Feed RSS da HLTV](https://www.hltv.org/rss/news)
- [GitHub Pages — documentação](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

O projeto não é afiliado à Riot Games ou à HLTV. Títulos e miniaturas pertencem às fontes indicadas, quando aplicável. O layout, as artes editoriais estáticas e os textos analíticos foram produzidos para atividade acadêmica.

## Organização

```text
arena-gg/
├── index.html
├── league-of-legends.html
├── valorant.html
├── counter-strike-2.html
├── contato.html
├── style.css
├── script.js
├── assets/
├── data/
│   └── noticias.json
├── scripts/
│   └── atualizar_noticias.py
├── .github/
│   └── workflows/
│       └── publicar-site.yml
└── README.md
```
