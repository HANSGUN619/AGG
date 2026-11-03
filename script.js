const toggle=document.querySelector('[data-menu-toggle]');const nav=document.getElementById('nav-principal');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'FECHAR ✕':'MENU ☰';});}
const filters=document.querySelectorAll('[data-filter]');const rows=document.querySelectorAll('[data-topic]');filters.forEach(button=>button.addEventListener('click',()=>{const topic=button.dataset.filter;filters.forEach(b=>{const selected=b===button;b.classList.toggle('is-selected',selected);b.setAttribute('aria-pressed',String(selected));});rows.forEach(row=>{row.hidden=topic!=='all'&&row.dataset.topic!==topic;});}));
const form=document.querySelector('#contact-form');if(form){form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;const data=new FormData(form);const message=`Nome: ${data.get('nome')}\nE-mail: ${data.get('email')}\nAssunto: ${data.get('assunto')}\n\nMensagem:\n${data.get('mensagem')}`;const preview=document.querySelector('#preview');preview.querySelector('pre').textContent=message;preview.hidden=false;preview.querySelector('[data-copy]').dataset.text=message;});}const copy=document.querySelector('[data-copy]');if(copy){copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(copy.dataset.text);copy.textContent='COPIADO!';}catch(_){copy.textContent='SELECIONE E COPIE O TEXTO';}})}

// Notícias externas: arquivo JSON gerado pelo GitHub Actions. Não exige backend.
(async function carregarNoticias() {
  const destinos = [...document.querySelectorAll('[data-live-feed]')];
  if (!destinos.length) return;
  const statuses = [...document.querySelectorAll('[data-feed-status]')];
  const fallbackImage = {lol:'assets/league.svg',val:'assets/valorant.svg',cs:'assets/counter-strike.svg'};
  const topics = {lol:'LEAGUE OF LEGENDS',val:'VALORANT',cs:'COUNTER-STRIKE 2'};
  function texto(tag, value, className) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.textContent = String(value || '');
    return el;
  }
  function seguro(url) {
    try {const u = new URL(url, location.href);return ['https:','http:'].includes(u.protocol) ? u.href : null;}
    catch (_) {return null;}
  }
  function formatarData(data) {
    const dt = new Date(data);
    return Number.isFinite(dt.getTime()) ? new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeZone:'UTC'}).format(dt) : 'Data não informada';
  }
  try {
    const response = await fetch('data/noticias.json', {cache:'no-store'});
    if (!response.ok) throw new Error('HTTP '+response.status);
    const payload = await response.json();
    const items = Array.isArray(payload.articles) ? payload.articles : [];
    const atualizacao = payload.updatedAt ? 'Atualização do portal: '+formatarData(payload.updatedAt) : 'Seleção inicial verificada. A atualização automática começa após a publicação com GitHub Actions.';
    statuses.forEach(status => {status.textContent=atualizacao;});

// Os links da Home atual ainda não possuem data-feature.
// Procuramos os três blocos existentes, sem alterar os arquivos HTML.
const destaques = [
  {topic: 'lol', el: document.querySelector('[data-feature="lol"]') || document.querySelector('.lead-main .lead-image')},
  {topic: 'val', el: document.querySelector('[data-feature="val"]') || document.querySelector('.secondary-leads article:nth-child(1) .secondary-image')},
  {topic: 'cs', el: document.querySelector('[data-feature="cs"]') || document.querySelector('.secondary-leads article:nth-child(2) .secondary-image')}
];
const mainFeatureStatus = document.querySelector('[data-hero-status]');
destaques.forEach(({topic, el: feature}) => {
  if (!feature) return;
  const recentes = items.filter(x => x.topic === topic && seguro(x.url))
    .sort((a,b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
  // Privilegia notícia recente com fotografia verdadeira no feed.
  const comFoto = x => seguro(x.image) && !String(x.image).includes('/assets/') && !String(x.image).startsWith('assets/');
  const story = recentes.find(comFoto) || recentes[0];
  if (!story) return;
  feature.href = window.ARENA_LOCAL_URL ? window.ARENA_LOCAL_URL(story.url) : seguro(story.url);
  feature.removeAttribute('target');
  feature.removeAttribute('rel');
  const headline = feature.querySelector('h3');
  if (headline) headline.textContent = story.title;
  const excerpt = feature.querySelector('.lead-caption p');
  if (excerpt) excerpt.textContent = story.description || 'Acompanhe a matéria na fonte original.';
  const heroImg = feature.querySelector('img');
  if (heroImg) {
    const reserva = fallbackImage[topic] || 'assets/arena.svg';
    heroImg.onerror = () => { heroImg.onerror = null; heroImg.src = reserva; };
    heroImg.src = seguro(story.image) || reserva;
    heroImg.alt = 'Foto da manchete divulgada por ' + (story.source || 'fonte externa');
  }
  const marker = feature.querySelector('.read-marker');
  if (marker) marker.textContent = (story.source || 'Fonte original') + ' · ' + formatarData(story.publishedAt) + ' · LER NO ARENA//GG →';
});
if (mainFeatureStatus) mainFeatureStatus.textContent = 'FOTOS E MANCHETES DAS FONTES ORIGINAIS';
    destinos.forEach(destino => {
      const assunto = destino.dataset.liveFeed;
      const limite = Math.min(12, Math.max(1,Number(destino.dataset.limit)||6));
      const lista = items.filter(item => (assunto==='all'||item.topic===assunto)&&seguro(item.url)).slice(0,limite);
      destino.replaceChildren();
      if (!lista.length) {destino.appendChild(texto('p','Nenhuma matéria disponível no momento. As análises autorais continuam acessíveis abaixo.','feed-empty'));return;}
      lista.forEach(item => {
        const article = document.createElement('article');article.className='live-card';
        const a = document.createElement('a');a.href=window.ARENA_LOCAL_URL ? window.ARENA_LOCAL_URL(item.url) : seguro(item.url);a.className='live-card-link';
        const visual=document.createElement('div');visual.className='live-card-visual';
        const img=document.createElement('img');img.loading='lazy';img.alt='Imagem de divulgação da fonte: '+(item.source||'notícia');
        img.src=seguro(item.image)||fallbackImage[item.topic]||'assets/arena.svg';
        img.onerror=()=>{img.onerror=null;img.src=fallbackImage[item.topic]||'assets/arena.svg';};
        visual.appendChild(img);
        const content=document.createElement('div');content.className='live-card-content';
        content.appendChild(texto('span',topics[item.topic]||'ESPORTS','category cat-'+item.topic));
        content.appendChild(texto('h3',item.title));
        if(item.description) content.appendChild(texto('p',item.description));
        content.appendChild(texto('span',(item.source||'Fonte externa')+' · '+formatarData(item.publishedAt)+' · LER RESUMO NO ARENA//GG →','live-meta'));
        a.append(visual,content);article.appendChild(a);destino.appendChild(article);
      });
    });
  } catch (error) {
    const mainFeatureStatus = document.querySelector('[data-hero-status]');
    if (mainFeatureStatus) mainFeatureStatus.textContent = 'ANÁLISES EDITORIAIS · CONTEÚDO DE DEMONSTRAÇÃO';
    statuses.forEach(status => {status.textContent='Não foi possível carregar o feed. Abra o site por um servidor HTTP ou pela página publicada no GitHub Pages.';});
    destinos.forEach(destino => {destino.appendChild(texto('p','As notícias externas estão temporariamente indisponíveis.','feed-empty'));});
    console.warn('Falha ao carregar notícias externas:',error);
  }
})();

const RESULTADOS_ARQUIVO = {"updatedAt":"2026-11-03T13:00:00Z","type":"editorial_snapshot","disclaimer":"Resultados verificados em fontes públicas. Esta tabela não é ao vivo; novas séries exigem atualizar o arquivo data/resultados.json.","matches":[{"topic":"val","event":"Game Changers Championship 2026 · Grande final","team1":"Gentle Mates GC","team2":"KRÜ Blaze","score1":2,"score2":3,"playedAt":"2026-11-01","source":"VLR.gg","url":"https://www.vlr.gg/event/matches/3134/game-changers-2026-championship-s-o-paulo"},{"topic":"cs","event":"IEM Beijing 2026 · Grupos","team1":"FURIA","team2":"FaZe","score1":2,"score2":1,"playedAt":"2026-11-02","source":"HLTV","url":"https://www.hltv.org/results"},{"topic":"cs","event":"IEM Beijing 2026 · Grupos","team1":"Natus Vincere","team2":"Falcons","score1":2,"score2":0,"playedAt":"2026-11-02","source":"HLTV","url":"https://www.hltv.org/results"},{"topic":"cs","event":"IEM Beijing 2026 · Grupos","team1":"PARIVISION","team2":"G2","score1":2,"score2":1,"playedAt":"2026-11-02","source":"HLTV","url":"https://www.hltv.org/results"},{"topic":"val","event":"Game Changers Championship 2026 · Chave inferior","team1":"MIBR GC","team2":"KRÜ Blaze","score1":0,"score2":2,"playedAt":"2026-10-30","source":"VLR.gg","url":"https://www.vlr.gg/event/matches/3134/game-changers-2026-championship-s-o-paulo"},{"topic":"lol","event":"Worlds 2026 · Fase suíça","team1":"Gen.G","team2":"LYON","score1":2,"score2":1,"playedAt":"2026-10-25","source":"OP.GG Esports","url":"https://esports.op.gg/leagues/Worlds/2026"},{"topic":"lol","event":"Worlds 2026 · Fase suíça","team1":"Dplus KIA","team2":"Movistar KOI","score1":2,"score2":0,"playedAt":"2026-10-25","source":"OP.GG Esports","url":"https://esports.op.gg/leagues/Worlds/2026"}]};


// PLACARES VERIFICADOS. JSON opcional no repositório e backup incorporado na página.
// Nunca inventa resultados nem os apresenta como "ao vivo".
(async function carregarResultados() {
  const container = document.querySelector('[data-match-feed]');
  if (!container) return;
  const status = document.querySelector('[data-results-status]');
  const matchesFallback = RESULTADOS_ARQUIVO;
  let registros = matchesFallback.matches;
  let timestamp = matchesFallback.updatedAt;
  try {
    const response = await fetch('data/resultados.json', {cache:'no-store'});
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.matches) && data.matches.length) {
        registros = data.matches;
        timestamp = data.updatedAt || timestamp;
      }
    }
  } catch (_) { /* mantém placares verificáveis da versão inicial */ }
  const tipos = {lol:'LEAGUE OF LEGENDS',val:'VALORANT',cs:'COUNTER-STRIKE 2'};
  const safe = url => {try{const x=new URL(url);return x.protocol==='https:' ? x.href : null;}catch{return null;}};
  const date = str => {
    if (!/^\d{4}-\d{2}-\d{2}/.test(str||'')) return 'Data não informada';
    const [y,m,d]=str.slice(0,10).split('-');return d+'/'+m+'/'+y;
  };
  function node(tag, className, value) {
    const el=document.createElement(tag);if (className) el.className=className;
    if (value!==undefined) el.textContent=String(value);return el;
  }
  function render(topic='all') {
    container.replaceChildren();
    const lista=registros.filter(x=>(topic==='all'||x.topic===topic)&&safe(x.url)&&Number.isInteger(x.score1)&&Number.isInteger(x.score2));
    if (!lista.length) {container.appendChild(node('p','scoreboard-loading','Nenhum placar disponível para este filtro.'));return;}
    lista.slice(0,9).forEach(item=>{
      const a=node('a','score-card');a.href=safe(item.url);a.target='_blank';a.rel='noopener noreferrer';
      const meta=node('div','score-card-meta');
      meta.append(node('span','score-game score-'+item.topic,tipos[item.topic]||'ESPORTS'),node('span','score-date',date(item.playedAt)));
      const event=node('div','score-event',item.event);
      const teams=node('div','score-line');
      const left=node('div','score-team');left.append(node('span','score-team-label',item.team1));
      const right=node('div','score-team score-team-right');right.append(node('span','score-team-label',item.team2));
      const scores=node('div','score-numbers');
      scores.append(node('strong',item.score1>item.score2?'winner':'',item.score1),node('span','score-dash','—'),node('strong',item.score2>item.score1?'winner':'',item.score2));
      teams.append(left,scores,right);
      const foot=node('div','score-foot',(item.source||'Fonte original')+' · VER PLACAR ↗');
      a.append(meta,event,teams,foot);container.appendChild(a);
    });
  }
  document.querySelectorAll('[data-score-filter]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-score-filter]').forEach(el=>{const yes=el===btn;el.classList.toggle('active',yes);el.setAttribute('aria-pressed',String(yes));});
    render(btn.dataset.scoreFilter);
  }));
  render();
  if(status) status.textContent='Resultados conferidos em 03/11/2026 · última edição do arquivo: '+date(timestamp)+'. Não são placares ao vivo. Toque em uma partida para abrir a fonte.';
})();

// Fotos de arquivo hospedadas externamente mantêm a arte ilustrada como alternativa.
document.querySelectorAll('img[data-photo-fallback]').forEach(img=>{
  img.addEventListener('error',()=>{if(img.dataset.recovered)return;img.dataset.recovered='1';img.src=img.dataset.photoFallback;});
});


// ==============================================================
// ARENA//GG | LEITURA NO PROPRIO SITE
// Textos originais baseados em fontes verificaveis. Nao reproduz
// reportagens protegidas de terceiros. Os novos itens de RSS
// apresentam apenas resumos com credito e link para a fonte.
// ==============================================================
const ARENA_ARTIGOS = [
  {
    id:'zeus-renovacao-hle-2026', topic:'lol', type:'NOTÍCIA · MERCADO DE TRANSFERÊNCIAS',
    title:'Zeus recusa proposta de renovação da HLE; negociações seguem abertas',
    subtitle:'Segundo a Inven, o bicampeão mundial rejeitou uma oferta anterior ao Worlds 2026. A Hanwha Life afirma que ainda conversa com o jogador.',
    publishedAt:'2026-11-03', author:'Redação ARENA//GG',
    image:'https://upload.wikimedia.org/wikipedia/commons/e/e3/Zeus_2024_post-match_interview.jpg',
    source:'Fomos Esports / Wikimedia Commons — imagem de arquivo de 2024 (CC BY 3.0)',
    sources:[
      {label:'Inven Global — reportagem original sobre as negociações (2/11/2026)',url:'https://labs.invenglobal.com/articles/28018/zeus-choi-woo-je-fails-to-reach-agreement-on-contract-renewal-with-hanwha-life-prior-to-worlds'},
      {label:'Dot Esports — contexto sobre o mercado de 2027',url:'https://dotesports.com/league-of-legends/news/hle-zeus-rejects-free-agency-2027'},
      {label:'Fomos Esports / Wikimedia Commons — fotografia de arquivo de 2024 (CC BY 3.0)',url:'https://commons.wikimedia.org/wiki/File:Zeus_2024_post-match_interview.jpg'},
      {label:'Licença da fotografia — Creative Commons Atribuição 3.0',url:'https://creativecommons.org/licenses/by/3.0/'}
    ],
    sections:[
      {heading:'Uma proposta recusada, mas nenhum adeus confirmado',paragraphs:[
        'O futuro de Choi “Zeus” Woo-je na Hanwha Life Esports permanece indefinido. Segundo uma reportagem da Inven divulgada em 2 de novembro de 2026, o top laner rejeitou uma proposta de renovação apresentada antes do Mundial de League of Legends. A informação surgiu após o encerramento da campanha da equipe no Worlds 2026.',
        'A rejeição de uma proposta não significa rescisão ou transferência. De acordo com a apuração, o vínculo atual permanece em vigor até meados de novembro. Em resposta à Inven, a Hanwha Life informou que continua conversando com o jogador, portanto ainda existe a possibilidade de um novo acordo.'
      ]},
      {heading:'Por que Zeus pode movimentar a janela de transferências?',paragraphs:[
        'Bicampeão do Worlds com a T1 em 2023 e 2024, Zeus chegou à Hanwha Life após sua passagem pela organização de Faker. Em seu novo time, acrescentou ao currículo o First Stand de 2025 e o Mid-Season Invitational de 2026, conquistado antes da participação no Mundial deste ano.',
        'A Inven relatou que o jogador mudou de representante e estaria interessado em avaliar seu valor no mercado de agentes livres. Caso não chegue a um acordo com a HLE, um atleta com esse histórico tende a despertar interesse de equipes que buscam reforçar a rota superior. Até o momento desta reportagem, porém, não há destino confirmado.'
      ]},
      {heading:'Eliminação no Worlds aumenta a pressão sobre o planejamento',paragraphs:[
        'A Hanwha Life deixou o Worlds 2026 ainda na fase suíça, depois de perder por 2 a 0 para a Bilibili Gaming na série que valia classificação às quartas de final. O resultado contrasta com o título do MSI conquistado pela organização meses antes.',
        'O desempenho no Mundial é parte do contexto esportivo da próxima temporada, mas não há informação confirmada de que a eliminação tenha motivado a decisão de Zeus. O relato da Inven situa a recusa antes mesmo do início do torneio.'
      ]},
      {heading:'O que está confirmado em 3 de novembro',paragraphs:[
        'O que se sabe é que houve uma proposta rejeitada, segundo a Inven, e que a HLE mantém as conversas com seu top laner. Não é correto anunciar a saída definitiva de Zeus, seu retorno à T1 ou qualquer outra contratação sem um comunicado oficial.',
        'Os próximos acontecimentos dependerão do desfecho das negociações e da abertura do mercado de transferências. O ARENA//GG continuará distinguindo informações confirmadas de especulações, com os links das fontes disponíveis abaixo.'
      ]}
    ]
  },
  {
    id: 'worlds-2026-fases', topic:'lol', type:'REPORTAGEM ORIGINAL',
    title:'Worlds 2026: veja como funciona o caminho até a final do Mundial',
    subtitle:'A fase suíça terminou em 31 de outubro; o mata-mata começa em 3 de novembro e termina com a decisão no dia 14.',
    publishedAt:'2026-11-03', author:'Redação ARENA//GG',
    sources:[{label:'Riot Games — Guia do Worlds 2026',url:'https://lolesports.com/pt-BR/news/worlds-2026-primer'}],
    sections:[
      {heading:'O Mundial entra na fase decisiva',paragraphs:[
        'O Campeonato Mundial de League of Legends de 2026 chegou à etapa eliminatória depois de passar por duas fases com objetivos diferentes: definir os classificados iniciais e selecionar as equipes que sobreviveram à fase suíça. O calendário oficial publicado pela Riot Games coloca as partidas da fase eliminatória entre 3 e 14 de novembro.',
        'Antes disso, o Worlds teve a fase de entrada, entre 15 e 18 de outubro, em Los Angeles, e a fase suíça, de 23 a 31 de outubro, em Allen, no Texas. A estrutura separa o torneio em etapas que exigem adaptação tanto aos adversários quanto ao formato das séries.'
      ]},
      {heading:'Por que três vitórias eram tão importantes?',paragraphs:[
        'Na fase suíça, as equipes precisavam alcançar três vitórias para avançar. Da mesma forma, três derrotas significavam eliminação. A partir da segunda rodada, os confrontos eram sorteados entre times com campanhas equivalentes, e não era permitido repetir um adversário.',
        'O sistema cria um percurso em que uma vitória isolada não basta para garantir vaga, mas também em que um tropeço inicial não determina toda a campanha. O resultado é uma fase de grupos sem grupos fixos, com pressão crescente a cada rodada.'
      ]},
      {heading:'A disputa agora muda de caráter',paragraphs:[
        'Depois da definição dos oito classificados, o sorteio das quartas de final estabeleceu o chaveamento. Os dois times que passaram pela fase suíça com campanha de 3–0 seriam colocados contra adversários classificados com 3–2, conforme as regras apresentadas no guia oficial.',
        'A partir daí, a leitura de série se torna ainda mais relevante. Ajustes entre jogos, escolhas de draft e preparação contra um rival específico passam a ocupar o centro da disputa. Essa é uma análise do formato competitivo, não uma previsão de vencedor.'
      ]}
    ]
  },
  {
    id:'kru-blaze-campea-2026',topic:'val',type:'REPORTAGEM ORIGINAL',
    title:'KRÜ Blaze vence Gentle Mates GC por 3 a 2 e conquista final do Game Changers 2026',
    subtitle:'A decisão em São Paulo foi disputada em cinco mapas e terminou com virada da equipe sul-americana.',
    publishedAt:'2026-11-03', author:'Redação ARENA//GG',
    sources:[{label:'VLR.gg — Súmula da grande final',url:'https://www.vlr.gg/773436/gentle-mates-gc-vs-kr-blaze-game-changers-2026-championship-s-o-paulo-gf'}],
    sections:[
      {heading:'Final decidida no quinto mapa',paragraphs:[
        'A KRÜ Blaze derrotou a Gentle Mates GC por 3 a 2 na grande final do VALORANT Game Changers Championship 2026, disputada em São Paulo no domingo, 1º de novembro. O confronto teve formato melhor de cinco e terminou apenas depois de todos os mapas previstos para a série.',
        'A equipe europeia saiu na frente ao vencer Haven. A KRÜ empatou em Abyss; Gentle Mates recuperou a liderança em Sunset, e a KRÜ voltou a igualar em Split. O desempate aconteceu em Ascent, com vitória da KRÜ Blaze, segundo a súmula publicada pelo VLR.gg.'
      ]},
      {heading:'Uma campanha de recuperação',paragraphs:[
        'A trajetória até a decisão também explica o peso do resultado. A KRÜ Blaze havia sido derrotada pela Shopify Rebellion Gold na chave superior, mas voltou a enfrentar a equipe na final da chave inferior, em 31 de outubro, e venceu por 3 a 1 para assegurar sua vaga na disputa pelo título.',
        'Na fase anterior, a KRÜ superou a MIBR GC por 2 a 0. Isso significa que a campeã precisou vencer confrontos eliminatórios seguidos antes da final, cenário que torna a conquista ainda mais significativa dentro do formato de dupla eliminação.'
      ]},
      {heading:'O significado do resultado',paragraphs:[
        'O placar de 3 a 2 demonstra como a série permaneceu aberta até o fim. A alternância de vitórias nos quatro primeiros mapas impediu que qualquer equipe encerrasse o confronto antecipadamente.',
        'A conquista coroa a KRÜ Blaze na principal competição internacional do circuito Game Changers naquela temporada. Para conferir os números individuais e as estatísticas de cada mapa, a súmula original está disponível ao fim desta reportagem.'
      ]}
    ]
  },
  {
    id:'furia-faze-iem-beijing-2026',topic:'cs',type:'REPORTAGEM ORIGINAL',
    title:'FURIA reage após perder Ancient e supera FaZe por 2 a 1 na IEM Beijing 2026',
    subtitle:'Brasileiros viraram a melhor de três com vitórias convincentes em Dust2 e Cache no dia 2 de novembro.',
    publishedAt:'2026-11-03',author:'Redação ARENA//GG',
    sources:[{label:'HLTV — FURIA versus FaZe na IEM Beijing 2026',url:'https://www.hltv.org/matches/2399857/furia-vs-faze-iem-beijing-2026'}],
    sections:[
      {heading:'Reação brasileira na estreia do mata-mata da chave',paragraphs:[
        'A FURIA venceu a FaZe por 2 a 1 em 2 de novembro, na IEM Beijing 2026. O duelo foi disputado em LAN, em formato melhor de três, pelas quartas de final da chave superior do Grupo A, conforme o registro da HLTV.',
        'A série começou com derrota brasileira em Ancient por 13 a 11. Era o mapa escolhido pela FaZe, que conseguiu fechar um confronto apertado e saiu em vantagem. A recuperação da FURIA veio em Dust2, seu próprio mapa de escolha, com vitória por 13 a 5.'
      ]},
      {heading:'Cache decidiu a classificação',paragraphs:[
        'Com o confronto empatado, Cache ficou como mapa decisivo. A FURIA levou a melhor por 13 a 4, confirmando a virada e encerrando a série sem a necessidade de uma prorrogação.',
        'Os números mostram uma diferença importante entre o primeiro mapa e os dois seguintes: depois de perder Ancient por margem mínima, a equipe brasileira venceu 26 rounds contra apenas nove da FaZe nos mapas Dust2 e Cache somados.'
      ]},
      {heading:'O que o placar revela — e o que ele não revela',paragraphs:[
        'O resultado confirma a reação da FURIA dentro da melhor de três, mas não permite, por si só, concluir quais ajustes táticos foram determinantes. Para avaliar execuções, rotações e desempenhos individuais, é necessário acompanhar os replays e as estatísticas da partida.',
        'Ainda assim, a capacidade de responder à perda do primeiro mapa foi suficiente para garantir a vitória da equipe na série. O histórico dos rounds, os jogadores e os mapas podem ser consultados na página original da HLTV.'
      ]}
    ]
  }
];

(function arenaLeituraInterna(){
  const main = document.querySelector('main');
  if (!main) return;
  const editorial = ARENA_ARTIGOS;
  const topics = {lol:'LEAGUE OF LEGENDS',val:'VALORANT',cs:'COUNTER-STRIKE 2'};
  const fallback = {lol:'assets/league.svg',val:'assets/valorant.svg',cs:'assets/counter-strike.svg'};
  const q = new URLSearchParams(location.search);
  function node(tag,klass,txt){const el=document.createElement(tag);if(klass)el.className=klass;if(txt!==undefined)el.textContent=String(txt);return el;}
  function safeUrl(raw){try{const x=new URL(raw,location.href);return x.protocol==='https:' ? x.href : null;}catch{return null;}}
  function localArticleUrl(id){const u=new URL(location.pathname,location.origin);u.searchParams.set('materia',id);return u.pathname+u.search;}
  function localFeedUrl(url){const u=new URL(location.pathname,location.origin);u.searchParams.set('noticia',url);return u.pathname+u.search;}
  function formatDate(t){if(!t)return 'Data não informada';const d=new Date(t);return isNaN(d)?'Data não informada':new Intl.DateTimeFormat('pt-BR',{dateStyle:'long',timeZone:'UTC'}).format(d);}
  function addStyles(){
    const style=document.createElement('style');style.textContent=`
      .agg-editorial{max-width:1200px;margin:26px auto 45px;padding:0 22px}
      .agg-editorial-head{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-bottom:16px;border-bottom:1px solid #d5dbe4;padding-bottom:12px}
      .agg-editorial-tag{font-size:11px;color:#c93442;font-weight:800;letter-spacing:.12em}
      .agg-editorial h2{font-size:clamp(22px,3vw,32px);margin:6px 0;color:#172232}
      .agg-editorial-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}
      .agg-editorial-photo{width:100%;height:174px;object-fit:cover;object-position:center 25%;background:#152236;border-radius:2px}
      .agg-editorial-link{display:flex;flex-direction:column;gap:11px;border:1px solid #d8dfe7;background:#fff;padding:19px;text-decoration:none!important;color:#202b38!important;min-height:205px;border-radius:3px;box-shadow:0 3px 12px #1e293b08;transition:transform .2s,border-color .2s}
      .agg-editorial-link:hover,.agg-editorial-link:focus-visible{transform:translateY(-2px);border-color:#d33c49}
      .agg-editorial-link small{font-size:11px;font-weight:800;letter-spacing:.08em;color:#b42e3d}
      .agg-editorial-link h3{font-size:18px;line-height:1.3;margin:0;color:inherit}
      .agg-editorial-link p{font-size:13px;line-height:1.55;margin:0;color:#5a6470;flex:1}
      .agg-editorial-link .agg-read-more{font-size:11px;font-weight:800;color:#a82635}
      .agg-reader{min-height:70vh;background:#f3f5f8;padding:38px 20px 64px;color:#182637}
      .agg-reader-card{max-width:790px;margin:0 auto;background:#fff;border:1px solid #dce1e8;padding:clamp(22px,5vw,52px);box-shadow:0 8px 22px #1a254014}
      .agg-reader-back{display:inline-block;margin-bottom:28px;text-decoration:none;color:#a6283a;font-weight:800;font-size:12px}
      .agg-reader-kicker{font-size:12px;font-weight:800;letter-spacing:.11em;color:#bb303f}
      .agg-reader h1{font-size:clamp(29px,5.5vw,45px);line-height:1.14;color:#132031;margin:13px 0 15px;letter-spacing:-.025em}
      .agg-reader .agg-standfirst{font-size:18px;line-height:1.55;color:#546172;margin-bottom:23px}
      .agg-reader-byline{font-size:12px;color:#647184;border-top:1px solid #e0e4ea;border-bottom:1px solid #e0e4ea;padding:15px 0;margin:0 0 25px}
      .agg-reader h2{font-size:23px;color:#263548;margin:30px 0 9px}
      .agg-reader p.agg-body{font-size:16px;line-height:1.85;margin:0 0 18px;color:#273547}
      .agg-reader-img{display:block;width:100%;max-height:380px;object-fit:cover;margin:0 0 9px;background:#172232}
      .agg-img-credit{font-size:11px;color:#647184;margin-bottom:25px}
      .agg-sources{margin-top:32px;padding:20px;border-left:3px solid #cb3848;background:#f3f5f8}
      .agg-sources h2{margin:0 0 9px;font-size:17px}
      .agg-sources a{color:#a22838;text-decoration:underline;overflow-wrap:anywhere}
      .agg-sources p{font-size:13px;color:#566476;line-height:1.5}
      .agg-brief-note{padding:14px 18px;background:#f5f6f8;border-left:3px solid #d6a44c;color:#515b6b;font-size:13px;line-height:1.55;margin-bottom:20px}
      @media(max-width:750px){.agg-editorial-grid{grid-template-columns:1fr}.agg-editorial{padding:0 16px}.agg-editorial-link{min-height:auto}.agg-reader{padding:12px 10px 30px}.agg-reader-card{padding:22px}.agg-reader h1{font-size:30px}}
    `;document.head.appendChild(style);
  }
  addStyles();
  function showReader(article,brief=false){
    if(!article)return;
    main.style.display='none';
    const footer=document.querySelector('footer');if(footer)footer.style.display='none';
    const wrapper=node('main','agg-reader');wrapper.id='agg-reading';
    const card=node('article','agg-reader-card');
    const back=node('a','agg-reader-back','← VOLTAR AO PORTAL');back.href=location.pathname;card.appendChild(back);
    card.appendChild(node('div','agg-reader-kicker',(topics[article.topic]||'ESPORTS')+' · '+(brief?'RESUMO DA FONTE':article.type)));
    const h=node('h1',null,article.title);card.appendChild(h);
    if(article.subtitle)card.appendChild(node('p','agg-standfirst',article.subtitle));
    card.appendChild(node('div','agg-reader-byline',(article.author||article.source||'Fonte externa')+' · '+formatDate(article.publishedAt)));
    if(article.image){const img=node('img','agg-reader-img');img.src=safeUrl(article.image)||fallback[article.topic]||'assets/arena.svg';img.alt='Imagem associada à publicação, divulgada pela fonte';img.onerror=()=>{img.onerror=null;img.src=fallback[article.topic]||'assets/arena.svg';};card.appendChild(img);card.appendChild(node('div','agg-img-credit','Imagem: '+(article.source||'fonte indicada na matéria')));}
    if(brief){
      card.appendChild(node('div','agg-brief-note','Esta notícia chegou automaticamente pelo feed. Exibimos somente as informações fornecidas pela fonte. A reportagem completa permanece no veículo original; não inventamos detalhes nem reproduzimos textos integrais.'));
      card.appendChild(node('h2',null,'O que foi publicado'));
      card.appendChild(node('p','agg-body',article.description||'A fonte não disponibilizou resumo deste conteúdo no feed. Consulte a matéria original para conferir os detalhes.'));
      card.appendChild(node('h2',null,'Como acompanhar'));
      const context={lol:'Para entender o impacto de uma notícia de League of Legends, vale observar o campeonato, o momento da temporada e os resultados oficiais das equipes citadas.',val:'No cenário de VALORANT, o contexto de cada notícia depende do torneio, das séries disputadas e das informações publicadas pelas organizadoras.',cs:'No Counter-Strike competitivo, notícias sobre equipes e torneios devem ser acompanhadas junto das súmulas e dos resultados registrados pelas organizadoras.'};
      card.appendChild(node('p','agg-body',context[article.topic]||'Consulte a fonte original para conhecer os detalhes e o contexto da publicação.'));
    }else{
      for(const section of article.sections||[]){card.appendChild(node('h2',null,section.heading));for(const p of section.paragraphs||[])card.appendChild(node('p','agg-body',p));}
    }
    const sources=node('div','agg-sources');sources.appendChild(node('h2',null,'Fontes e referências'));
    const sourceList=brief?[{label:'Ler a notícia completa em '+(article.source||'fonte original'),url:article.url}]:article.sources;
    for(const source of sourceList||[]){const u=safeUrl(source.url);if(!u)continue;const p=node('p');const a=node('a',null,source.label);a.href=u;a.target='_blank';a.rel='noopener noreferrer';p.append(a);sources.append(p);}
    sources.appendChild(node('p',null,'O texto do ARENA//GG é original e identifica suas fontes. Direitos sobre fotos e reportagens externas pertencem aos respectivos titulares.'));
    card.append(sources);wrapper.append(card);main.before(wrapper);
    document.title=article.title+' | ARENA//GG';window.scrollTo(0,0);
  }
  function addEditorialSection(){
    // A vitrine aparece só na Home, antes do feed automático.
    const anchor=document.querySelector('.live-feed-section');
    if(!anchor || !document.querySelector('.lead-grid'))return;
    const sec=node('section','agg-editorial');
    const head=node('div','agg-editorial-head');const labels=node('div');labels.append(node('div','agg-editorial-tag','REPORTAGENS VERIFICÁVEIS · 03 NOV 2026'),node('h2',null,'Leia reportagens no ARENA//GG'));head.append(labels);sec.append(head);
    const grid=node('div','agg-editorial-grid');
    for(const article of editorial){const link=node('a','agg-editorial-link');link.href=localArticleUrl(article.id);if(article.image){const img=node('img','agg-editorial-photo');img.src=safeUrl(article.image)||fallback[article.topic]||'assets/arena.svg';img.alt='Foto de arquivo do jogador Zeus em 2024';img.loading='lazy';img.onerror=()=>{img.onerror=null;img.src=fallback[article.topic]||'assets/arena.svg';};link.append(img);}link.append(node('small',null,topics[article.topic]),node('h3',null,article.title),node('p',null,article.subtitle),node('span','agg-read-more','LER REPORTAGEM COMPLETA →'));grid.append(link);}
    sec.append(grid);anchor.before(sec);
  }
  addEditorialSection();
  // A Home exibe a notícia real e a página do próprio portal passa a ser o destino do clique.
  // Um endereço completo da fonte é codificado no link. A fonte continua citada no leitor.
  window.ARENA_LOCAL_URL = localFeedUrl;
  const articleId=q.get('materia');
  if(articleId){const article=editorial.find(x=>x.id===articleId);if(article)showReader(article);}
  const feedUrl=q.get('noticia');
  if(feedUrl){
    fetch('data/noticias.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Feed indisponível');return r.json();}).then(payload=>{
      const item=(payload.articles||[]).find(x=>x.url===feedUrl);
      if(item)showReader({...item,subtitle:item.description||'',author:item.source||'Fonte externa'},true);
      else if(safeUrl(feedUrl))showReader({title:'Manchete indisponível no feed atual',topic:'lol',url:feedUrl,description:'Esta matéria não consta na edição atual do feed. Abra a fonte original para ler o conteúdo.',source:'Fonte original'},true);
    }).catch(()=>{if(safeUrl(feedUrl))showReader({title:'Notícia temporariamente indisponível',topic:'lol',url:feedUrl,description:'Não foi possível recuperar os dados desta notícia.',source:'Fonte original'},true);});
  }
})();
