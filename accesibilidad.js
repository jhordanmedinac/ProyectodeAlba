(function(){
  if(window.AccessibilityWidget) return;
  const LS_KEY='acc_settings_v1_9';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const css=`
  :root{--acc-primary-100:#e8dcc5;--acc-primary-500:#c5a059;--acc-primary-600:#00093C;--acc-neutral-100:#f5f5f4;--acc-neutral-200:#e5e5e4;--acc-neutral-900:#1c1917}
  #accFab{position:fixed;bottom:20px;left:20px;width:56px;height:56px;border-radius:999px;background:#00093C;color:#fff;display:flex;align-items:center;justify-content:center;border:none;box-shadow:0 10px 25px rgba(0,0,0,.1),0 4px 10px rgba(0,0,0,.08);z-index:10050;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}
  #accFab:hover{transform:scale(1.08);box-shadow:0 12px 30px rgba(0,0,0,.15),0 6px 12px rgba(0,0,0,.1)}
  #accFab.hidden{display:none}
  #accFab.right{right:20px;left:auto}
  #accFab .ico-dog{font-size:28px;line-height:1}
  #accPanelOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:none;z-index:10040;transition:opacity .3s ease}
  #accPanelOverlay.open{display:block;opacity:1}
  #accPanel{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:560px;max-width:calc(100% - 40px);background:#fff;color:#1c1917;border-radius:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);z-index:10060;display:none;font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;transition:transform .3s ease,opacity .3s ease;opacity:0}
  #accPanel.open{display:block;opacity:1;transform:translate(-50%,-50%)}
  #accPanel header{padding:16px 20px;background:#00093C;display:flex;align-items:center;justify-content:space-between;border-top-left-radius:18px;border-top-right-radius:18px;color:#fff;font-family:'Inter',sans-serif}
  #accPanel header h3{margin:0;font-size:18px;font-weight:700;font-family:'Inter',sans-serif}
  #accPanel header button{border:none;background:transparent;color:#fff;font-size:22px;cursor:pointer;font-family:'Inter',sans-serif}
  #accPanel .acc-body{padding:20px;max-height:72vh;overflow:auto;font-family:'Inter',sans-serif}
  .acc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .acc-tile{position:relative;border:2px solid #e5e5e4;border-radius:14px;background:#f5f5f4;min-height:110px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;padding:12px;gap:8px;font-size:13px;cursor:pointer;user-select:none;transition:border-color .2s ease,box-shadow .2s ease,background .2s ease;font-family:'Inter',sans-serif}
  .acc-tile .ico{font-size:26px;line-height:1}
  .acc-tile:hover{background:#fff;border-color:#c5a059}
  .acc-tile[aria-pressed="true"]{border:2px solid #c5a059;background:#e8dcc5;box-shadow:0 0 0 2px #c5a059 inset}
  .acc-tile[aria-pressed="true"]::after{content:"✓";position:absolute;top:8px;right:8px;width:20px;height:20px;border-radius:999px;background:#c5a059;color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-family:'Inter',sans-serif}
  .acc-tile input[type="range"]{width:100%}
  .acc-section{margin:18px 2px 10px;font-weight:700;font-size:13px;color:#00093C;text-transform:uppercase;letter-spacing:1px;font-family:'Inter',sans-serif}
  .acc-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .acc-radio{display:flex;gap:8px;align-items:center;font-size:14px;font-family:'Inter',sans-serif}
  .acc-radio input{accent-color:#c5a059;width:16px;height:16px}
  .acc-footer{display:flex;justify-content:space-between;align-items:center;margin-top:20px}
  .acc-btn{padding:10px 14px;border-radius:10px;border:1px solid #e5e5e4;background:#fff;cursor:pointer;font-size:13px;transition:all .2s ease;font-family:'Inter',sans-serif}
  .acc-btn:hover{background:#f5f5f4}
  .acc-btn.primary{background:#00093C;color:#fff;border-color:#00093C}
  .acc-btn.primary:hover{background:#c5a059;border-color:#c5a059;color:#00093C}
  .acc-note{font-size:12px;color:#78716c;font-family:'Inter',sans-serif}
  .segmented{display:flex;gap:6px;width:100%;justify-content:center}
  .segmented .seg{flex:1 1 auto;padding:8px 10px;border:1px solid #e5e5e4;border-radius:999px;background:#fff;cursor:pointer;font-size:12px;white-space:nowrap;transition:all .2s ease;font-family:'Inter',sans-serif}
  .segmented .seg:hover{background:#f5f5f4}
  .segmented .seg.active{border:2px solid #c5a059;background:#e8dcc5;color:#00093C;font-weight:600}
  html.acc-contrast-light{filter:contrast(1.15) saturate(1.05)}
  html.acc-contrast-smart{filter:contrast(1.1) saturate(1.2) brightness(1.02)}
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
  @media (max-width: 600px) {
    #accPanel {width: 90%; max-width: 400px;}
    .acc-grid {grid-template-columns: repeat(2, 1fr);}
  }
  `;
  const defaults={contrast:null,daltonic:null,highlightLinks:false,stopAnimations:false,hideImages:false,dyslexiaMode:null,align:null,saturation:null,fontScale:100,letterSpacing:0,lineHeight:140,position:'left',voiceFeedback:false};
  let settings=load();
  function load(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(LS_KEY)||'{}'))}catch{return {...defaults}}}
  function save(){localStorage.setItem(LS_KEY,JSON.stringify(settings))}
  function apply(){
    const html=document.documentElement;
    html.classList.remove('acc-contrast-light', 'acc-contrast-smart', 'acc-daltonic-protanopia', 'acc-daltonic-deuteranopia', 'acc-daltonic-tritanopia', 'acc-saturate-low', 'acc-saturate-high', 'acc-desaturate', 'acc-highlight-links', 'acc-no-anim', 'acc-hide-images', 'acc-dys-dys', 'acc-dys-hyper', 'acc-align-left', 'acc-align-center', 'acc-align-right');
    
    if(settings.contrast==='light') html.classList.add('acc-contrast-light');
    if(settings.contrast==='smart') html.classList.add('acc-contrast-smart');
    
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
    
    let scale=settings.fontScale;
    let letter=settings.letterSpacing;
    let line=settings.lineHeight;
    if(settings.dyslexiaMode==='dys'){letter=Math.max(letter,1.2);line=Math.max(line,170)}
    if(settings.dyslexiaMode==='hyper'){letter=Math.max(letter,0.6);line=Math.max(line,160)}
    
    html.style.setProperty('--acc-font-scale',`${clamp(scale,80,200)}%`);
    html.style.setProperty('--acc-letter-spacing',`${clamp(letter,0,5)}px`);
    html.style.setProperty('--acc-line-height',line?(line/100).toFixed(2):'normal');

    const fab=$('#accFab'); if(fab){fab.classList.toggle('right',settings.position==='right');fab.classList.toggle('hidden',settings.position==='hidden')}
    const panel=$('#accPanel'); if(panel){panel.classList.toggle('right',settings.position==='right')}
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
    window.addEventListener('mousemove',e=>{if(!$('#accCursorRing').classList.contains('on')) return;r.style.transform=`translate(${e.clientX-22}px, ${e.clientY-22}px)`},{passive:true})
  }
  function buildUI(){
    if(!$('#acc-widget-styles')){const st=document.createElement('style');st.id='acc-widget-styles';st.textContent=css;document.head.appendChild(st)}
    if(!$('#acc-svg-filters')){const svgs=`<svg style="display:none;"><filter id="protanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0"/></filter><filter id="deuteranopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0"/></filter><filter id="tritanopia"><feColorMatrix in="SourceGraphic" type="matrix" values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0"/></filter></svg>`;document.body.insertAdjacentHTML('beforeend',svgs)}
    const fab=document.createElement('button');fab.id='accFab';fab.setAttribute('aria-label','Abrir menú de accesibilidad');fab.innerHTML='<img src="IMAGENES/aguila.png" alt="Accesibilidad" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">';document.body.appendChild(fab);
    const overlay=document.createElement('div');overlay.id='accPanelOverlay';
    const panel=document.createElement('div');panel.id='accPanel';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');
    panel.innerHTML=`
      <header><h3>Menú de Accesibilidad</h3><button id="accClose" aria-label="Cerrar">✕</button></header>
      <div class="acc-body">
        <div class="acc-section">Opciones Visuales</div>
        <div class="acc-grid">
          <button class="acc-tile" id="contrastLight" aria-pressed="false"><div class="ico">💡</div><div>Contraste de luz</div></button>
          <button class="acc-tile" id="contrastSmart" aria-pressed="false"><div class="ico">🧠</div><div>Contraste Inteligente</div></button>
          <button class="acc-tile" id="highlight" aria-pressed="false"><div class="ico">🔗</div><div>Resaltar enlaces</div></button>
          <button class="acc-tile" id="noAnim" aria-pressed="false"><div class="ico">⏸️</div><div>Detener animaciones</div></button>
          <button class="acc-tile" id="hideImg" aria-pressed="false"><div class="ico">🖼️</div><div>Ocultar Imágenes</div></button>
          <button class="acc-tile" id="cursor" aria-pressed="false"><div class="ico">🖱️</div><div>Cursor grande</div></button>
        </div>
        <div class="acc-section">Modos especiales</div>
        <div class="acc-grid">
          <div class="acc-tile" id="tile-daltonic" style="cursor:default">
            <div class="ico">🎨</div><div>Modo daltónico</div>
            <div class="segmented" role="group" aria-label="Modo daltónico">
              <button type="button" class="seg" data-mode="protanopia">Protanopia</button>
              <button type="button" class="seg" data-mode="deuteranopia">Deuteranopia</button>
              <button type="button" class="seg" data-mode="tritanopia">Tritanopia</button>
              <button type="button" class="seg" data-mode="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-dys" style="cursor:default">
            <div class="ico">📖</div><div>Apto para dislexia</div>
            <div class="segmented" role="group" aria-label="Modo dislexia">
              <button type="button" class="seg" data-mode="dys">OpenDyslexic</button>
              <button type="button" class="seg" data-mode="hyper">Alta legibilidad</button>
              <button type="button" class="seg" data-mode="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-align" style="cursor:default">
            <div class="ico">📝</div><div>Alinear texto</div>
            <div class="segmented" role="group" aria-label="Alinear texto">
              <button type="button" class="seg" data-align="left">Izquierda</button>
              <button type="button" class="seg" data-align="center">Centrado</button>
              <button type="button" class="seg" data-align="right">Derecha</button>
              <button type="button" class="seg" data-align="off">Desactivar</button>
            </div>
          </div>
          <div class="acc-tile" id="tile-saturation" style="cursor:default">
            <div class="ico">💧</div><div>Saturación</div>
            <div class="segmented" role="group" aria-label="Saturación">
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
            <div class="ico">tT</div><div>Agrandar texto</div>
            <input type="range" id="rng-font" min="80" max="200" step="1"><div class="acc-note" id="val-font"></div>
          </div>
          <div class="acc-tile" id="spacing">
            <div class="ico">↔️</div><div>Espaciado de texto</div>
            <input type="range" id="rng-letter" min="0" max="5" step="0.1"><div class="acc-note" id="val-letter"></div>
          </div>
          <div class="acc-tile" id="lineHeight">
            <div class="ico">↕️</div><div id="lbl-line">Altura de la línea</div>
            <input type="range" id="rng-line" min="100" max="250" step="5"><div class="acc-note" id="val-line"></div>
          </div>
          <button class="acc-tile" id="outline" aria-pressed="false"><div class="ico">📑</div><div>Estructura de la página</div></button>
        </div>
        <div class="acc-section">Lectura y voz</div>
        <div class="acc-grid">
          <div class="acc-tile" id="tile-tts" style="grid-column:span 3; cursor:default">
            <div class="ico">🔊</div><div>Leer página</div>
            <div class="acc-row" style="justify-content:center">
              <button class="acc-btn" id="ttsPlay">Leer</button>
              <button class="acc-btn" id="ttsPause">Pausar</button>
              <button class="acc-btn" id="ttsResume">Reanudar</button>
              <button class="acc-btn" id="ttsStop">Detener</button>
            </div>
          </div>
          <button class="acc-tile" id="info" aria-pressed="false" style="grid-column:span 3">
            <div class="ico">🎙️</div><div>Narrador de acciones</div>
          </button>
        </div>
        <div class="acc-section">Mover / Ocultar widget</div>
        <div class="acc-row">
          <label class="acc-radio"><input type="radio" name="acc-pos" value="left"> Izquierdo</label>
          <label class="acc-radio"><input type="radio" name="acc-pos" value="right"> Derecho</label>
          <label class="acc-radio"><input type="radio" name="acc-pos" value="hidden"> Ocultar</label>
        </div>
        <div class="acc-footer">
          <button class="acc-btn" id="accReset">Restablecer configuraciones</button>
          <span class="acc-note">Se guardan automáticamente</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);document.body.appendChild(panel);
    const open=()=>{overlay.classList.add('open');panel.classList.add('open')};
    const close=()=>{overlay.classList.remove('open');panel.classList.remove('open')};
    fab.addEventListener('click',open);overlay.addEventListener('click',close);$('#accClose').addEventListener('click',close);
    document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='U')){e.preventDefault();open()}if(e.key==='Escape')close()});
    const f=$('#rng-font'),fv=$('#val-font');
    const ls=$('#rng-letter'),lsv=$('#val-letter');
    const ln=$('#rng-line'),lnv=$('#val-line'),lblLine=$('#lbl-line');
    
    f.addEventListener('input',()=>{settings.fontScale=+f.value;fv.textContent=settings.fontScale+'%';apply();speak('Tamaño de fuente '+settings.fontScale+' por ciento')});
    ls.addEventListener('input',()=>{settings.letterSpacing=+ls.value;lsv.textContent=settings.letterSpacing+' px';apply();speak('Espaciado de texto '+settings.letterSpacing+' píxeles')});
    ln.addEventListener('input',()=>{settings.lineHeight=+ln.value;const x=(settings.lineHeight/100).toFixed(2)+'x';lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de la línea ('+x+')';apply();speak('Altura de línea '+x)});
    
    $('#contrastLight').addEventListener('click',()=>{settings.contrast=settings.contrast==='light'?null:'light';syncTiles();apply();speak('Contraste de luz '+(settings.contrast?'activado':'desactivado'))});
    $('#contrastSmart').addEventListener('click',()=>{settings.contrast=settings.contrast==='smart'?null:'smart';syncTiles();apply();speak('Contraste inteligente '+(settings.contrast?'activado':'desactivado'))});
    $('#highlight').addEventListener('click',()=>{settings.highlightLinks=!settings.highlightLinks;syncTiles();apply();speak('Resaltar enlaces '+(settings.highlightLinks?'activado':'desactivado'))});
    $('#noAnim').addEventListener('click',()=>{settings.stopAnimations=!settings.stopAnimations;syncTiles();apply();speak('Detener animaciones '+(settings.stopAnimations?'activado':'desactivado'))});
    $('#hideImg').addEventListener('click',()=>{settings.hideImages=!settings.hideImages;syncTiles();apply();speak('Ocultar imágenes '+(settings.hideImages?'activado':'desactivado'))});
    $('#cursor').addEventListener('click',()=>{const ring=$('#accCursorRing');if(!ring) ensureRing();$('#accCursorRing').classList.toggle('on');syncTile('#cursor',$('#accCursorRing').classList.contains('on'));speak('Cursor destacado '+($('#accCursorRing').classList.contains('on')?'activado':'desactivado'))});
    
    function handleSegmentedClick(el, prop, val){
      if(settings[prop] === val){
        settings[prop] = null;
        speak(`${val} desactivado`);
      } else {
        settings[prop] = val;
        speak(`${val} activado`);
      }
      syncTiles();
      apply();
    }
    
    $$('#tile-dys .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      if (mode === 'off') {
        settings.dyslexiaMode = null;
      } else {
        settings.dyslexiaMode = settings.dyslexiaMode === mode ? null : mode;
      }
      const state = settings.dyslexiaMode ? 'activado' : 'desactivado';
      speak(`Modo dislexia ${settings.dyslexiaMode ? mode : ''} ${state}`);
      syncTiles();
      apply();
    })});
    
    $$('#tile-daltonic .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-mode');
      if (mode === 'off') {
        settings.daltonic = null;
      } else {
        settings.daltonic = settings.daltonic === mode ? null : mode;
      }
      const state = settings.daltonic ? 'activado' : 'desactivado';
      speak(`Modo daltónico ${settings.daltonic ? mode : ''} ${state}`);
      syncTiles();
      apply();
    })});
    
    $$('#tile-align .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const align = btn.getAttribute('data-align');
      if (align === 'off') {
        settings.align = null;
      } else {
        settings.align = settings.align === align ? null : align;
      }
      const state = settings.align ? 'activada' : 'desactivada';
      speak(`Alineación de texto ${settings.align ? align : ''} ${state}`);
      syncTiles();
      apply();
    })});

    $$('#tile-saturation .seg').forEach(btn=>{btn.addEventListener('click', () => {
      const saturate = btn.getAttribute('data-saturate');
      if (saturate === 'off') {
        settings.saturation = null;
      } else {
        settings.saturation = settings.saturation === saturate ? null : saturate;
      }
      const state = settings.saturation ? 'activada' : 'desactivada';
      speak(`Saturación ${settings.saturation ? saturate : ''} ${state}`);
      syncTiles();
      apply();
    })});

    $('#info').addEventListener('click',()=>{settings.voiceFeedback=!settings.voiceFeedback;syncTiles();save();speak('Narrador de acciones '+(settings.voiceFeedback?'activado':'desactivado'))});
    $('#outline').addEventListener('click',()=>{showOutline();speak('Estructura de la página abierta')});
    $('#ttsPlay').addEventListener('click',ttsReadAll);
    $('#ttsPause').addEventListener('click',ttsPause);
    $('#ttsResume').addEventListener('click',ttsResume);
    $('#ttsStop').addEventListener('click',ttsStop);
    syncTTS();
    $$('input[name="acc-pos"]').forEach(r=>r.addEventListener('change',()=>{settings.position=r.value;apply();speak('Posición del botón '+(settings.position==='left'?'izquierda':settings.position==='right'?'derecha':'oculto'))}));
    $('#accReset').addEventListener('click',()=>{settings={...defaults};syncAll();apply();speak('Configuraciones restablecidas')});
    
    function syncTile(sel,on){const el=$(sel);if(!el) return;el.setAttribute('aria-pressed',!!on)}
    function syncTiles(){
      $('#contrastLight').setAttribute('aria-pressed',settings.contrast==='light');
      $('#contrastSmart').setAttribute('aria-pressed',settings.contrast==='smart');
      $('#highlight').setAttribute('aria-pressed',settings.highlightLinks);
      $('#noAnim').setAttribute('aria-pressed',settings.stopAnimations);
      $('#hideImg').setAttribute('aria-pressed',settings.hideImages);
      $('#info').setAttribute('aria-pressed',settings.voiceFeedback);
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
      ln.value=settings.lineHeight;lnv.textContent=settings.lineHeight+'%';lblLine.textContent='Altura de la línea ('+(settings.lineHeight/100).toFixed(2)+'x)';
      
      if (settings.dyslexiaMode === 'dys') {
        ls.min = 1.2;
        ln.min = 170;
      } else if (settings.dyslexiaMode === 'hyper') {
        ls.min = 0.6;
        ln.min = 160;
      } else {
        ls.min = 0;
        ln.min = 100;
      }
    }
    function syncPosition(){ $$('input[name="acc-pos"]').forEach(r=>r.checked=(r.value===settings.position)) }
    function syncAll(){syncTiles();syncSliders();syncPosition()}
    ensureRing();syncAll();apply();
  }
  window.AccessibilityWidget={init(){buildUI()}};
  if(document.readyState!=='loading') window.AccessibilityWidget.init();
  else document.addEventListener('DOMContentLoaded',()=>window.AccessibilityWidget.init());
})();