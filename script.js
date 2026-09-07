// Presentation script: keyboard, click, touch, notes, thumbnails, accessibility
(function(){
  const slidesContainer = document.getElementById('slides');
  const slides = Array.from(slidesContainer.querySelectorAll('.slide'));
  const total = slides.length;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const firstBtn = document.getElementById('firstBtn');
  const lastBtn = document.getElementById('lastBtn');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const notesToggle = document.getElementById('notesToggle');
  const notesPanel = document.getElementById('notesPanel');
  const notesContent = document.getElementById('notesContent');
  const contrastToggle = document.getElementById('contrastToggle');
  const bigTextToggle = document.getElementById('bigTextToggle');
  const printBtn = document.getElementById('printBtn');
  const thumbnails = document.getElementById('thumbnails');
  const progress = document.getElementById('progress');
  const srAnnounce = document.getElementById('srAnnounce');

  let current = 0;
  let isMobile = window.innerWidth < 1024;

  // Detect screen size changes
  window.addEventListener('resize', ()=>{
    isMobile = window.innerWidth < 1024;
    updateThumbailsVisibility();
  });

  function updateThumbailsVisibility(){
    if(isMobile){
      thumbnails.classList.remove('visible');
    } else {
      thumbnails.classList.add('visible');
    }
  }

  // Build thumbnails
  slides.forEach((s,i)=>{
    const t = document.createElement('button');
    t.className = 'thumb';
    t.type = 'button';
    t.innerText = (i+1) + '. ' + (s.dataset.title || s.querySelector('h2')?.innerText || 'Slide');
    t.addEventListener('click', ()=>goTo(i));
    t.setAttribute('aria-label', 'Go to slide ' + (i+1));
    thumbnails.appendChild(t);
  });

  updateThumbailsVisibility();

  function updateThumbnails(){
    const thumbs = Array.from(thumbnails.children);
    thumbs.forEach((t, idx)=>{
      if(idx===current) t.setAttribute('aria-current','true');
      else t.removeAttribute('aria-current');
    });
  }

  function showSlide(idx, fromHistory){
    if(idx<0) idx=0;
    if(idx>total-1) idx=total-1;
    slides.forEach((s,i)=>{
      s.classList.remove('current','prev');
      if(i===idx) s.classList.add('current');
      if(i===idx-1) s.classList.add('prev');
    });
    current = idx;
    updateUI();
    if(!fromHistory) history.replaceState(null,'', '#slide-'+(idx+1));
    announceForSR(`Slide ${idx+1} of ${total}: ${slides[idx].dataset.title || slides[idx].querySelector('h2')?.innerText || ''}`);
  }

  function updateUI(){
    progress.innerText = `Slide ${current+1} / ${total}`;
    // update notes
    const n = slides[current].dataset.notes || 'No notes for this slide.';
    notesContent.innerText = n;
    const notesVisible = notesToggle.getAttribute('aria-pressed') === 'true';
    notesPanel.setAttribute('aria-hidden', !notesVisible ? 'true' : 'false');
    if(notesVisible){
      notesPanel.classList.add('visible');
    } else {
      notesPanel.classList.remove('visible');
    }
    updateThumbnails();
  }

  function announceForSR(text){
    srAnnounce.innerText = '';
    setTimeout(()=> srAnnounce.innerText = text, 50);
  }

  // Navigation
  function next(){ if(current < total-1) showSlide(current+1); }
  function prev(){ if(current > 0) showSlide(current-1); }
  function goTo(i){ showSlide(i); }

  // Keyboard
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    if(e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    if(e.key === 'Home') goTo(0);
    if(e.key === 'End') goTo(total-1);
    if(e.key === 'n' && (e.ctrlKey || e.metaKey)) notesToggle.click();
  });

  // Buttons
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  firstBtn.addEventListener('click', ()=>goTo(0));
  lastBtn.addEventListener('click', ()=>goTo(total-1));
  fullscreenBtn.addEventListener('click', toggleFullScreen);
  notesToggle.addEventListener('click', toggleNotes);
  contrastToggle.addEventListener('click', toggleContrast);
  bigTextToggle.addEventListener('click', toggleBigText);
  printBtn.addEventListener('click', ()=>window.print());

  // Hash change handling (back/forward)
  window.addEventListener('hashchange', ()=>{
    const idx = parseHash();
    if(idx !== null) showSlide(idx, true);
  });
  function parseHash(){
    const h = location.hash || '';
    const m = h.match(/slide-(\d+)/);
    if(m) {
      const n = parseInt(m[1],10);
      if(!isNaN(n) && n>=1 && n<=total) return n-1;
    }
    return null;
  }

  // Notes
  function toggleNotes(){
    const pressed = notesToggle.getAttribute('aria-pressed') === 'true';
    notesToggle.setAttribute('aria-pressed', String(!pressed));
    if(!pressed){
      notesPanel.classList.add('visible');
      notesPanel.setAttribute('aria-hidden','false');
      notesToggle.classList.add('active');
    } else {
      notesPanel.classList.remove('visible');
      notesPanel.setAttribute('aria-hidden','true');
      notesToggle.classList.remove('active');
    }
    updateUI();
  }

  // Contrast
  function toggleContrast(){
    const pressed = contrastToggle.getAttribute('aria-pressed') === 'true';
    contrastToggle.setAttribute('aria-pressed', String(!pressed));
    document.documentElement.classList.toggle('contrast', !pressed);
    contrastToggle.classList.toggle('active');
  }

  // Big text
  function toggleBigText(){
    const pressed = bigTextToggle.getAttribute('aria-pressed') === 'true';
    bigTextToggle.setAttribute('aria-pressed', String(!pressed));
    document.documentElement.classList.toggle('bigtext', !pressed);
    bigTextToggle.classList.toggle('active');
  }

  // Fullscreen helper
  function toggleFullScreen(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // Touch swipe
  let touchStartX = null;
  slidesContainer.addEventListener('touchstart', (e)=>{
    touchStartX = e.changedTouches[0].clientX;
  }, {passive:true});
  slidesContainer.addEventListener('touchend', (e)=>{
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(dx < -30) next();
    if(dx > 30) prev();
    touchStartX = null;
  });

  // Click on slide to advance
  slidesContainer.addEventListener('click', (e)=>{
    // If clicked on control elements, ignore.
    if(e.target.closest('button')) return;
    next();
  });

  // Initialize
  const initial = parseHash();
  if(initial !== null) current = initial;
  showSlide(current);

  // Make thumbnails focusable and keyboard-friendly
  Array.from(thumbnails.children).forEach((t, i)=>{
    t.tabIndex = 0;
    t.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i); }
    });
  });

  // Focus management: keep focus on slides container after actions for keyboard navigation
  [prevBtn,nextBtn,firstBtn,lastBtn].forEach(b=>{
    b.addEventListener('click', ()=>slidesContainer.focus());
  });

})();
