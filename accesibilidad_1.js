(function(){
  if(window.AccessibilityWidget) return;
  const LS_KEY='acc_settings_v1_9';
  const LS_POS='acc_fab_pos_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const css=`
  :root{--acc-primary-100:#e8dcc5;--acc-primary-500:#c5a059;--acc-primary-600:#000831;--acc-neutral-100:#f5f5f4;--acc-neutral-200:#e5e5e4;--acc-neutral-900:#1c1917}
  @keyframes accFabSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  #accFab{position:fixed;bottom:20px;left:20px;width:56px;height:56px;border-radius:999px;background:#000831;color:#fff;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 10px 25px rgba(0,0,0,.1),0 4px 10px rgba(0,0,0,.08);z-index:10050;cursor:grab;transition:box-shadow .2s ease;touch-action:none;user-select:none;animation:accFabSpin 8s linear infinite}
  #accFab:hover{box-shadow:0 12px 30px rgba(0,0,0,.15),0 6px 12px rgba(0,0,0,.1);animation:accFabSpin 1.5s linear infinite}
  #accFab.dragging{animation:none;cursor:grabbing;box-shadow:0 20px 50px rgba(0,0,0,.3);transform:scale(1.1);transition:box-shadow .1s,transform .1s}
  #accFab.hidden{display:none}
  #accFab .ico-dog{font-size:28px;line-height:1}
  #accFabHint{position:fixed;background:rgba(0,0,0,.75);color:#fff;font-size:11px;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .3s;z-index:10049}
  #accFabHint.show{opacity:1}
  #accPanelOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:10040;transition:opacity .3s ease}
  #accPanelOverlay.open{display:block;opacity:1}
  #accPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:580px;max-width:calc(100% - 40px);background:#fff;color:#1c1917;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);z-index:10060;display:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;transition:transform .3s ease,opacity .3s ease;opacity:0}
  #accPanel.open{display:block;opacity:1;transform:translate(-50%,-50%)}
  #accPanel header{padding:16px 20px;background:#000831;display:flex;align-items:center;justify-content:space-between;border-top-left-radius:18px;border-top-right-radius:18px;color:#fff}
  #accPanel header h3{margin:0;font-size:18px;font-weight:700}
  #accPanel header button{border:none;background:transparent;color:#fff;font-size:22px;cursor:pointer}
  #accPanel .acc-body{padding:20px;max-height:72vh;overflow:auto}
  .acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .acc-tile{position:relative;border:2px solid #e5e5e4;border-radius:14px;background:#f5f5f4;min-height:110px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:12px;gap:8px;font-size:13px;cursor:pointer;user-select:none;transition:border-color .2s ease,box-shadow .2s ease,background .2s ease}
  .acc-tile .ico{font-size:22px;line-height:1;color:#000831}
  .acc-tile .ico i{font-size:22px}
  .acc-tile:hover{background:#fff;border-color:#c5a059}
  .acc-tile[aria-pressed="true"]{border:2px solid #c5a059;background:#e8dcc5;box-shadow:0 0 0 2px #c5a059 inset}
  .acc-tile[aria-pressed="true"]::after{content:"✓";position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:999px;background:#c5a059;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;font-weight:bold}
  .acc-tile input[type="range"]{width:100%}
  .acc-section{margin:18px 2px 10px;font-weight:700;font-size:13px;color:#000831;text-transform:uppercase;letter-spacing:1px}
  .acc-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .acc-radio{display:flex;gap:8px;align-items:center;font-size:14px}
  .acc-radio input{accent-color:#c5a059;width:16px;height:16px}
  .acc-footer{display:flex;justify-content:space-between;align-items:center;margin-top:20px}
  .acc-btn{padding:10px 14px;border-radius:10px;border:1px solid #e5e5e4;background:#fff;cursor:pointer;font-size:13px;transition:all .2s ease}
  .acc-btn:hover{background:#f5f5f4}
  .acc-btn.primary{background:#000831;color:#fff;border-color:#000831}
  .acc-btn.primary:hover{background:#c5a059;border-color:#c5a059;color:#000831}
  .acc-note{font-size:12px;color:#78716c}
  .segmented{display:flex;gap:6px;width:100%;justify-content:center;flex-wrap:wrap}
  .segmented .seg{flex:1 1 auto;padding:8px 10px;border:1px solid #e5e5e4;border-radius:999px;background:#fff;cursor:pointer;font-size:12px;white-space:nowrap;transition:all .2s ease}
  .segmented .seg:hover{background:#f5f5f4}
  .segmented .seg.active{border:2px solid #c5a059;background:#e8dcc5;color:#000831;font-weight:600}
  html.acc-contrast-light{filter:contrast(1.15) saturate(1.05)}
  html.acc-contrast-smart{filter:contrast(1.1) saturate(1.2) brightness(1.02)}
  html.acc-contrast-dark{filter:invert(1) hue-rotate(180deg)}
  html.acc-daltonic-protanopia{filter:url('#protanopia')}
  html.acc-daltonic-deuteranopia{filter:url('#deuteranopia')}
  html.acc-daltonic-tritanopia{filter:url('#tritanopia')}
  html.acc-highlight-links a,html.acc-highlight-links [role="link"]{outline:2px dashed #c5a059!important;text-decoration:underline!important}
  html.acc-no-anim *,html.acc-no-anim *::before,html.acc-no-anim *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  html.acc-hide-images img,html.acc-hide-images picture,html.acc-hide-images video,html.acc-hide-images svg[role="img"]{display:none!important}
  @font-face{font-family:"OpenDyslexic";src:local("OpenDyslexic Regular"),local("OpenDyslexic");font-display:swap}
  @font-face{font-family:"Atkinson Hyperlegible";src:local("Atkinson Hyperlegible Regular"),local("Atkinson Hyperlegible");font-display:swap}
  html.acc-dys-dys *{font-family:"OpenDyslexic",Arial,Verdana,system-ui,sans-serif!important}
  html.acc-dys-dys body{background:#f9f7f1!important;color:#111!important}
  html.acc-dys-hyper *{font-family:"Atkinson Hyperlegible",system-ui,Segoe UI,Arial,sans-serif!important}
  html.acc-dys-hyper body{background:#f7fbff!important;color:#111!important}
  html.acc-align-left *{text-align:left!important}
  html.acc-align-center *{text-align:center!important}
  html.acc-align-right *{text-align:right!important}
  html.acc-saturate-low{filter:saturate(.6)}
  html.acc-saturate-high{filter:saturate(1.8)}
  html.acc-desaturate{filter:saturate(0)}
  html.acc-focus-mode *:not(:focus):not(:focus-within){outline:none!important}
  html.acc-focus-mode *:focus,html.acc-focus-mode *:focus-within{outline:3px solid #c5a059!important;outline-offset:3px!important}
  html.acc-reading-ruler{cursor:crosshair}
  html.acc-ctl{--acc-font-scale:100%;--acc-letter-spacing:0px;--acc-line-height:normal}
  html.acc-ctl *{font-size:var(--acc-font-scale);letter-spacing:var(--acc-letter-spacing);line-height:var(--acc-line-height)}
  #accPanel, #accPanel * {font-size: min(var(--acc-font-scale), 120%) !important; letter-spacing: min(var(--acc-letter-spacing), 2px) !important; line-height: min(var(--acc-line-height), 1.6) !important;}
  #accOutline{position:fixed;top:20px;left:20px;width:340px;max-height:70vh;overflow:auto;background:#fff;border:1px solid #e5e5e4;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.2);z-index:10070;padding:16px;display:none}
  #accOutline.open{display:block}
  #accOutline h4{margin:0 0 10px;font-size:15px;font-weight:700;color:#000831}
  #accOutline ul{list-style:none;margin:0;padding:0}
  #accOutline li{margin:6px 0}
  #accOutline a{text-decoration:none;color:#c5a059;font-size:13px;display:block;padding:4px;border-radius:6px;transition:background .2s ease}
  #accOutline a:hover{background:#e8dcc5}
  #accCursorRing{position:fixed;top:0;left:0;width:44px;height:44px;border:3px solid #c5a059;border-radius:999px;pointer-events:none;transform:translate(-100px,-100px);opacity:.0;transition:opacity .2s;z-index:10080}
  #accCursorRing.on{opacity:.7}
  #accReadingRuler{position:fixed;left:0;right:0;height:36px;background:rgba(197,160,89,.18);border-top:2px solid rgba(197,160,89,.5);border-bottom:2px solid rgba(197,160,89,.5);pointer-events:none;z-index:10045;display:none;transform:translateY(-50%)}
  #accReadingRuler.on{display:block}
  #accZoomBox{position:fixed;width:220px;height:220px;border:3px solid #c5a059;border-radius:50%;pointer-events:none;overflow:hidden;z-index:10090;display:none;box-shadow:0 8px 32px rgba(0,0,0,.25)}
  #accZoomBox.on{display:block}
  #accSkipBtn{position:fixed;top:-60px;left:20px;z-index:10100;background:#000831;color:#fff;padding:12px 18px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600;transition:top .2s}
  #accSkipBtn:focus{top:20px}
  @media (max-width: 600px) {
    #accPanel {width: 90%; max-width: 400px;}
    .acc-grid {grid-template-columns: repeat(2, 1fr);}
  }
  `;
  const defaults={contrast:null,daltonic:null,highlightLinks:false,stopAnimations:false,hideImages:false,dyslexiaMode:null,align:null,saturation:null,fontScale:100,letterSpacing:0,lineHeight:140,position:'free',voiceFeedback:false,focusMode:false,readingRuler:false,darkMode:false,zoom:false,skipContent:true};
  let settings=load();
  if(settings.position==='left'||settings.position==='right') settings.position='free';

  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(LS_KEY)||'{}'))}catch{return {...defaults}}}
  function save(){localStorage.setItem(LS_KEY,JSON.stringify(settings))}

  function loadFabPos(){try{return JSON.parse(localStorage.getItem(LS_POS)||'null')}catch{return null}}
  function saveFabPos(x,y){localStorage.setItem(LS_POS,JSON.stringify({x,y}))}

  function apply(){
    const html=document.documentElement;
    html.classList.remove(
      'acc-contrast-light','acc-contrast-smart','acc-contrast-dark',
      'acc-daltonic-protanopia','acc-daltonic-deuteranopia','acc-daltonic-tritanopia',
      'acc-saturate-low','acc-saturate-high','acc-desaturate',
      'acc-highlight-links','acc-no-anim','acc-hide-images',
      'acc-dys-dys','acc-dys-hyper',
      'acc-align-left','acc-align-center','acc-align-right',
      'acc-focus-mode','acc-reading-ruler'
    );
    if(settings.contrast==='light') html.classList.add('acc-contrast-light');
    if(settings.contrast==='smart') html.classList.add('acc-contrast-smart');
    if(settings.contrast==='dark') html.classList.add('acc-contrast-dark');
    if(settings.daltonic==='protanopia') html.classList.add('acc-daltonic-protanopia');
    if(settings.daltonic==='deuteranopia') html.classList.add('acc-daltonic-deuteranopia');
    if(settings.daltonic==='tritanopia') html.classList.add('acc-daltonic-tritanopia');
    if(settings.saturation==='low') html.classList.add('acc-saturate-low');
    if(settings.saturation==='high') html.classList.add('acc-saturate-high');
    if(settings.saturation==='desaturate') html.classList.add('acc-desaturate');
    if(settings.highlightLinks) html.classList.add('acc-highlight-links');
    if(settings.stopAnimations) html.classList.add('acc-no-anim');
    if(settings.hideImages) html.classList.add('acc-hide-images');
    if(settings.dyslexiaMode==='dys') html.classList.add('acc-dys-dys');
    if(settings.dyslexiaMode==='hyper') html.classList.add('acc-dys-hyper');
    if(settings.align==='left') html.classList.add('acc-align-left');
    else if(settings.align==='center') html.classList.add('acc-align-center');
    else if(settings.align==='right') html.classList.add('acc-align-right');
    if(settings.focusMode) html.classList.add('acc-focus-mode');

    let scale=settings.fontScale;
    let letter=settings.letterSpacing;
    let line=settings.lineHeight;
    if(settings.dyslexiaMode==='dys'){letter=Math.max(letter,1.2);line=Math.max(line,170)}
    if(settings.dyslexiaMode==='hyper'){letter=Math.max(letter,0.6);line=Math.max(line,160)}
    html.style.setProperty('--acc-font-scale',`${clamp(scale,80,200)}%`);
    html.style.setProperty('--acc-letter-spacing',`${clamp(letter,0,5)}px`);
    html.style.setProperty('--acc-line-height',line?(line/100).toFixed(2):'normal');

    const fab=$('#accFab');
    if(fab){fab.classList.toggle('hidden',settings.position==='hidden')}

    const ruler=$('#accReadingRuler');
    if(ruler) ruler.classList.toggle('on',settings.readingRuler);

    const skip=$('#accSkipBtn');
    if(skip) skip.style.display=settings.skipContent?'block':'none';

    save();
  }

  function speak(msg){
    if(!settings.voiceFeedback) return;
    try{const u=new SpeechSynthesisUtterance(msg);u.lang=(navigator.language||'es-ES').startsWith('es')?'es-ES':'es-419';u.rate=1.05;window.speechSynthesis.speak(u)}catch{}
  }

  let reading=false,paused=false;
  function ttsReadAll(){try{window.speechSynthesis.cancel()}catch{};const text=document.body?.innerText?.trim()||'';if(!text) return;const u=new SpeechSynthesisUtterance(text.slice(0,250000));u.lang=(navigator.language||'es-ES').startsWith('es')?'es-ES':'es-419';u.onend=()=>{reading=false;paused=false;syncTTS()};reading=true;paused=false;syncTTS();window.speechSynthesis.speak(u)}
  function ttsPause(){try{window.speechSynthesis.pause();paused=true;syncTTS()}catch{}}
  function ttsResume(){try{window.speechSynthesis.resume();paused=false;syncTTS()}catch{}}
  function ttsStop(){try{window.speechSynthesis.cancel();reading=false;paused=false;syncTTS()}catch{}}
  function syncTTS(){const p=$('#ttsPlay'),a=$('#ttsPause'),r=$('#ttsResume'),s=$('#ttsStop');if(!p) return;p.disabled=reading;a.disabled=(!reading||paused);r.disabled=!paused;s.disabled=!reading}

  function showOutline(){
    let o=$('#accOutline');
    if(!o){o=document.createElement('div');o.id='accOutline';o.innerHTML=`<h4>Estructura de la página</h4><ul></ul><div style="text-align:right;margin-top:12px;"><button class="acc-btn" id="accOutClose">Cerrar</button></div>`;document.body.appendChild(o);$('#accOutClose',o).addEventListener('click',()=>o.classList.remove('open'))}
    const ul=$('ul',o);ul.innerHTML='';const hs=$$('h1,h2,h3,h4,h5,h6');if(hs.length===0){ul.innerHTML='<li><span class="acc-note">No se detectaron encabezados.</span></li>'}else{hs.forEach(h=>{const a=document.createElement('a');a.textContent=`${h.tagName} — ${h.textContent.trim().slice(0,80)}`;a.href='#';a.addEventListener('click',e=>{e.preventDefault();h.scrollIntoView({behavior:'smooth',block:'start'})});const li=document.createElement('li');li.appendChild(a);ul.appendChild(li)})}
    o.classList.add('open')
  }

  function ensureRing(){
    if($('#accCursorRing')) return;
    const r=document.createElement('div');r.id='accCursorRing';document.body.appendChild(r);
    window.addEventListener('mousemove',e=>{const ring=$('#accCursorRing');if(!ring||!ring.classList.contains('on')) return;ring.style.transform=`translate(${e.clientX-22}px, ${e.clientY-22}px)`},{passive:true})
  }

  function initReadingRuler(){
    if($('#accReadingRuler')) return;
    const ruler=document.createElement('div');ruler.id='accReadingRuler';document.body.appendChild(ruler);
    window.addEventListener('mousemove',e=>{if(!settings.readingRuler) return;ruler.style.top=e.clientY+'px'},{passive:true});
  }

  function initSkipBtn(){
    if($('#accSkipBtn')) return;
    const btn=document.createElement('button');btn.id='accSkipBtn';btn.textContent='Saltar al contenido principal';
    btn.addEventListener('click',()=>{const main=$('main')||$('[role="main"]')||$('h1')||$('body');if(main){main.setAttribute('tabindex','-1');main.focus()}});
    document.body.insertBefore(btn,document.body.firstChild);
  }

  function initDraggableFab(fab){
    let isDragging=false, startX, startY, initLeft, initTop, moved=false;

    const savedPos=loadFabPos();
    if(savedPos){
      fab.style.left=clamp(savedPos.x,0,window.innerWidth-60)+'px';
      fab.style.top=clamp(savedPos.y,0,window.innerHeight-60)+'px';
      fab.style.bottom='auto';fab.style.right='auto';
    }

    function onStart(e){
      const touch=e.touches?e.touches[0]:e;
      isDragging=true; moved=false;
      startX=touch.clientX; startY=touch.clientY;
      const rect=fab.getBoundingClientRect();
      initLeft=rect.left; initTop=rect.top;
      fab.classList.add('dragging');
      fab.style.transition='box-shadow .1s,transform .1s';
      e.preventDefault();
    }
    function onMove(e){
      if(!isDragging) return;
      const touch=e.touches?e.touches[0]:e;
      const dx=touch.clientX-startX, dy=touch.clientY-startY;
      if(Math.abs(dx)>4||Math.abs(dy)>4) moved=true;
      const newL=clamp(initLeft+dx,0,window.innerWidth-60);
      const newT=clamp(initTop+dy,0,window.innerHeight-60);
      fab.style.left=newL+'px'; fab.style.top=newT+'px';
      fab.style.bottom='auto'; fab.style.right='auto';
      e.preventDefault();
    }
    function onEnd(e){
      if(!isDragging) return;
      isDragging=false;
      fab.classList.remove('dragging');
      fab.style.transition='box-shadow .2s ease';
      if(moved){
        const rect=fab.getBoundingClientRect();
        saveFabPos(rect.left,rect.top);
        fab._wasDragged=true;
        e.preventDefault();
        e.stopPropagation();
      } else {
        fab._wasDragged=false;
      }
    }

    fab.addEventListener('mousedown',onStart);
    window.addEventListener('mousemove',onMove,{passive:false});
    window.addEventListener('mouseup',onEnd);
    fab.addEventListener('touchstart',onStart,{passive:false});
    window.addEventListener('touchmove',onMove,{passive:false});
    window.addEventListener('touchend',onEnd);

    if(!localStorage.getItem('acc_fab_hint_shown')){
      const hint=document.createElement('div');hint.id='accFabHint';hint.textContent='Arrastra el boton donde quieras';document.body.appendChild(hint);
      const rect=fab.getBoundingClientRect();
      hint.style.left=(rect.right+8)+'px'; hint.style.top=rect.top+'px';
      setTimeout(()=>hint.classList.add('show'),500);
      setTimeout(()=>{hint.classList.remove('show');setTimeout(()=>hint.remove(),400)},3500);
      localStorage.setItem('acc_fab_hint_shown','1');
    }
  }

  function buildUI(){
    if(!$('#acc-widget-styles')){const st=document.createElement('style');st.id='acc-widget-styles';st.textContent=css;document.head.appendChild(st)}
    if(!$('#acc-svg-filters')){const svgs=`<svg style="display:none;"><filter id="protanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/></filter><filter id="deuteranopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/></filter><filter id="tritanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/></filter></svg>`;document.body.insertAdjacentHTML('beforeend',svgs)}

    const fab=document.createElement('button');fab.id='accFab';fab.setAttribute('aria-label','Abrir menu de accesibilidad');fab.innerHTML='<img src="IMAGENES/Cruzdevida.png" alt="Accesibilidad" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';document.body.appendChild(fab);
    initDraggableFab(fab);

    const overlay=document.createElement('div');overlay.id='accPanelOverlay';
    const panel=document.createElement('div');panel.id='accPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.innerHTML=`
      <header>
        <h3><i class="fas fa-universal-access" style="margin-right:8px"></i> Menu de Accesibilidad</h3>
        <button id="accClose" aria-label="Cerrar"><i class="fas fa-times"></i></button>
      </header>
      <div class="acc-body">
        <div class="acc-section">Opciones Visuales</div>
        <div class="acc-grid">
          <button class="acc-tile" id="contrastLight" aria-pressed="false">
            <div class="ico"><i class="fas fa-sun"></i></div><div>Contraste de luz</div>
          </button>
          <button class="acc-tile" id="contrastSmart" aria-pressed="false">
            <div class="ico"><i class="fas fa-sliders-h"></i></div><div>Contraste Inteligente</div>
          </button>
          <button class="acc-tile" id="contrastDark" aria-pressed="false">
            <div class="ico"><i class="fas fa-moon"></i></div><div>Modo oscuro</div>
          </button>
          <button class="acc-tile" id="highlight" aria-pressed="false">
            <div class="ico"><i class="fas fa-link"></i></div><div>Resaltar enlaces</div>
          </button>
          <button class="acc-tile" id="noAnim" aria-pressed="false">
            <div class="ico"><i class="fas fa-pause-circle"></i></div><div>Detener animaciones</div>
          </button>
          <button class="acc-tile" id="hideImg" aria-pressed="false">
            <div class="ico"><i class="fas fa-image"></i></div><div>Ocultar Imagenes</div>
          </button>
          <button class="acc-tile" id="cursor" aria-pressed="false">
            <div class="ico"><i class="fas fa-mouse-pointer"></i></div><div>Cursor grande</div>
          </button>
          <button class="acc-tile" id="focusMode" aria-pressed="false">
            <div class="ico"><i class="fas fa-crosshairs"></i></div><div>Modo enfoque</div>
          </button>
          <button class="acc-tile" id="readingRuler" aria-pressed="false">
            <div class="ico"><i class="fas fa-ruler-horizontal"></i></div><div>Regla de lectura</div>
          </button>
        </div>

        <div class="acc-section">Modos especiales</div>
        <div class="acc-grid">
          <div class="acc-tile" id="tile-daltonic" style="cursor:default">
            <div class="ico"><i class="fas fa-palette"></i></div><div>Modo daltonico</div>
            <div class="segmented" role="group" aria-label="Modo daltonico">
              <button type="button" class="seg" data-mode="protanopia">Protanopia</button>
              <button type="button" class="seg" data-mode="deuteranopia">Deuteranopia</button>
              <button type="button" class="seg" data-mode="tritanopia">Tritanopia</button>
              <button type="button" class="seg" data-mode="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-dys" style="cursor:default">
            <div class="ico"><i class="fas fa-book-open"></i></div><div>Apto para dislexia</div>
            <div class="segmented" role="group" aria-label="Modo dislexia">
              <button type="button" class="seg" data-mode="dys">OpenDyslexic</button>
              <button type="button" class="seg" data-mode="hyper">Alta legibilidad</button>
              <button type="button" class="seg" data-mode="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-align" style="cursor:default">
            <div class="ico"><i class="fas fa-align-left"></i></div><div>Alinear texto</div>
            <div class="segmented" role="group" aria-label="Alinear texto">
              <button type="button" class="seg" data-align="left">Izquierda</button>
              <button type="button" class="seg" data-align="center">Centrado</button>
              <button type="button" class="seg" data-align="right">Derecha</button>
              <button type="button" class="seg" data-align="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-saturation" style="cursor:default">
            <div class="ico"><i class="fas fa-tint"></i></div><div>Saturacion</div>
            <div class="segmented" role="group" aria-label="Saturacion">
              <button type="button" class="seg" data-saturate="low">Baja</button>
              <button type="button" class="seg" data-saturate="high">Alta</button>
              <button type="button" class="seg" data-saturate="desaturate">Desaturar</button>
              <button type="button" class="seg" data-saturate="off">Desactivar</button>
            </div>
          </div>
        </div>

        <div class="acc-section">Opciones de texto y contenido</div>
        <div class="acc-grid">
          <div class="acc-tile" id="font">
            <div class="ico"><i class="fas fa-text-height"></i></div><div>Agrandar texto</div>
            <input type="range" id="rng-font" min="80" max="200" step="1"><div class="acc-note" id="val-font"></div>
          </div>
          <div class="acc-tile" id="spacing">
            <div class="ico"><i class="fas fa-arrows-alt-h"></i></div><div>Espaciado de texto</div>
            <input type="range" id="rng-letter" min="0" max="5" step="0.1"><div class="acc-note" id="val-letter"></div>
          </div>
          <div class="acc-tile" id="lineHeight">
            <div class="ico"><i class="fas fa-arrows-alt-v"></i></div><div id="lbl-line">Altura de la linea</div>
            <input type="range" id="rng-line" min="100" max="250" step="5"><div class="acc-note" id="val-line"></div>
          </div>
          <button class="acc-tile" id="outline" aria-pressed="false">
            <div class="ico"><i class="fas fa-list-alt"></i></div><div>Estructura de la pagina</div>
          </button>
          <button class="acc-tile" id="skipContent" aria-pressed="false">
            <div class="ico"><i class="fas fa-forward"></i></div><div>Boton "Saltar contenido"</div>
          </button>
        </div>

        <div class="acc-section">Lectura y voz</div>
        <div class="acc-grid">
          <div class="acc-tile" id="tile-tts" style="grid-column:span 3; cursor:default">
            <div class="ico"><i class="fas fa-volume-up"></i></div><div>Leer pagina</div>
            <div class="acc-row" style="justify-content:center">
              <button class="acc-btn" id="ttsPlay">Leer</button>
              <button class="acc-btn" id="ttsPause">Pausar</button>
              <button class="acc-btn" id="ttsResume">Reanudar</button>
              <button class="acc-btn" id="ttsStop">Detener</button>
            </div>
          </div>
          <button class="acc-tile" id="info" aria-pressed="false" style="grid-column:span 3">
            <div class="ico"><i class="fas fa-microphone"></i></div><div>Narrador de acciones</div>
          </button>
        </div>

        <div class="acc-section">Posicion del boton</div>
        <div class="acc-note" style="margin-bottom:8px">Arrastra el boton flotante donde quieras. Tambien puedes usar los accesos rapidos:</div>
        <div class="acc-row" style="gap:8px;flex-wrap:wrap">
          <button class="acc-btn" id="snapTL"><i class="fas fa-arrow-up" style="transform:rotate(-45deg)"></i> Superior izq.</button>
          <button class="acc-btn" id="snapTR"><i class="fas fa-arrow-up" style="transform:rotate(45deg)"></i> Superior der.</button>
          <button class="acc-btn" id="snapBL"><i class="fas fa-arrow-down" style="transform:rotate(45deg)"></i> Inferior izq.</button>
          <button class="acc-btn" id="snapBR"><i class="fas fa-arrow-down" style="transform:rotate(-45deg)"></i> Inferior der.</button>
          <button class="acc-btn" id="snapHide"><i class="fas fa-eye-slash"></i> Ocultar</button>
          <button class="acc-btn" id="snapShow"><i class="fas fa-eye"></i> Mostrar</button>
        </div>

        <div class="acc-footer">
          <button class="acc-btn" id="accReset"><i class="fas fa-undo" style="margin-right:6px"></i> Restablecer configuraciones</button>
          <span class="acc-note">Se guardan automaticamente</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);document.body.appendChild(panel);

    const open=()=>{overlay.classList.add('open');panel.classList.add('open')};
    const close=()=>{overlay.classList.remove('open');panel.classList.remove('open')};

    fab.addEventListener('click',(e)=>{
      if(fab._wasDragged){fab._wasDragged=false;return}
      open();
    });

    fab.addEventListener('touchend',(e)=>{
      if(!fab._wasDragged){
        e.preventDefault();
        open();
      }
      fab._wasDragged=false;
    },{passive:false});

    fab.addEventListener('mousedown',()=>{fab._wasDragged=false});
    window.addEventListener('mousemove',()=>{if(fab.classList.contains('dragging')) fab._wasDragged=true},{passive:true});

    overlay.addEventListener('click',close);$('#accClose').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U')){e.preventDefault();open()}if(e.key==='Escape')close()});

    function snapFab(x,y){
      fab.style.left=x+'px'; fab.style.top=y+'px';
      fab.style.bottom='auto'; fab.style.right='auto';
      fab.classList.remove('hidden');
      settings.position='free';
      saveFabPos(x,y);
      apply();
    }
    $('#snapTL').addEventListener('click',()=>snapFab(20,20));
    $('#snapTR').addEventListener('click',()=>snapFab(window.innerWidth-76,20));
    $('#snapBL').addEventListener('click',()=>snapFab(20,window.innerHeight-76));
    $('#snapBR').addEventListener('click',()=>snapFab(window.innerWidth-76,window.innerHeight-76));
    $('#snapHide').addEventListener('click',()=>{settings.position='hidden';apply();speak('Boton oculto. Presiona Ctrl+U para reabrir el menu.')});
    $('#snapShow').addEventListener('click',()=>{settings.position='free';fab.classList.remove('hidden');apply();speak('Boton visible')});

    const f=$('#rng-font'),fv=$('#val-font');
    const ls=$('#rng-letter'),lsv=$('#val-letter');
    const ln=$('#rng-line'),lnv=$('#val-line'),lblLine=$('#lbl-line');

    f.addEventListener('input',()=>{settings.fontScale=+f.value;fv.textContent=settings.fontScale+'%';apply();speak('Tamano de fuente '+settings.fontScale+' por ciento')});
    ls.addEventListener('input',()=>{settings.letterSpacing=+ls.value;lsv.textContent=settings.letterSpacing+' px';apply();speak('Espaciado de texto '+settings.letterSpacing+' pixeles')});
    ln.addEventListener('input',()=>{settings.lineHeight=+ln.value;const x=(settings.lineHeight/100).toFixed(2)+'x';lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de la linea ('+x+')';apply();speak('Altura de linea '+x)});

    $('#contrastLight').addEventListener('click',()=>{settings.contrast=settings.contrast==='light'?null:'light';syncTiles();apply();speak('Contraste de luz '+(settings.contrast?'activado':'desactivado'))});
    $('#contrastSmart').addEventListener('click',()=>{settings.contrast=settings.contrast==='smart'?null:'smart';syncTiles();apply();speak('Contraste inteligente '+(settings.contrast?'activado':'desactivado'))});
    $('#contrastDark').addEventListener('click',()=>{settings.contrast=settings.contrast==='dark'?null:'dark';syncTiles();apply();speak('Modo oscuro '+(settings.contrast?'activado':'desactivado'))});
    $('#highlight').addEventListener('click',()=>{settings.highlightLinks=!settings.highlightLinks;syncTiles();apply();speak('Resaltar enlaces '+(settings.highlightLinks?'activado':'desactivado'))});
    $('#noAnim').addEventListener('click',()=>{settings.stopAnimations=!settings.stopAnimations;syncTiles();apply();speak('Detener animaciones '+(settings.stopAnimations?'activado':'desactivado'))});
    $('#hideImg').addEventListener('click',()=>{settings.hideImages=!settings.hideImages;syncTiles();apply();speak('Ocultar imagenes '+(settings.hideImages?'activado':'desactivado'))});
    $('#cursor').addEventListener('click',()=>{const ring=$('#accCursorRing');if(!ring) ensureRing();$('#accCursorRing').classList.toggle('on');syncTile('#cursor',$('#accCursorRing').classList.contains('on'));speak('Cursor destacado '+($('#accCursorRing').classList.contains('on')?'activado':'desactivado'))});
    $('#focusMode').addEventListener('click',()=>{settings.focusMode=!settings.focusMode;syncTiles();apply();speak('Modo enfoque '+(settings.focusMode?'activado':'desactivado'))});
    $('#readingRuler').addEventListener('click',()=>{settings.readingRuler=!settings.readingRuler;syncTiles();apply();speak('Regla de lectura '+(settings.readingRuler?'activada':'desactivada'))});
    $('#skipContent').addEventListener('click',()=>{settings.skipContent=!settings.skipContent;syncTiles();apply();speak('Boton saltar contenido '+(settings.skipContent?'activado':'desactivado'))});

    $$('#tile-dys .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      settings.dyslexiaMode = (mode === 'off' || settings.dyslexiaMode === mode) ? null : mode;
      speak(`Modo dislexia ${settings.dyslexiaMode||'desactivado'}`);
      syncTiles(); apply();
    })});
    $$('#tile-daltonic .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      settings.daltonic = (mode === 'off' || settings.daltonic === mode) ? null : mode;
      speak(`Modo daltonico ${settings.daltonic||'desactivado'}`);
      syncTiles(); apply();
    })});
    $$('#tile-align .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const align = btn.getAttribute('data-align');
      settings.align = (align === 'off' || settings.align === align) ? null : align;
      speak(`Alineacion ${settings.align||'desactivada'}`);
      syncTiles(); apply();
    })});
    $$('#tile-saturation .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const saturate = btn.getAttribute('data-saturate');
      settings.saturation = (saturate === 'off' || settings.saturation === saturate) ? null : saturate;
      speak(`Saturacion ${settings.saturation||'desactivada'}`);
      syncTiles(); apply();
    })});

    $('#info').addEventListener('click',()=>{settings.voiceFeedback=!settings.voiceFeedback;syncTiles();save();speak('Narrador de acciones '+(settings.voiceFeedback?'activado':'desactivado'))});
    $('#outline').addEventListener('click',()=>{showOutline();speak('Estructura de la pagina abierta')});
    $('#ttsPlay').addEventListener('click',ttsReadAll);
    $('#ttsPause').addEventListener('click',ttsPause);
    $('#ttsResume').addEventListener('click',ttsResume);
    $('#ttsStop').addEventListener('click',ttsStop);
    syncTTS();

    $('#accReset').addEventListener('click',()=>{
      settings={...defaults};
      localStorage.removeItem(LS_POS);
      fab.style.left='20px'; fab.style.top=''; fab.style.bottom='20px'; fab.style.right='auto';
      syncAll();apply();speak('Configuraciones restablecidas');
    });

    function syncTile(sel,on){const el=$(sel);if(!el) return;el.setAttribute('aria-pressed',!!on)}
    function syncTiles(){
      $('#contrastLight').setAttribute('aria-pressed',settings.contrast==='light');
      $('#contrastSmart').setAttribute('aria-pressed',settings.contrast==='smart');
      $('#contrastDark').setAttribute('aria-pressed',settings.contrast==='dark');
      $('#highlight').setAttribute('aria-pressed',settings.highlightLinks);
      $('#noAnim').setAttribute('aria-pressed',settings.stopAnimations);
      $('#hideImg').setAttribute('aria-pressed',settings.hideImages);
      $('#info').setAttribute('aria-pressed',settings.voiceFeedback);
      $('#focusMode').setAttribute('aria-pressed',settings.focusMode);
      $('#readingRuler').setAttribute('aria-pressed',settings.readingRuler);
      $('#skipContent').setAttribute('aria-pressed',settings.skipContent);
      syncTile('#cursor',$('#accCursorRing')?.classList.contains('on'));
      $('#tile-dys').setAttribute('aria-pressed',settings.dyslexiaMode!==null);
      $$('#tile-dys .seg').forEach(b=>b.classList.toggle('active',b.getAttribute('data-mode')===settings.dyslexiaMode));
      $('#tile-daltonic').setAttribute('aria-pressed',settings.daltonic!==null);
      $$('#tile-daltonic .seg').forEach(b=>b.classList.toggle('active',b.getAttribute('data-mode')===settings.daltonic));
      $('#tile-align').setAttribute('aria-pressed',settings.align!==null);
      $$('#tile-align .seg').forEach(b=>b.classList.toggle('active',b.getAttribute('data-align')===settings.align));
      $('#tile-saturation').setAttribute('aria-pressed',settings.saturation!==null);
      $$('#tile-saturation .seg').forEach(b=>b.classList.toggle('active',b.getAttribute('data-saturate')===settings.saturation));
    }
    function syncSliders(){
      f.value=settings.fontScale;fv.textContent=settings.fontScale+'%';
      ls.value=settings.letterSpacing;lsv.textContent=settings.letterSpacing+' px';
      ln.value=settings.lineHeight;lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de la linea ('+(settings.lineHeight/100).toFixed(2)+'x)';
      if(settings.dyslexiaMode==='dys'){ls.min=1.2;ln.min=170}
      else if(settings.dyslexiaMode==='hyper'){ls.min=0.6;ln.min=160}
      else{ls.min=0;ln.min=100}
    }
    function syncAll(){syncTiles();syncSliders();}
    ensureRing();initReadingRuler();initSkipBtn();syncAll();apply();
  }

  window.AccessibilityWidget={init(){buildUI()}};
  if(document.readyState!=='loading') window.AccessibilityWidget.init();
  else document.addEventListener('DOMContentLoaded',()=>window.AccessibilityWidget.init());
})();