// Main application - loads slides from data.json
(async function(){
  try {
    // Load data from JSON file
    const response = await fetch('data.json');
    if(!response.ok) throw new Error('Failed to load data.json');
    const data = await response.json();
    
    // Initialize presentation
    initPresentation(data);
  } catch(err) {
    console.error('Error loading presentation:', err);
    document.body.innerHTML = '<h1 style="color:red;padding:20px;">Error loading presentation. Please check that data.json is in the same folder.</h1>';
  }
})();

function initPresentation(data){
  const slidesContainer = document.getElementById('slides');
  const slides = data.slides;
  const total = slides.length;
  
  // Generate HTML for all slides
  slides.forEach(slide => {
    const slideEl = createSlideElement(slide);
    slidesContainer.appendChild(slideEl);
  });
  
  // Initialize presentation controls
  const slidesArray = Array.from(slidesContainer.querySelectorAll('.slide'));
  initControls(slidesArray, data.presentation);
}

function createSlideElement(slide){
  const section = document.createElement('section');
  section.className = 'slide';
  section.dataset.title = slide.title;
  section.dataset.notes = slide.notes || 'No notes for this slide.';
  section.dataset.type = slide.type || 'content';
  section.setAttribute('role', 'region');
  section.setAttribute('aria-roledescription', 'slide');
  section.setAttribute('aria-label', `Slide ${slide.id}: ${slide.title}`);
  
  let html = '';
  
  // Add heading
  if(slide.heading){
    const headingTag = slide.type === 'title' ? 'h1' : 'h2';
    html += `<${headingTag}>${slide.heading}</${headingTag}>`;
  }
  
  // Add subheading (for title slide)
  if(slide.subheading){
    html += `<h2>${slide.subheading}</h2>`;
  }
  
  // Add content paragraphs
  if(slide.content && Array.isArray(slide.content)){
    slide.content.forEach(para => {
      html += `<p>${para}</p>`;
    });
  }
  
  // Add bullets
  if(slide.bullets && Array.isArray(slide.bullets)){
    html += '<ul>';
    slide.bullets.forEach(bullet => {
      html += `<li>${bullet}</li>`;
    });
    html += '</ul>';
  }
  
  // Add content after bullets
  if(slide.contentAfter && Array.isArray(slide.contentAfter)){
    slide.contentAfter.forEach(para => {
      html += `<p>${para}</p>`;
    });
  }
  
  // Add meta information
  if(slide.meta){
    html += `<p class="meta">${slide.meta}</p>`;
  }
  
  section.innerHTML = html;
  return section;
}

function initControls(slidesArray, presentationInfo){
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
  const slidesContainer = document.getElementById('slides');
  
  const total = slidesArray.length;
  let current = 0;
  let isMobile = window.innerWidth < 1024;
  
  // Update page title
  document.title = presentationInfo.title;
  
  // Detect screen size changes
  window.addEventListener('resize', debounce(()=>{
    isMobile = window.innerWidth < 1024;
    updateThumbnailsVisibility();
  }, 150));
  
  function debounce(func, delay){
    let timeoutId;
    return function(...args){
      clearTimeout(timeoutId);
      timeoutId = setTimeout(()=> func.apply(this, args), delay);
    };
  }
  
  function updateThumbnailsVisibility(){
    if(window.innerWidth < 1024){
      thumbnails.style.display = 'none';
    } else {
      thumbnails.style.display = 'flex';
    }
  }
  
  // Build thumbnails
  slidesArray.forEach((s, i) => {
    const t = document.createElement('button');
    t.className = 'thumb';
    t.type = 'button';
    const slideNum = i + 1;
    const slideTitle = s.dataset.title || `Slide ${slideNum}`;
    t.innerText = `${slideNum}. ${slideTitle}`;
    t.addEventListener('click', ()=>goTo(i));
    t.setAttribute('aria-label', `Slide ${slideNum}: ${slideTitle}`);
    thumbnails.appendChild(t);
  });
  
  updateThumbnailsVisibility();
  
  function updateThumbnails(){
    const thumbs = Array.from(thumbnails.children);
    thumbs.forEach((t, idx) => {
      if(idx === current){
        t.setAttribute('aria-current', 'true');
        if(!isMobile){
          t.scrollIntoView({behavior:'smooth', block:'nearest', inline:'nearest'});
        }
      } else {
        t.removeAttribute('aria-current');
      }
    });
  }
  
  function showSlide(idx, fromHistory){
    if(idx < 0) idx = 0;
    if(idx > total - 1) idx = total - 1;
    slidesArray.forEach((s, i) => {
      s.classList.remove('current', 'prev');
      if(i === idx) s.classList.add('current');
      if(i === idx - 1) s.classList.add('prev');
    });
    current = idx;
    updateUI();
    if(!fromHistory) history.replaceState(null, '', '#slide-' + (idx + 1));
    const slideTitle = slidesArray[idx].dataset.title || '';
    announceForSR(`Slide ${idx + 1} of ${total}: ${slideTitle}`);
  }
  
  function updateUI(){
    progress.innerText = `Slide ${current + 1} / ${total}`;
    const n = slidesArray[current].dataset.notes || 'No notes for this slide.';
    notesContent.innerText = n;
    const notesVisible = notesToggle.getAttribute('aria-pressed') === 'true';
    notesPanel.setAttribute('aria-hidden', !notesVisible ? 'true' : 'false');
    updateThumbnails();
  }
  
  function announceForSR(text){
    srAnnounce.innerText = '';
    setTimeout(()=> srAnnounce.innerText = text, 50);
  }
  
  function next(){ if(current < total - 1) showSlide(current + 1); }
  function prev(){ if(current > 0) showSlide(current - 1); }
  function goTo(i){ showSlide(i); }
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
    if(e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
    if(e.key === 'Home') { e.preventDefault(); goTo(0); }
    if(e.key === 'End') { e.preventDefault(); goTo(total - 1); }
    if(e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullScreen(); }
    if(e.key === 'n' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); notesToggle.click(); }
  });
  
  // Button events
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  firstBtn.addEventListener('click', ()=>goTo(0));
  lastBtn.addEventListener('click', ()=>goTo(total - 1));
  fullscreenBtn.addEventListener('click', toggleFullScreen);
  notesToggle.addEventListener('click', toggleNotes);
  contrastToggle.addEventListener('click', toggleContrast);
  bigTextToggle.addEventListener('click', toggleBigText);
  printBtn.addEventListener('click', ()=>window.print());
  
  // Hash navigation
  window.addEventListener('hashchange', () => {
    const idx = parseHash();
    if(idx !== null) showSlide(idx, true);
  });
  
  function parseHash(){
    const h = location.hash || '';
    const m = h.match(/slide-(\d+)/);
    if(m) {
      const n = parseInt(m[1], 10);
      if(!isNaN(n) && n >= 1 && n <= total) return n - 1;
    }
    return null;
  }
  
  function toggleNotes(){
    const pressed = notesToggle.getAttribute('aria-pressed') === 'true';
    notesToggle.setAttribute('aria-pressed', String(!pressed));
    if(!pressed){
      notesPanel.classList.add('visible');
      notesPanel.setAttribute('aria-hidden', 'false');
      notesToggle.classList.add('active');
      announceForSR('Presenter notes shown');
    } else {
      notesPanel.classList.remove('visible');
      notesPanel.setAttribute('aria-hidden', 'true');
      notesToggle.classList.remove('active');
      announceForSR('Presenter notes hidden');
    }
    updateUI();
  }
  
  function toggleContrast(){
    const pressed = contrastToggle.getAttribute('aria-pressed') === 'true';
    contrastToggle.setAttribute('aria-pressed', String(!pressed));
    document.documentElement.classList.toggle('contrast', !pressed);
    contrastToggle.classList.toggle('active');
    announceForSR(`High contrast ${!pressed ? 'enabled' : 'disabled'}`);
  }
  
  function toggleBigText(){
    const pressed = bigTextToggle.getAttribute('aria-pressed') === 'true';
    bigTextToggle.setAttribute('aria-pressed', String(!pressed));
    document.documentElement.classList.toggle('bigtext', !pressed);
    bigTextToggle.classList.toggle('active');
    announceForSR(`Large text ${!pressed ? 'enabled' : 'disabled'}`);
  }
  
  function toggleFullScreen(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen?.().catch(err=> console.warn('Fullscreen error:', err));
    } else {
      document.exitFullscreen?.();
    }
  }
  
  // Touch support
  let touchStartX = null;
  let touchStartY = null;
  
  slidesContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, {passive:true});
  
  slidesContainer.addEventListener('touchend', (e) => {
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if(Math.abs(dx) > Math.abs(dy)){
      if(dx < -30) next();
      if(dx > 30) prev();
    }
    touchStartX = null;
    touchStartY = null;
  }, {passive:true});
  
  // Click to advance
  slidesContainer.addEventListener('click', (e) => {
    if(e.target.closest('button')) return;
    if(!isMobile) next();
  });
  
  // Initialize
  const initial = parseHash();
  if(initial !== null) current = initial;
  showSlide(current);
  
  // Thumbnail keyboard support
  Array.from(thumbnails.children).forEach((t, i) => {
    t.tabIndex = 0;
    t.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTo(i); }
    });
  });
  
  // Focus management
  [prevBtn, nextBtn, firstBtn, lastBtn].forEach(b => {
    b.addEventListener('click', ()=>slidesContainer.focus());
  });
}