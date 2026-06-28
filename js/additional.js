class LoadingScreen {
  static loaded() {
    const loadingScreen = document.querySelector(".loadingScreen");
    loadingScreen.style.opacity = "0";
    setTimeout(() => {
      loadingScreen.style.display = "none";
    }, 400);
  }
  static unload(){
    const loadingScreen = document.querySelector(".loadingScreen");
    loadingScreen.style.opacity = "1";
    loadingScreen.style.display = "flex";
  }
}
// Dark Mode (Initialization moved to index.html inline script to prevent flash)
function toggleDark() {
  const dark = document.body.classList.contains("dark");
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", !dark);
}
// Detect Touch to prevent colouring Dark/Light Button
function detecttouch() {
  document.getElementById("toggledark").classList.remove("focustoggle");
}

document.onmousedown = function (e) {
  multilingual.langEvent(e)
}
document.onkeyup = function (e) {
  if (e.target.parentElement.id != "langOption" || e.keyCode == 27){
    document.body.classList.remove("visible")
  }
  if (e.keyCode == 13){
    multilingual.langEvent(e)
    document.getElementById("langOption").firstElementChild.focus() 
  }
}

// Feature Section Observer for Navigation
document.addEventListener("DOMContentLoaded", function() {
  const featureSections = document.querySelectorAll('.feature-extended[id]');
  const featuresNavTextWrapper = document.getElementById('featuresNavTextWrapper');
  const featuresDropdown = document.getElementById('featuresDropdown');
  const featureLinks = document.querySelectorAll('.feature-link');

  if (!featuresNavTextWrapper || !featureSections.length) return;

  let currentText = featuresNavTextWrapper.querySelector('span:not(.leaving)')?.textContent || "Features";

  function updateNavText(newText) {
    // Disable text updating on mobile entirely.
    // It will just stay as "Features".
    if (window.innerWidth <= 768) return;

    if (currentText === newText) return;
    
    // 1. Lock the current width
    const currentWidth = featuresNavTextWrapper.offsetWidth;
    featuresNavTextWrapper.style.width = currentWidth + 'px';
    
    // 2. Prepare the old span to slide out
    const oldSpan = featuresNavTextWrapper.querySelector('span:not(.leaving)');
    if (oldSpan) {
      oldSpan.classList.add('leaving');
      oldSpan.style.transform = 'translateY(-100%)';
      oldSpan.style.opacity = '0';
      setTimeout(() => {
        if (oldSpan && oldSpan.parentNode) oldSpan.parentNode.removeChild(oldSpan);
      }, 300);
    }

    // 3. Prepare the new span to slide in
    const newSpan = document.createElement('span');
    newSpan.textContent = newText;
    newSpan.style.transform = 'translateY(100%)';
    newSpan.style.opacity = '0';
    
    featuresNavTextWrapper.appendChild(newSpan);

    // 4. Measure the new width directly from the new span
    // We don't measure the wrapper because the old (potentially longer) span is still in the grid
    const targetWidth = newSpan.offsetWidth;
    
    // 5. Restore old width and trigger reflow
    featuresNavTextWrapper.style.width = currentWidth + 'px';
    void featuresNavTextWrapper.offsetWidth; // force reflow

    // 6. Animate everything to the new state
    if (window.innerWidth > 768) {
      featuresNavTextWrapper.style.transition = 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    } else {
      featuresNavTextWrapper.style.transition = 'none';
    }
    featuresNavTextWrapper.style.width = targetWidth + 'px';

    newSpan.style.transform = 'translateY(0)';
    newSpan.style.opacity = '1';

    currentText = newText;

    // 7. Clean up after transition
    setTimeout(() => {
      featuresNavTextWrapper.style.transition = '';
      featuresNavTextWrapper.style.width = 'auto';
    }, 300);
  }

  const observer = new IntersectionObserver((entries) => {
    let activeFeature = null;
    
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        activeFeature = entry.target.id;
      }
    });
    
    if (activeFeature) {
      const link = document.querySelector(`.feature-link[href="#${activeFeature}"]`);
      if (link) {
        updateNavText(link.getAttribute('data-name'));
      }
    } else {
      const scrollPos = window.scrollY;
      const featuresTop = document.getElementById('features')?.offsetTop || 0;
      if (scrollPos < featuresTop - 300) {
        updateNavText("Features");
      }
    }
  }, { threshold: 0.4 });

  featureSections.forEach(sec => observer.observe(sec));

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown-container')) {
      if (featuresDropdown && featuresDropdown.classList.contains('show')) {
        featuresDropdown.classList.remove('show');
      }
    }
  });

  // Close dropdown when clicking a link
  featureLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (featuresDropdown) featuresDropdown.classList.remove('show');
    });
  });
});
