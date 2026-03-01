(function(){
  if(window.AccessibilityWidget) return;
  const LS_KEY='acc_settings_v2_1';

  try{
    const s=JSON.parse(localStorage.getItem(LS_KEY)||'{}');
    if(s.position==='hidden'){s.position='free';localStorage.setItem(LS_KEY,JSON.stringify(s));}
  }catch{}

  const LS_POS='acc_fab_pos_v1';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

  const css=`
  :root{--acc-primary-100:#e8dcc5;--acc-primary-500:#c5a059;--acc-primary-600:#000831}
  #accFab{position:fixed;bottom:20px;left:20px;width:56px;height:56px;border-radius:999px;background:#000831;color:#fff;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 10px 25px rgba(0,0,0,.1),0 4px 10px rgba(0,0,0,.08);z-index:10050;cursor:grab;transition:box-shadow .2s ease;touch-action:none;user-select:none;}
  #accFab:hover{box-shadow:0 12px 30px rgba(0,0,0,.15),0 6px 12px rgba(0,0,0,.1);}
  #accFab.dragging{cursor:grabbing;box-shadow:0 20px 50px rgba(0,0,0,.3);transform:scale(1.1);transition:box-shadow .1s,transform .1s}
  #accFab.hidden{display:none}
  #accFab.narrator-on::before{content:'';position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:999px;background:#c5a059;border:2px solid #fff;}
  #accFabHint{position:fixed;background:rgba(0,0,0,.75);color:#fff;font-size:11px;padding:4px 8px;border-radius:6px;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .3s;z-index:10049}
  #accFabHint.show{opacity:1}
  #accPanelOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:10040;}
  #accPanelOverlay.open{display:block;}
  #accPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-48%);width:610px;max-width:calc(100% - 40px);background:#fff;color:#1c1917;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);z-index:10060;display:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;opacity:0;transition:transform .28s cubic-bezier(.34,1.56,.64,1),opacity .2s ease}
  #accPanel.open{display:block;opacity:1;transform:translate(-50%,-50%)}
  #accPanel header{padding:16px 20px;background:#000831;display:flex;align-items:center;justify-content:space-between;border-top-left-radius:18px;border-top-right-radius:18px;color:#fff}
  #accPanel header h3{margin:0;font-size:18px;font-weight:700}
  #accPanel header button{border:none;background:transparent;color:#fff;font-size:20px;cursor:pointer;padding:4px 9px;border-radius:6px;transition:background .2s;font-family:inherit}
  #accPanel header button:hover{background:rgba(255,255,255,.15)}
  #accPanel .acc-body{padding:20px;max-height:74vh;overflow-y:auto;overflow-x:hidden}
  .acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:13px}
  .acc-tile{position:relative;border:2px solid #e5e5e4;border-radius:14px;background:#f5f5f4;min-height:108px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:12px 10px;gap:6px;font-size:13px;cursor:pointer;user-select:none;transition:border-color .2s,box-shadow .2s,background .2s}
  .acc-tile .ico{font-size:22px;line-height:1;color:#000831}
  .acc-tile:hover{background:#fff;border-color:#c5a059}
  .acc-tile[aria-pressed="true"]{border:2px solid #c5a059;background:#e8dcc5;box-shadow:0 0 0 2px #c5a059 inset}
  .acc-tile[aria-pressed="true"]::after{content:"✓";position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:999px;background:#c5a059;color:#fff;font-size:13px;display:flex;align-items:center;justify-content:center;font-weight:bold}
  .acc-tile input[type="range"]{width:100%;accent-color:#c5a059}
  .acc-section{margin:16px 2px 9px;font-weight:700;font-size:12px;color:#000831;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #e5e5e4;padding-bottom:5px}
  .acc-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
  .acc-footer{display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid #e5e5e4}
  .acc-btn{padding:9px 13px;border-radius:10px;border:1px solid #e5e5e4;background:#fff;cursor:pointer;font-size:13px;transition:all .2s;font-family:inherit}
  .acc-btn:hover{background:#f5f5f4;border-color:#c5a059}
  .acc-note{font-size:11px;color:#78716c;line-height:1.3}
  .segmented{display:flex;gap:5px;width:100%;justify-content:center;flex-wrap:wrap;margin-top:4px}
  .segmented .seg{flex:1 1 auto;padding:6px 8px;border:1px solid #e5e5e4;border-radius:999px;background:#fff;cursor:pointer;font-size:11px;white-space:nowrap;transition:all .2s;font-family:inherit}
  .segmented .seg:hover{background:#f5f5f4}
  .segmented .seg.active{border:2px solid #c5a059;background:#e8dcc5;color:#000831;font-weight:600}

  /* ─── Efectos sobre la página real ─── */
  html.acc-contrast-light{filter:contrast(1.15) saturate(1.05)}
  html.acc-contrast-smart{filter:contrast(1.1) saturate(1.2) brightness(1.02)}
  html.acc-contrast-dark{filter:invert(1) hue-rotate(180deg)}
  html.acc-daltonic-protanopia{filter:url('#acc-protanopia')}
  html.acc-daltonic-deuteranopia{filter:url('#acc-deuteranopia')}
  html.acc-daltonic-tritanopia{filter:url('#acc-tritanopia')}
  html.acc-highlight-links a,html.acc-highlight-links [role="link"]{outline:2px dashed #c5a059!important;text-decoration:underline!important;outline-offset:2px!important}
  html.acc-no-anim *,html.acc-no-anim *::before,html.acc-no-anim *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
  html.acc-hide-images img,html.acc-hide-images picture,html.acc-hide-images video{visibility:hidden!important}
  html.acc-big-cursor,html.acc-big-cursor *{cursor:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M8 4L8 32L16 24L22 36L26 34L20 22L32 22Z' fill='%23000831' stroke='white' stroke-width='2'/%3E%3C/svg%3E") 4 4,auto!important}
  /* Modo texto alto contraste — afecta solo texto en la página */
  html.acc-text-contrast *:not(#accPanel):not(#accPanel *):not(#accFab):not(#accNarratorToast):not(#accOutlinePanel):not(#accOutlinePanel *){color:#000!important;background-color:#fff!important;border-color:#000!important;text-shadow:none!important}
  html.acc-text-contrast img,html.acc-text-contrast video{filter:none!important}
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
  html.acc-zoom-110{zoom:1.1}
  html.acc-zoom-125{zoom:1.25}
  html.acc-zoom-150{zoom:1.5}
  html.acc-spacing-plus p,html.acc-spacing-plus li,html.acc-spacing-plus td,html.acc-spacing-plus div{margin-bottom:1.3em!important;word-spacing:.16em!important}
  html.acc-ctl *{font-size:var(--acc-font-scale,100%);letter-spacing:var(--acc-letter-spacing,0px);line-height:var(--acc-line-height,normal)}
  #accPanel,#accPanel *{font-size:min(var(--acc-font-scale,100%),120%)!important;letter-spacing:min(var(--acc-letter-spacing,0px),2px)!important;line-height:min(var(--acc-line-height,normal),1.6)!important;}

  /* ─── Panel de estructura (lateral derecho) ─── */
  #accOutlinePanel{
    position:fixed;top:0;right:-340px;width:320px;height:100vh;
    background:#fff;border-left:1px solid #e5e5e4;
    box-shadow:-8px 0 32px rgba(0,0,0,.12);
    z-index:10070;display:flex;flex-direction:column;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;
    transition:right .3s cubic-bezier(.4,0,.2,1);
  }
  #accOutlinePanel.open{right:0}
  #accOutlinePanel .op-header{
    padding:16px 18px 14px;background:#000831;color:#fff;
    display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
  }
  #accOutlinePanel .op-header h4{margin:0;font-size:15px;font-weight:700;display:flex;align-items:center;gap:8px}
  #accOutlinePanel .op-header button{border:none;background:transparent;color:#fff;cursor:pointer;font-size:18px;padding:3px 7px;border-radius:5px;transition:background .2s;font-family:inherit}
  #accOutlinePanel .op-header button:hover{background:rgba(255,255,255,.15)}
  #accOutlinePanel .op-search{padding:12px 16px 8px;flex-shrink:0;border-bottom:1px solid #f0f0f0}
  #accOutlinePanel .op-search input{
    width:100%;padding:8px 12px;border:1.5px solid #e5e5e4;border-radius:9px;
    font-size:13px;font-family:inherit;outline:none;box-sizing:border-box;
    transition:border-color .2s;background:#f9f9f9;color:#1c1917;
  }
  #accOutlinePanel .op-search input:focus{border-color:#c5a059;background:#fff}
  #accOutlinePanel .op-stats{padding:8px 16px;font-size:11.5px;color:#78716c;flex-shrink:0;display:flex;gap:12px;border-bottom:1px solid #f0f0f0}
  #accOutlinePanel .op-stats span{display:flex;align-items:center;gap:4px}
  #accOutlinePanel .op-list{flex:1;overflow-y:auto;padding:8px 10px 16px}
  #accOutlinePanel .op-empty{padding:24px 16px;text-align:center;color:#78716c;font-size:13px}
  /* Items del árbol */
  .op-item{display:flex;align-items:flex-start;gap:0;margin:1px 0}
  .op-item a{
    display:flex;align-items:center;gap:8px;width:100%;
    text-decoration:none;padding:7px 10px;border-radius:8px;
    font-size:13px;color:#1c1917;transition:background .15s,color .15s;
    line-height:1.35;word-break:break-word;
  }
  .op-item a:hover{background:#f0ebe0;color:#000831}
  .op-item a.current{background:#e8dcc5;color:#000831;font-weight:600}
  .op-item .op-badge{
    flex-shrink:0;width:22px;height:18px;border-radius:4px;
    background:#000831;color:#fff;font-size:10px;font-weight:700;
    display:flex;align-items:center;justify-content:center;
    font-family:system-ui;letter-spacing:.5px;
  }
  /* Sangrías por nivel */
  .op-item.lv-1{margin-left:0}
  .op-item.lv-1 .op-badge{background:#000831}
  .op-item.lv-2{margin-left:12px}
  .op-item.lv-2 .op-badge{background:#2a3a70;font-size:9.5px}
  .op-item.lv-3{margin-left:24px}
  .op-item.lv-3 .op-badge{background:#c5a059;color:#000831;font-size:9px}
  .op-item.lv-4,.op-item.lv-5,.op-item.lv-6{margin-left:34px}
  .op-item.lv-4 .op-badge,.op-item.lv-5 .op-badge,.op-item.lv-6 .op-badge{background:#e5e5e4;color:#666;font-size:9px}
  .op-item.hidden-filter{display:none}
  /* Overlay para cerrar el panel lateral */
  #accOutlineOverlay{position:fixed;inset:0;z-index:10069;display:none}
  #accOutlineOverlay.open{display:block}

  /* Cursor ring */
  #accCursorRing{position:fixed;top:0;left:0;width:44px;height:44px;border:3px solid #c5a059;border-radius:999px;pointer-events:none;transform:translate(-200px,-200px);opacity:0;transition:opacity .2s;z-index:10080}
  #accCursorRing.on{opacity:.75}
  /* Reading ruler */
  #accReadingRuler{position:fixed;left:0;right:0;height:38px;background:rgba(197,160,89,.14);border-top:2px solid rgba(197,160,89,.5);border-bottom:2px solid rgba(197,160,89,.5);pointer-events:none;z-index:10045;display:none;transform:translateY(-50%)}
  #accReadingRuler.on{display:block}
  /* Narrador toast */
  #accNarratorToast{position:fixed;bottom:84px;left:16px;background:rgba(0,8,49,.92);color:#fff;font-size:12.5px;padding:9px 14px;border-radius:11px;pointer-events:none;opacity:0;transform:translateY(8px) scale(.97);transition:opacity .22s,transform .22s;z-index:10200;max-width:290px;line-height:1.45;backdrop-filter:blur(6px);box-shadow:0 4px 16px rgba(0,0,0,.25)}
  #accNarratorToast.show{opacity:1;transform:translateY(0) scale(1)}
  /* ═══════════ MÓVIL — bottom sheet + touch optimizado ═══════════ */
  @media(max-width:700px){
    /* FAB más grande y fácil de tocar */
    #accFab{width:62px;height:62px;bottom:16px;left:16px;}

    /* Panel como bottom sheet que sube desde abajo */
    #accPanel{
      top:auto !important;
      bottom:0 !important;
      left:0 !important;
      right:0 !important;
      width:100% !important;
      max-width:100% !important;
      transform:translateY(100%) !important;
      border-radius:20px 20px 0 0 !important;
      max-height:92vh !important;
      opacity:1 !important;
      transition:transform .32s cubic-bezier(.4,0,.2,1) !important;
    }
    #accPanel.open{
      transform:translateY(0) !important;
      display:flex !important;
      flex-direction:column !important;
    }
    /* Handle de arrastre visual */
    #accPanel header::before{
      content:'';display:block;position:absolute;top:8px;left:50%;
      transform:translateX(-50%);width:40px;height:4px;
      border-radius:2px;background:rgba(255,255,255,.35);
    }
    #accPanel header{position:relative;border-radius:20px 20px 0 0;}
    #accPanel .acc-body{
      flex:1;overflow-y:auto;overflow-x:hidden;
      -webkit-overflow-scrolling:touch;
      padding:16px 14px 32px;
      max-height:none !important;
    }
    /* Grid 2 columnas en móvil */
    .acc-grid{grid-template-columns:repeat(2,1fr);gap:10px;}
    /* Tiles más altos para touch */
    .acc-tile{min-height:96px;padding:14px 10px;gap:7px;font-size:14px;}
    .acc-tile .ico{font-size:24px;}
    /* Segmentados más grandes */
    .segmented .seg{padding:9px 10px;font-size:12px;}
    /* Botones más grandes */
    .acc-btn{padding:11px 14px;font-size:14px;}
    /* Ocultar sección de posición en móvil (no aplica igual) */
    .acc-section-pos,.acc-row-pos{display:none !important;}
    /* Footer compacto */
    .acc-footer{flex-direction:column;gap:8px;text-align:center;}
    /* Toast más alto desde el borde */
    #accNarratorToast{bottom:90px;left:12px;right:12px;max-width:none;font-size:13.5px;}

    /* Outline panel — ocupa toda la pantalla en móvil */
    #accOutlinePanel{
      width:100vw !important;
      right:-100vw !important;
      top:0 !important;
      height:100vh !important;
      height:100dvh !important;
    }
    #accOutlinePanel.open{right:0 !important;}
    #accOutlinePanel .op-search input{font-size:16px;} /* evita zoom en iOS */
    .op-item a{padding:11px 10px;font-size:14px;}
    .op-item .op-badge{width:26px;height:22px;font-size:11px;}

    /* Regla de lectura no tiene sentido en táctil */
    #accReadingRuler{display:none !important;}
    /* Cursor grande no aplica en táctil */
    html.acc-big-cursor,html.acc-big-cursor *{cursor:auto !important;}
  }
  /* Pantallas muy pequeñas */
  @media(max-width:380px){
    .acc-grid{grid-template-columns:repeat(2,1fr);}
    .acc-tile{min-height:88px;font-size:13px;}
    #accPanel header h3{font-size:16px;}
  }
  `;

  const defaults={
    contrast:null,daltonic:null,highlightLinks:false,
    stopAnimations:false,hideImages:false,dyslexiaMode:null,
    align:null,saturation:null,fontScale:100,letterSpacing:0,
    lineHeight:140,position:'free',voiceFeedback:false,
    readingRuler:false,bigCursor:false,zoomLevel:null,
    spacingPlus:false,textContrast:false
  };

  let settings=load();
  if(settings.position==='left'||settings.position==='right') settings.position='free';
  if(settings.position==='hidden') settings.position='free';
  save();

  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(LS_KEY)||'{}'))}catch{return{...defaults}}}
  function save(){localStorage.setItem(LS_KEY,JSON.stringify(settings))}
  function loadFabPos(){try{return JSON.parse(localStorage.getItem(LS_POS)||'null')}catch{return null}}
  function saveFabPos(x,y){localStorage.setItem(LS_POS,JSON.stringify({x,y}))}

  /* ══════════════ VOZ IA ══════════════ */
  let preferredVoice=null;
  function loadVoices(){
    const voices=window.speechSynthesis?window.speechSynthesis.getVoices():[];
    const prio=[
      v=>v.lang.startsWith('es')&&v.name.toLowerCase().includes('google'),
      v=>v.lang.startsWith('es')&&['paulina','monica','mónica','lucia','lucía','elena','laura','conchita','raquel','rocio','rocío','samira'].some(n=>v.name.toLowerCase().includes(n)),
      v=>v.lang.startsWith('es')&&!v.name.toLowerCase().includes('male'),
      v=>v.lang.startsWith('es'),
      v=>v.lang.startsWith('en')&&v.name.toLowerCase().includes('google'),
      v=>true
    ];
    for(const t of prio){const f=voices.find(t);if(f){preferredVoice=f;break;}}
  }
  if(window.speechSynthesis){loadVoices();window.speechSynthesis.onvoiceschanged=loadVoices;}

  function speak(text,interrupt=false){
    if(!window.speechSynthesis||!text) return;
    if(interrupt) window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text.trim().slice(0,220));
    if(preferredVoice) u.voice=preferredVoice;
    u.lang=preferredVoice?.lang||'es-ES';u.rate=1.08;u.pitch=1.05;u.volume=1;
    window.speechSynthesis.speak(u);
  }

  /* ══════════════ TOAST ══════════════ */
  let narratorToast=null,narratorTimer=null;
  function showToast(msg,icon=''){
    if(!narratorToast) return;
    narratorToast.textContent=(icon?icon+' ':'')+msg;
    narratorToast.classList.add('show');
    clearTimeout(narratorTimer);
    narratorTimer=setTimeout(()=>narratorToast.classList.remove('show'),2800);
  }

  /* ══════════════ NARRADOR ══════════════ */
  function getLabel(el){
    if(!el||el===document.body||el===document.documentElement) return '';
    const lbl=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();
    if(lbl) return lbl.slice(0,90);
    if(el.placeholder) return el.placeholder.slice(0,90);
    if(el.tagName==='IMG') return el.alt?el.alt.slice(0,90):'imagen';
    if(el.tagName==='SELECT'){const o=el.options[el.selectedIndex];return o?o.text.slice(0,90):'';}
    const txt=(el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();
    if(txt) return txt.slice(0,90);
    const map={A:'enlace',BUTTON:'botón',INPUT:'campo',TEXTAREA:'área de texto',SELECT:'selector',NAV:'navegación',HEADER:'encabezado',FOOTER:'pie de página',MAIN:'contenido principal',SECTION:'sección',ARTICLE:'artículo'};
    return map[el.tagName]||'';
  }
  function narratorClick(e){
    // En móvil el click se dispara igual tras touchend, pero capturamos ambos por si acaso
    const el=e.target;const lbl=getLabel(el);if(!lbl) return;
    // Ignorar el widget mismo
    if(el.closest('#accPanel,#accFab,#accPanelOverlay,#accNarratorToast,#accOutlinePanel,#accOutlineOverlay')) return;
    const tag=el.tagName.toUpperCase();let msg='';
    if(tag==='A') msg='Enlace: '+lbl;
    else if(tag==='BUTTON'||el.getAttribute('role')==='button') msg='Botón: '+lbl;
    else if(tag==='INPUT'){
      const t=el.type||'text';
      if(t==='checkbox') msg=lbl+': '+(el.checked?'activado':'desactivado');
      else if(t==='radio') msg='Opción seleccionada: '+lbl;
      else if(t==='submit'||t==='button') msg='Botón: '+lbl;
      else msg='Campo de texto: '+lbl;
    } else if(tag==='SELECT') msg='Selector: '+lbl;
    else if(tag==='IMG') msg='Imagen: '+lbl;
    else msg=lbl;
    if(msg){showToast(msg);speak(msg,true);}
  }
  function narratorFocus(e){
    const el=e.target;if(!el||el===document.body) return;
    if(el.closest('#accPanel,#accFab,#accOutlinePanel')) return;
    const interactive=['A','BUTTON','INPUT','SELECT','TEXTAREA'];
    if(!interactive.includes(el.tagName)&&!el.getAttribute('role')) return;
    const lbl=getLabel(el);if(!lbl) return;
    const msg='Enfocado: '+lbl;showToast(msg);speak(msg,false);
  }
  let narratorActive=false;
  function enableNarrator(){
    if(narratorActive) return;narratorActive=true;
    // click cubre tanto mouse como touch (el touch dispara click sintético)
    document.addEventListener('click',narratorClick,true);
    document.addEventListener('focusin',narratorFocus,true);
    const fab=$('#accFab');if(fab) fab.classList.add('narrator-on');
    speak('Narrador activado. Toca cualquier elemento para escuchar su descripción.',true);
    showToast('Narrador activado — funciona en toda la web');
  }
  function disableNarrator(){
    if(!narratorActive) return;narratorActive=false;
    document.removeEventListener('click',narratorClick,true);
    document.removeEventListener('focusin',narratorFocus,true);
    const fab=$('#accFab');if(fab) fab.classList.remove('narrator-on');
    if(narratorToast) narratorToast.classList.remove('show');
    window.speechSynthesis&&window.speechSynthesis.cancel();
  }

  /* ══════════════ TTS ══════════════ */
  let reading=false,paused=false;
  function ttsReadAll(){
    try{window.speechSynthesis.cancel()}catch{}
    const root=document.querySelector('main')||document.querySelector('[role="main"]')||document.body;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{
      acceptNode(n){
        return n.parentElement.closest('#accPanel,#accFab,#accNarratorToast,#accOutlinePanel,script,style,noscript')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
      }
    });
    let text='';while(walker.nextNode()) text+=' '+walker.currentNode.nodeValue;
    text=text.replace(/\s+/g,' ').trim();if(!text) return;
    const u=new SpeechSynthesisUtterance(text.slice(0,250000));
    if(preferredVoice) u.voice=preferredVoice;
    u.lang=preferredVoice?.lang||'es-ES';u.rate=1.05;u.pitch=1;
    u.onend=()=>{reading=false;paused=false;syncTTS();};
    reading=true;paused=false;syncTTS();
    window.speechSynthesis.speak(u);
  }
  function ttsPause(){try{window.speechSynthesis.pause();paused=true;syncTTS();}catch{}}
  function ttsResume(){try{window.speechSynthesis.resume();paused=false;syncTTS();}catch{}}
  function ttsStop(){try{window.speechSynthesis.cancel();reading=false;paused=false;syncTTS();}catch{}}
  function syncTTS(){
    const p=$('#ttsPlay'),a=$('#ttsPause'),r=$('#ttsResume'),s=$('#ttsStop');
    if(!p) return;
    p.disabled=reading;a.disabled=!reading||paused;r.disabled=!paused;s.disabled=!reading;
  }

  /* ══════════════ ESTRUCTURA DE PÁGINA — PANEL LATERAL ══════════════
     Se construye cada vez que se abre para reflejar el DOM actual.
     Filtra estrictamente elementos del widget.
  ══════════════════════════════════════════════════════════════════ */
  let outlinePanel=null,outlineOverlay=null;

  function buildOutlinePanel(){
    if($('#accOutlinePanel')) return; // ya existe

    // Overlay para cerrar al clicar fuera
    outlineOverlay=document.createElement('div');
    outlineOverlay.id='accOutlineOverlay';
    outlineOverlay.addEventListener('click',closeOutline);
    document.body.appendChild(outlineOverlay);

    outlinePanel=document.createElement('div');
    outlinePanel.id='accOutlinePanel';
    outlinePanel.setAttribute('role','navigation');
    outlinePanel.setAttribute('aria-label','Estructura de la página');
    outlinePanel.innerHTML=`
      <div class="op-header">
        <h4><i class="fas fa-stream"></i> Estructura de la página</h4>
        <button id="accOutClose" aria-label="Cerrar"><i class="fas fa-times"></i></button>
      </div>
      <div class="op-search">
        <input type="text" id="accOutSearch" placeholder="Buscar sección..." autocomplete="off" spellcheck="false">
      </div>
      <div class="op-stats" id="accOutStats"></div>
      <div class="op-list" id="accOutList"></div>
    `;
    document.body.appendChild(outlinePanel);
    $('#accOutClose',outlinePanel).addEventListener('click',closeOutline);
    $('#accOutSearch',outlinePanel).addEventListener('input',filterOutline);
  }

  function openOutline(){
    buildOutlinePanel();
    populateOutline();
    outlineOverlay.classList.add('open');
    // Pequeño delay para que la transición CSS funcione
    requestAnimationFrame(()=>requestAnimationFrame(()=>outlinePanel.classList.add('open')));
    const search=$('#accOutSearch');if(search) search.value='';
    filterOutline();
  }

  function closeOutline(){
    if(outlinePanel) outlinePanel.classList.remove('open');
    if(outlineOverlay) outlineOverlay.classList.remove('open');
  }

  // IDs exclusivos del widget — para filtrarlos del índice
  const WIDGET_IDS=['accPanel','accFab','accPanelOverlay','accOutlinePanel','accOutlineOverlay','accNarratorToast','accCursorRing','accReadingRuler','accFabHint','acc-widget-styles','acc-svg-filters-wrap'];

  function isWidgetEl(el){
    return WIDGET_IDS.some(id=>el.id===id||el.closest('#'+id));
  }

  function populateOutline(){
    const list=$('#accOutList');
    const stats=$('#accOutStats');
    if(!list||!stats) return;

    // Recoger todos los h1-h6 de la página real
    const allH=Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6'));
    const headings=allH.filter(h=>!isWidgetEl(h));

    // Estadísticas
    const counts={h1:0,h2:0,h3:0};
    headings.forEach(h=>{
      const lv=h.tagName.toLowerCase();
      if(counts[lv]!==undefined) counts[lv]++;
    });
    stats.innerHTML=`
      <span><i class="fas fa-heading" style="font-size:10px;opacity:.6"></i> ${headings.length} título${headings.length!==1?'s':''}</span>
      ${counts.h1?`<span>H1: ${counts.h1}</span>`:''}
      ${counts.h2?`<span>H2: ${counts.h2}</span>`:''}
      ${counts.h3?`<span>H3+: ${headings.length-counts.h1-counts.h2}</span>`:''}
    `;

    if(!headings.length){
      list.innerHTML=`<div class="op-empty"><i class="fas fa-info-circle" style="display:block;font-size:28px;margin-bottom:8px;opacity:.35"></i>No se encontraron títulos en esta página.</div>`;
      return;
    }

    list.innerHTML='';
    headings.forEach((h,idx)=>{
      const level=parseInt(h.tagName[1]);
      const rawText=h.textContent||'';
      // Limpiar texto: quitar exceso de espacios/saltos
      const txt=rawText.replace(/\s+/g,' ').trim();
      if(!txt) return; // saltar vacíos silenciosamente

      const item=document.createElement('div');
      item.className=`op-item lv-${level}`;
      item.dataset.text=txt.toLowerCase();

      const a=document.createElement('a');
      a.href='#';

      const badge=document.createElement('span');
      badge.className='op-badge';
      badge.textContent='H'+level;

      const label=document.createElement('span');
      label.textContent=txt.slice(0,80)+(txt.length>80?'…':'');
      label.style.flex='1';

      a.appendChild(badge);a.appendChild(label);

      a.addEventListener('click',e=>{
        e.preventDefault();
        // Quitar current de todos
        $$('.op-item a.current',outlinePanel).forEach(el=>el.classList.remove('current'));
        a.classList.add('current');
        // Scroll suave a la sección
        h.scrollIntoView({behavior:'smooth',block:'center'});
        // Resaltar brevemente
        const prevOutline=h.style.outline;const prevOffset=h.style.outlineOffset;
        h.style.outline='3px solid #c5a059';h.style.outlineOffset='5px';
        setTimeout(()=>{h.style.outline=prevOutline;h.style.outlineOffset=prevOffset;},1800);
        // Narrar si está activo
        if(narratorActive) speak('Navegando a: '+txt,true);
        // No cerrar el panel — el usuario puede seguir navegando
      });

      item.appendChild(a);
      list.appendChild(item);
    });
  }

  function filterOutline(){
    const q=($('#accOutSearch')?.value||'').toLowerCase().trim();
    $$('.op-item',outlinePanel||document).forEach(item=>{
      if(!q){item.classList.remove('hidden-filter');return;}
      item.classList.toggle('hidden-filter',!item.dataset.text.includes(q));
    });
  }

  /* ══════════════ APPLY ══════════════ */
  function apply(){
    const html=document.documentElement;
    html.classList.remove(
      'acc-contrast-light','acc-contrast-smart','acc-contrast-dark',
      'acc-daltonic-protanopia','acc-daltonic-deuteranopia','acc-daltonic-tritanopia',
      'acc-saturate-low','acc-saturate-high','acc-desaturate',
      'acc-highlight-links','acc-no-anim','acc-hide-images',
      'acc-dys-dys','acc-dys-hyper',
      'acc-align-left','acc-align-center','acc-align-right',
      'acc-big-cursor','acc-spacing-plus','acc-text-contrast',
      'acc-zoom-110','acc-zoom-125','acc-zoom-150'
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
    if(settings.bigCursor) html.classList.add('acc-big-cursor');
    if(settings.spacingPlus) html.classList.add('acc-spacing-plus');
    if(settings.textContrast) html.classList.add('acc-text-contrast');
    if(settings.zoomLevel) html.classList.add('acc-zoom-'+settings.zoomLevel);
    if(settings.dyslexiaMode==='dys') html.classList.add('acc-dys-dys');
    if(settings.dyslexiaMode==='hyper') html.classList.add('acc-dys-hyper');
    if(settings.align==='left') html.classList.add('acc-align-left');
    else if(settings.align==='center') html.classList.add('acc-align-center');
    else if(settings.align==='right') html.classList.add('acc-align-right');

    let sc=settings.fontScale,lt=settings.letterSpacing,ln=settings.lineHeight;
    if(settings.dyslexiaMode==='dys'){lt=Math.max(lt,1.2);ln=Math.max(ln,170);}
    if(settings.dyslexiaMode==='hyper'){lt=Math.max(lt,.6);ln=Math.max(ln,160);}
    html.style.setProperty('--acc-font-scale',`${clamp(sc,80,200)}%`);
    html.style.setProperty('--acc-letter-spacing',`${clamp(lt,0,5)}px`);
    html.style.setProperty('--acc-line-height',ln?(ln/100).toFixed(2):'normal');
    html.classList.toggle('acc-ctl',sc!==100||lt!==0||ln!==140);

    const fab=$('#accFab');
    if(fab){
      const hs=sessionStorage.getItem('acc_hidden_session')==='1';
      fab.classList.toggle('hidden',settings.position==='hidden'&&hs);
      if(!hs&&settings.position==='hidden') settings.position='free';
    }
    const ruler=$('#accReadingRuler');
    if(ruler) ruler.classList.toggle('on',settings.readingRuler);
    save();
  }

  /* ══════════════ DOM HELPERS ══════════════ */
  function ensureRing(){
    if($('#accCursorRing')) return;
    const r=document.createElement('div');r.id='accCursorRing';document.body.appendChild(r);
    window.addEventListener('mousemove',e=>{
      const rr=$('#accCursorRing');if(!rr||!rr.classList.contains('on')) return;
      rr.style.transform=`translate(${e.clientX-22}px,${e.clientY-22}px)`;
    },{passive:true});
  }
  function initReadingRuler(){
    if($('#accReadingRuler')) return;
    const r=document.createElement('div');r.id='accReadingRuler';document.body.appendChild(r);
    window.addEventListener('mousemove',e=>{if(settings.readingRuler) r.style.top=e.clientY+'px';},{passive:true});
  }
  function initNarratorToast(){
    if($('#accNarratorToast')) return;
    narratorToast=document.createElement('div');narratorToast.id='accNarratorToast';
    document.body.appendChild(narratorToast);
  }

  /* ══════════════ FAB DRAG ══════════════ */
  function initDraggableFab(fab){
    let drag=false,sx,sy,il,it,moved=false,dragThreshold=8;
    const isMobile=()=>window.innerWidth<=700||('ontouchstart' in window);
    const sp=loadFabPos();
    if(sp){
      // En móvil asegurar que esté dentro de la pantalla actual
      const maxX=window.innerWidth-66,maxY=window.innerHeight-66;
      fab.style.left=clamp(sp.x,8,maxX)+'px';
      fab.style.top=clamp(sp.y,8,maxY)+'px';
      fab.style.bottom='auto';fab.style.right='auto';
    }
    function onS(e){
      const t=e.touches?e.touches[0]:e;
      drag=true;moved=false;sx=t.clientX;sy=t.clientY;
      const r=fab.getBoundingClientRect();il=r.left;it=r.top;
      fab.classList.add('dragging');fab.style.transition='none';
      // En móvil solo prevenimos default si realmente vamos a arrastrar
      if(!isMobile()) e.preventDefault();
    }
    function onM(e){
      if(!drag) return;
      const t=e.touches?e.touches[0]:e;
      const dx=t.clientX-sx,dy=t.clientY-sy;
      if(Math.abs(dx)>dragThreshold||Math.abs(dy)>dragThreshold){
        moved=true;
        e.preventDefault(); // solo prevenimos scroll cuando ya está arrastrando
      }
      if(!moved) return;
      const maxX=window.innerWidth-(isMobile()?66:60);
      const maxY=window.innerHeight-(isMobile()?66:60);
      fab.style.left=clamp(il+dx,8,maxX)+'px';
      fab.style.top=clamp(it+dy,8,maxY)+'px';
      fab.style.bottom='auto';fab.style.right='auto';
    }
    function onE(e){
      if(!drag) return;drag=false;
      fab.classList.remove('dragging');fab.style.transition='box-shadow .2s ease';
      if(moved){
        // Snap a bordes en móvil para que no quede en medio
        if(isMobile()){
          const r=fab.getBoundingClientRect();
          const cx=r.left+r.width/2;
          const snapX=cx<window.innerWidth/2?8:window.innerWidth-r.width-8;
          fab.style.left=snapX+'px';
          saveFabPos(snapX,r.top);
        } else {
          const r=fab.getBoundingClientRect();saveFabPos(r.left,r.top);
        }
        fab._wd=true;e.preventDefault();e.stopPropagation();
      } else fab._wd=false;
    }
    fab.addEventListener('mousedown',onS);
    window.addEventListener('mousemove',onM,{passive:false});
    window.addEventListener('mouseup',onE);
    fab.addEventListener('touchstart',onS,{passive:true}); // passive:true para no bloquear scroll hasta confirmar drag
    window.addEventListener('touchmove',onM,{passive:false});
    window.addEventListener('touchend',onE);
    // Reposicionar al rotar pantalla
    window.addEventListener('resize',()=>{
      const r=fab.getBoundingClientRect();
      const maxX=window.innerWidth-66,maxY=window.innerHeight-66;
      if(r.left>maxX) fab.style.left=maxX+'px';
      if(r.top>maxY) fab.style.top=maxY+'px';
    });
    if(!localStorage.getItem('acc_fab_hint_shown')){
      const h=document.createElement('div');h.id='accFabHint';
      h.textContent=isMobile()?'Mantén presionado para mover':'Arrastra el botón donde quieras';
      document.body.appendChild(h);
      const r=fab.getBoundingClientRect();
      h.style.left=(r.right+8)+'px';h.style.top=r.top+'px';
      setTimeout(()=>h.classList.add('show'),500);
      setTimeout(()=>{h.classList.remove('show');setTimeout(()=>h.remove(),400);},3500);
      localStorage.setItem('acc_fab_hint_shown','1');
    }
  }

  /* ══════════════ BUILD UI ══════════════ */
  function buildUI(){
    if(!$('#acc-widget-styles')){const s=document.createElement('style');s.id='acc-widget-styles';s.textContent=css;document.head.appendChild(s);}
    if(!$('#acc-svg-filters-wrap')){
      const w=document.createElement('div');w.id='acc-svg-filters-wrap';w.style.cssText='display:none;position:absolute;width:0;height:0;overflow:hidden';
      w.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg"><defs>
        <filter id="acc-protanopia"><feColorMatrix type="matrix" values="0.567,0.433,0,0,0,0.558,0.442,0,0,0,0,0.242,0.758,0,0,0,0,0,1,0"/></filter>
        <filter id="acc-deuteranopia"><feColorMatrix type="matrix" values="0.625,0.375,0,0,0,0.7,0.3,0,0,0,0,0.3,0.7,0,0,0,0,0,1,0"/></filter>
        <filter id="acc-tritanopia"><feColorMatrix type="matrix" values="0.95,0.05,0,0,0,0,0.433,0.567,0,0,0,0,0.475,0.525,0,0,0,0,0,1,0"/></filter>
      </defs></svg>`;
      document.body.appendChild(w);
    }

    const fab=document.createElement('button');fab.id='accFab';fab.setAttribute('aria-label','Abrir menú de accesibilidad');
    fab.innerHTML='<img src="IMAGENES/Cruzdevida.png" alt="Accesibilidad" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';
    document.body.appendChild(fab);initDraggableFab(fab);

    const overlay=document.createElement('div');overlay.id='accPanelOverlay';
    const panel=document.createElement('div');panel.id='accPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');

    panel.innerHTML=`
    <header>
      <h3><i class="fas fa-universal-access" style="margin-right:8px"></i>Menú de Accesibilidad</h3>
      <button id="accClose" aria-label="Cerrar">✕</button>
    </header>
    <div class="acc-body">

      <div class="acc-section">Visión y color</div>
      <div class="acc-grid">
        <button class="acc-tile" id="contrastLight" aria-pressed="false">
          <div class="ico"><i class="fas fa-sun"></i></div><div>Contraste luz</div>
        </button>
        <button class="acc-tile" id="contrastSmart" aria-pressed="false">
          <div class="ico"><i class="fas fa-sliders-h"></i></div><div>Contraste inteligente</div>
        </button>
        <button class="acc-tile" id="contrastDark" aria-pressed="false">
          <div class="ico"><i class="fas fa-moon"></i></div><div>Modo oscuro</div>
        </button>
        <button class="acc-tile" id="textContrast" aria-pressed="false">
          <div class="ico"><i class="fas fa-font"></i></div><div>Texto alto contraste</div>
          <div class="acc-note">Negro sobre blanco</div>
        </button>
        <button class="acc-tile" id="highlight" aria-pressed="false">
          <div class="ico"><i class="fas fa-link"></i></div><div>Resaltar enlaces</div>
        </button>
        <button class="acc-tile" id="hideImg" aria-pressed="false">
          <div class="ico"><i class="fas fa-image"></i></div><div>Ocultar imágenes</div>
        </button>
        <div class="acc-tile" id="tile-saturation" style="cursor:default">
          <div class="ico"><i class="fas fa-tint"></i></div><div>Saturación</div>
          <div class="segmented">
            <button type="button" class="seg" data-saturate="low">Baja</button>
            <button type="button" class="seg" data-saturate="high">Alta</button>
            <button type="button" class="seg" data-saturate="desaturate">Sin color</button>
            <button type="button" class="seg" data-saturate="off">✕</button>
          </div>
        </div>
        <div class="acc-tile" id="tile-daltonic" style="cursor:default;grid-column:span 2">
          <div class="ico"><i class="fas fa-palette"></i></div><div>Modo daltónico</div>
          <div class="segmented">
            <button type="button" class="seg" data-mode="protanopia">Protanopia</button>
            <button type="button" class="seg" data-mode="deuteranopia">Deuteranopia</button>
            <button type="button" class="seg" data-mode="tritanopia">Tritanopia</button>
            <button type="button" class="seg" data-mode="off">✕ Desactivar</button>
          </div>
        </div>
      </div>

      <div class="acc-section">Navegación y movilidad</div>
      <div class="acc-grid">
        <button class="acc-tile" id="noAnim" aria-pressed="false">
          <div class="ico"><i class="fas fa-pause-circle"></i></div><div>Detener animaciones</div>
        </button>
        <button class="acc-tile" id="cursor" aria-pressed="false">
          <div class="ico"><i class="fas fa-mouse-pointer"></i></div><div>Cursor grande</div>
        </button>
        <button class="acc-tile" id="readingRuler" aria-pressed="false">
          <div class="ico"><i class="fas fa-ruler-horizontal"></i></div><div>Regla de lectura</div>
        </button>
        <button class="acc-tile" id="outlineBtn">
          <div class="ico"><i class="fas fa-stream"></i></div><div>Estructura de la página</div>
          <div class="acc-note">Índice de secciones</div>
        </button>
        <div class="acc-tile" id="tile-zoom" style="cursor:default;grid-column:span 2">
          <div class="ico"><i class="fas fa-search-plus"></i></div><div>Zoom de página</div>
          <div class="segmented">
            <button type="button" class="seg" data-zoom="110">110%</button>
            <button type="button" class="seg" data-zoom="125">125%</button>
            <button type="button" class="seg" data-zoom="150">150%</button>
            <button type="button" class="seg" data-zoom="off">✕ Normal</button>
          </div>
        </div>
      </div>

      <div class="acc-section">Texto y lectura</div>
      <div class="acc-grid">
        <button class="acc-tile" id="spacingPlus" aria-pressed="false">
          <div class="ico"><i class="fas fa-text-width"></i></div><div>Más espacio entre párrafos</div>
        </button>
        <div class="acc-tile" id="tile-dys" style="cursor:default;grid-column:span 2">
          <div class="ico"><i class="fas fa-book-open"></i></div><div>Fuente para dislexia</div>
          <div class="segmented">
            <button type="button" class="seg" data-mode="dys">OpenDyslexic</button>
            <button type="button" class="seg" data-mode="hyper">Alta legibilidad</button>
            <button type="button" class="seg" data-mode="off">✕ Normal</button>
          </div>
        </div>
        <div class="acc-tile" style="cursor:default">
          <div class="ico"><i class="fas fa-text-height"></i></div><div>Tamaño de texto</div>
          <input type="range" id="rng-font" min="80" max="200" step="1">
          <div class="acc-note" id="val-font">100%</div>
        </div>
        <div class="acc-tile" style="cursor:default">
          <div class="ico"><i class="fas fa-arrows-alt-h"></i></div><div>Espaciado letras</div>
          <input type="range" id="rng-letter" min="0" max="5" step="0.1">
          <div class="acc-note" id="val-letter">0 px</div>
        </div>
        <div class="acc-tile" style="cursor:default">
          <div class="ico"><i class="fas fa-arrows-alt-v"></i></div><div id="lbl-line">Altura de línea</div>
          <input type="range" id="rng-line" min="100" max="250" step="5">
          <div class="acc-note" id="val-line">140%</div>
        </div>
        <div class="acc-tile" id="tile-align" style="cursor:default;grid-column:span 3">
          <div class="ico"><i class="fas fa-align-left"></i></div><div>Alineación del texto</div>
          <div class="segmented">
            <button type="button" class="seg" data-align="left">Izquierda</button>
            <button type="button" class="seg" data-align="center">Centrado</button>
            <button type="button" class="seg" data-align="right">Derecha</button>
            <button type="button" class="seg" data-align="off">✕ Normal</button>
          </div>
        </div>
      </div>

      <div class="acc-section">Voz y narración</div>
      <div class="acc-grid">
        <div class="acc-tile" style="grid-column:span 2;cursor:default">
          <div class="ico"><i class="fas fa-volume-up"></i></div>
          <div>Leer página en voz alta</div>
          <div class="acc-row" style="justify-content:center;margin-top:5px">
            <button class="acc-btn" id="ttsPlay">&#9654; Leer</button>
            <button class="acc-btn" id="ttsPause">&#9646;&#9646;</button>
            <button class="acc-btn" id="ttsResume">&#9654; Reanudar</button>
            <button class="acc-btn" id="ttsStop">&#9646;&#9646;&#9646;</button>
          </div>
        </div>
        <button class="acc-tile" id="info" aria-pressed="false">
          <div class="ico"><i class="fas fa-microphone"></i></div>
          <div>Narrador de acciones</div>
          <div class="acc-note">Voz IA — toda la web</div>
        </button>
      </div>

      <div class="acc-section acc-section-pos">Posición del botón flotante</div>
      <div class="acc-row acc-row-pos" style="gap:7px;flex-wrap:wrap;margin-bottom:4px">
        <button class="acc-btn" id="snapTL"><i class="fas fa-arrow-up" style="transform:rotate(-45deg);display:inline-block"></i> Sup. izq.</button>
        <button class="acc-btn" id="snapTR"><i class="fas fa-arrow-up" style="transform:rotate(45deg);display:inline-block"></i> Sup. der.</button>
        <button class="acc-btn" id="snapBL"><i class="fas fa-arrow-down" style="transform:rotate(45deg);display:inline-block"></i> Inf. izq.</button>
        <button class="acc-btn" id="snapBR"><i class="fas fa-arrow-down" style="transform:rotate(-45deg);display:inline-block"></i> Inf. der.</button>
        <button class="acc-btn" id="snapHide"><i class="fas fa-eye-slash"></i> Ocultar</button>
        <button class="acc-btn" id="snapShow"><i class="fas fa-eye"></i> Mostrar</button>
      </div>

      <div class="acc-footer">
        <button class="acc-btn" id="accReset"><i class="fas fa-undo" style="margin-right:5px"></i>Restablecer todo</button>
        <span class="acc-note">Configuración guardada · Ctrl+U para abrir</span>
      </div>
    </div>`;

    document.body.appendChild(overlay);document.body.appendChild(panel);

    /* Abrir / Cerrar panel principal */
    const isMobile=()=>window.innerWidth<=700;
    const openPanel=()=>{
      overlay.classList.add('open');
      panel.style.display='block';
      if(isMobile()) panel.style.display='flex';
      panel.getBoundingClientRect();
      panel.classList.add('open');
    };
    const closePanel=()=>{
      overlay.classList.remove('open');
      panel.classList.remove('open');
      panel.addEventListener('transitionend',()=>{
        if(!panel.classList.contains('open')) panel.style.display='none';
      },{once:true});
    };

    // Swipe hacia abajo para cerrar en móvil
    let swipeStartY=0,swipeStarted=false;
    panel.addEventListener('touchstart',e=>{
      const bodyEl=panel.querySelector('.acc-body');
      // Solo iniciar swipe si el scroll del body está en el tope
      if(bodyEl&&bodyEl.scrollTop>0) return;
      swipeStartY=e.touches[0].clientY;swipeStarted=true;
    },{passive:true});
    panel.addEventListener('touchmove',e=>{
      if(!swipeStarted) return;
      const dy=e.touches[0].clientY-swipeStartY;
      if(dy>60){closePanel();swipeStarted=false;}
    },{passive:true});
    panel.addEventListener('touchend',()=>{swipeStarted=false;},{passive:true});
    fab.addEventListener('click',()=>{if(fab._wd){fab._wd=false;return;} openPanel();});
    fab.addEventListener('touchend',e=>{if(!fab._wd){e.preventDefault();openPanel();}fab._wd=false;},{passive:false});
    fab.addEventListener('mousedown',()=>{fab._wd=false;});
    window.addEventListener('mousemove',()=>{if(fab.classList.contains('dragging')) fab._wd=true;},{passive:true});
    overlay.addEventListener('click',closePanel);
    $('#accClose').addEventListener('click',closePanel);
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U')){e.preventDefault();openPanel();}
      if(e.key==='Escape'){closePanel();closeOutline();}
    });

    /* Snaps */
    function snapFab(x,y){fab.style.left=x+'px';fab.style.top=y+'px';fab.style.bottom='auto';fab.style.right='auto';fab.classList.remove('hidden');settings.position='free';saveFabPos(x,y);apply();}
    $('#snapTL').addEventListener('click',()=>snapFab(20,20));
    $('#snapTR').addEventListener('click',()=>snapFab(window.innerWidth-76,20));
    $('#snapBL').addEventListener('click',()=>snapFab(20,window.innerHeight-76));
    $('#snapBR').addEventListener('click',()=>snapFab(window.innerWidth-76,window.innerHeight-76));
    $('#snapHide').addEventListener('click',()=>{settings.position='hidden';sessionStorage.setItem('acc_hidden_session','1');apply();});
    $('#snapShow').addEventListener('click',()=>{settings.position='free';sessionStorage.removeItem('acc_hidden_session');fab.classList.remove('hidden');apply();});

    /* Sliders */
    const f=$('#rng-font'),fv=$('#val-font'),ls=$('#rng-letter'),lsv=$('#val-letter'),ln=$('#rng-line'),lnv=$('#val-line'),lblLine=$('#lbl-line');
    f.addEventListener('input',()=>{settings.fontScale=+f.value;fv.textContent=settings.fontScale+'%';apply();});
    ls.addEventListener('input',()=>{settings.letterSpacing=+ls.value;lsv.textContent=settings.letterSpacing+' px';apply();});
    ln.addEventListener('input',()=>{settings.lineHeight=+ln.value;lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de línea ('+(settings.lineHeight/100).toFixed(2)+'x)';apply();});

    /* Tiles toggle */
    function tile(id,fn){const el=$(id);if(!el) return;el.addEventListener('click',()=>{fn();syncTiles();apply();});}
    tile('#contrastLight',()=>settings.contrast=settings.contrast==='light'?null:'light');
    tile('#contrastSmart',()=>settings.contrast=settings.contrast==='smart'?null:'smart');
    tile('#contrastDark',()=>settings.contrast=settings.contrast==='dark'?null:'dark');
    tile('#textContrast',()=>{settings.textContrast=!settings.textContrast;if(settings.textContrast) speak('Texto en alto contraste activado.');});
    tile('#highlight',()=>settings.highlightLinks=!settings.highlightLinks);
    tile('#noAnim',()=>settings.stopAnimations=!settings.stopAnimations);
    tile('#hideImg',()=>settings.hideImages=!settings.hideImages);
    tile('#spacingPlus',()=>settings.spacingPlus=!settings.spacingPlus);
    tile('#readingRuler',()=>settings.readingRuler=!settings.readingRuler);
    tile('#cursor',()=>{settings.bigCursor=!settings.bigCursor;const ring=$('#accCursorRing');if(!ring) ensureRing();$('#accCursorRing').classList.toggle('on',settings.bigCursor);});

    /* Estructura de página */
    $('#outlineBtn').addEventListener('click',()=>{openOutline();});

    /* Segmentados */
    $$('#tile-dys .seg').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;settings.dyslexiaMode=(m==='off'||settings.dyslexiaMode===m)?null:m;syncTiles();apply();}));
    $$('#tile-daltonic .seg').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.mode;settings.daltonic=(m==='off'||settings.daltonic===m)?null:m;syncTiles();apply();}));
    $$('#tile-align .seg').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.align;settings.align=(a==='off'||settings.align===a)?null:a;syncTiles();apply();}));
    $$('#tile-saturation .seg').forEach(b=>b.addEventListener('click',()=>{const s=b.dataset.saturate;settings.saturation=(s==='off'||settings.saturation===s)?null:s;syncTiles();apply();}));
    $$('#tile-zoom .seg').forEach(b=>b.addEventListener('click',()=>{const z=b.dataset.zoom;settings.zoomLevel=(z==='off'||settings.zoomLevel===z)?null:z;syncTiles();apply();if(settings.zoomLevel) speak('Zoom al '+settings.zoomLevel+' por ciento');}));

    /* Narrador */
    $('#info').addEventListener('click',()=>{settings.voiceFeedback=!settings.voiceFeedback;syncTiles();save();if(settings.voiceFeedback) enableNarrator();else disableNarrator();});

    /* TTS */
    $('#ttsPlay').addEventListener('click',ttsReadAll);
    $('#ttsPause').addEventListener('click',ttsPause);
    $('#ttsResume').addEventListener('click',ttsResume);
    $('#ttsStop').addEventListener('click',ttsStop);
    syncTTS();

    /* Reset */
    $('#accReset').addEventListener('click',()=>{
      settings={...defaults};sessionStorage.removeItem('acc_hidden_session');localStorage.removeItem(LS_POS);
      disableNarrator();
      fab.style.left='20px';fab.style.top='';fab.style.bottom='20px';fab.style.right='auto';
      syncAll();apply();
      speak('Configuración restablecida.',true);showToast('Configuración restablecida');
    });

    /* Sync helpers */
    function sT(id,on){const el=$(id);if(el) el.setAttribute('aria-pressed',String(!!on));}
    function syncTiles(){
      sT('#contrastLight',settings.contrast==='light');sT('#contrastSmart',settings.contrast==='smart');sT('#contrastDark',settings.contrast==='dark');
      sT('#textContrast',settings.textContrast);sT('#highlight',settings.highlightLinks);
      sT('#noAnim',settings.stopAnimations);sT('#hideImg',settings.hideImages);
      sT('#spacingPlus',settings.spacingPlus);sT('#readingRuler',settings.readingRuler);
      sT('#cursor',settings.bigCursor);sT('#info',settings.voiceFeedback);
      sT('#tile-dys',settings.dyslexiaMode!==null);$$('#tile-dys .seg').forEach(b=>b.classList.toggle('active',b.dataset.mode===settings.dyslexiaMode));
      sT('#tile-daltonic',settings.daltonic!==null);$$('#tile-daltonic .seg').forEach(b=>b.classList.toggle('active',b.dataset.mode===settings.daltonic));
      sT('#tile-align',settings.align!==null);$$('#tile-align .seg').forEach(b=>b.classList.toggle('active',b.dataset.align===settings.align));
      sT('#tile-saturation',settings.saturation!==null);$$('#tile-saturation .seg').forEach(b=>b.classList.toggle('active',b.dataset.saturate===settings.saturation));
      sT('#tile-zoom',settings.zoomLevel!==null);$$('#tile-zoom .seg').forEach(b=>b.classList.toggle('active',b.dataset.zoom===settings.zoomLevel));
    }
    function syncSliders(){
      f.value=settings.fontScale;fv.textContent=settings.fontScale+'%';
      ls.value=settings.letterSpacing;lsv.textContent=settings.letterSpacing+' px';
      ln.value=settings.lineHeight;lnv.textContent=settings.lineHeight+'%';
      lblLine.textContent='Altura de línea ('+(settings.lineHeight/100).toFixed(2)+'x)';
    }
    function syncAll(){syncTiles();syncSliders();}

    ensureRing();initReadingRuler();initNarratorToast();
    if(settings.voiceFeedback) enableNarrator();
    syncAll();apply();
  }

  window.AccessibilityWidget={init(){buildUI()}};
  if(document.readyState!=='loading') window.AccessibilityWidget.init();
  else document.addEventListener('DOMContentLoaded',()=>window.AccessibilityWidget.init());
})();