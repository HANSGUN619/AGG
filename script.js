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
    statuses.forEach(status => {status.textContent='Não foi possível carregar o feed. Abra o site por um servidor HTTP ou pela página publicada no GitHub Pages.';});
    destinos.forEach(destino => {destino.appendChild(texto('p','As notícias externas estão temporariamente indisponíveis.','feed-empty'));});
    console.warn('Falha ao carregar notícias externas:',error);
  }
})();
