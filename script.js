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
    // Destaques visuais: a manchete abre a fonte original e usa a imagem do feed.
    const mainFeatureStatus = document.querySelector('[data-hero-status]');
    document.querySelectorAll('[data-feature]').forEach(feature => {
      const topico = feature.dataset.feature;
      const story = items.filter(x => x.topic === topico && seguro(x.url)).sort((a,b) => (b.publishedAt||'').localeCompare(a.publishedAt||''))[0];
      if (!story) return;
      feature.href = seguro(story.url);
      feature.target = '_blank';
      feature.rel = 'noopener noreferrer';
      const headline = feature.querySelector('h3');
      if (headline) headline.textContent = story.title;
      const excerpt = feature.querySelector('.lead-caption p');
      if (excerpt) excerpt.textContent = story.description || 'Acompanhe a cobertura na fonte original.';
      const heroImg = feature.querySelector('img');
      if (heroImg) {
        const fall = fallbackImage[topico] || 'assets/arena.svg';
        heroImg.onerror = () => {heroImg.onerror=null;heroImg.src=fall;};
        heroImg.src = seguro(story.image) || fall;
        heroImg.alt = 'Imagem relacionada à notícia, fornecida pela fonte ' + (story.source || 'externa');
      }
      const marker = feature.querySelector('.read-marker');
      if (marker) marker.textContent = (story.source || 'Fonte original') + ' · ' + formatarData(story.publishedAt) + ' · ABRIR MATÉRIA ↗';
    });
    if (mainFeatureStatus) mainFeatureStatus.textContent = 'MANCHETES ORIGINAIS · LINKS PARA AS FONTES';
    destinos.forEach(destino => {
      const assunto = destino.dataset.liveFeed;
      const limite = Math.min(12, Math.max(1,Number(destino.dataset.limit)||6));
      const lista = items.filter(item => (assunto==='all'||item.topic===assunto)&&seguro(item.url)).slice(0,limite);
      destino.replaceChildren();
      if (!lista.length) {destino.appendChild(texto('p','Nenhuma matéria disponível no momento. As análises autorais continuam acessíveis abaixo.','feed-empty'));return;}
      lista.forEach(item => {
        const article = document.createElement('article');article.className='live-card';
        const a = document.createElement('a');a.href=seguro(item.url);a.target='_blank';a.rel='noopener noreferrer';a.className='live-card-link';
        const visual=document.createElement('div');visual.className='live-card-visual';
        const img=document.createElement('img');img.loading='lazy';img.alt='Imagem de divulgação da fonte: '+(item.source||'notícia');
        img.src=seguro(item.image)||fallbackImage[item.topic]||'assets/arena.svg';
        img.onerror=()=>{img.onerror=null;img.src=fallbackImage[item.topic]||'assets/arena.svg';};
        visual.appendChild(img);
        const content=document.createElement('div');content.className='live-card-content';
        content.appendChild(texto('span',topics[item.topic]||'ESPORTS','category cat-'+item.topic));
        content.appendChild(texto('h3',item.title));
        if(item.description) content.appendChild(texto('p',item.description));
        content.appendChild(texto('span',(item.source||'Fonte externa')+' · '+formatarData(item.publishedAt)+' · LER NA FONTE ↗','live-meta'));
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
