function scrollPreview(button, step) {
  const carousel = button.parentElement.querySelector(".preset-carousel");
  const direction = getComputedStyle(carousel).direction === "rtl" ? -1 : 1;
  carousel.scrollBy({ left: direction * step * 220, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
}

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
function updateThemeIcon() {
  const icon = document.getElementById("toggledark");
  const dark = document.body.classList.contains("dark");
  icon.classList.toggle("fi-br-sun", dark);
  icon.classList.toggle("fi-br-moon-stars", !dark);
  const key = icon.getAttribute(dark ? "data-i18n-light-theme" : "data-i18n-dark-theme");
  const label = multilingual.getString(key) || (dark ? "Switch to light theme" : "Switch to dark theme");
  icon.setAttribute("aria-label", label);
  icon.setAttribute("lang", multilingual.stringLanguage(key));
  icon.setAttribute("title", label);
}
updateThemeIcon();

// Dark Mode (Initialization moved to index.html inline script to prevent flash)
function toggleDark() {
  const dark = document.body.classList.contains("dark");
  document.body.classList.toggle("dark");
  localStorage.setItem("dark", !dark);
  updateThemeIcon();
}
document.getElementById("toggledark").addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    toggleDark();
  }
});
// Detect Touch to prevent colouring Dark/Light Button
function detecttouch() {
  document.getElementById("toggledark").classList.remove("focustoggle");
}

document.addEventListener("click", (event) => multilingual.langEvent(event));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && multilingual.languageMenuTrigger) {
    event.preventDefault();
    multilingual.closeLanguageMenu(true);
  }
});
document.addEventListener("focusin", (event) => {
  if (multilingual.languageMenuTrigger && !event.target.closest("#globe, #langSelect, #langOption")) {
    multilingual.closeLanguageMenu();
  }
});
window.addEventListener("wheel", (event) => {
  if (!event.target.closest("#globe, #langSelect, #langOption")) multilingual.closeLanguageMenu();
}, { passive: true });

const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
const previews = document.querySelectorAll("video");
function updatePreviewMotion() {
  for (const preview of previews) {
    preview.autoplay = !motionPreference.matches;
    if (motionPreference.matches) preview.pause();
  }
}
updatePreviewMotion();
motionPreference.addEventListener("change", updatePreviewMotion);

// Feature Section Observer for Navigation
document.addEventListener("DOMContentLoaded", function() {
  const featureSections = document.querySelectorAll('.feature-extended[id]');
  const featuresNavTextWrapper = document.getElementById('featuresNavTextWrapper');
  const featuresDropdown = document.getElementById('featuresDropdown');
  const featuresTrigger = document.getElementById('featuresDropdownTrigger');
  const featureLinks = document.querySelectorAll('.feature-link');

  if (!featuresNavTextWrapper || !featureSections.length) return;

  const defaultKey = "navigation_features_label";

  function updateNavText(key, fallback) {
    // Disable text updating on mobile entirely.
    // It will just stay as "Features".
    if (window.innerWidth <= 768) return;

    const currentSpan = featuresNavTextWrapper.querySelector('span:not(.leaving)');
    if (currentSpan?.getAttribute("name") === key) return;
    
    // 1. Lock the current width
    const currentWidth = featuresNavTextWrapper.offsetWidth;
    featuresNavTextWrapper.style.width = currentWidth + 'px';
    
    // 2. Prepare the old span to slide out
    const oldSpan = currentSpan;
    if (oldSpan) {
      oldSpan.classList.add('leaving');
      oldSpan.setAttribute('aria-hidden', 'true');
      oldSpan.style.transform = 'translateY(-100%)';
      oldSpan.style.opacity = '0';
      setTimeout(() => {
        if (oldSpan && oldSpan.parentNode) oldSpan.parentNode.removeChild(oldSpan);
      }, 300);
    }

    // 3. Prepare the new span to slide in
    const newSpan = document.createElement('span');
    newSpan.setAttribute("name", key);
    newSpan.textContent = multilingual.getString(key) || fallback;
    newSpan.lang = multilingual.stringLanguage(key);
    newSpan.dir = multilingual.directionFor(newSpan.lang);
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
        updateNavText(link.getAttribute('name'), link.textContent);
      }
    } else {
      const scrollPos = window.scrollY;
      const featuresTop = document.getElementById('features')?.offsetTop || 0;
      if (scrollPos < featuresTop - 300) {
        updateNavText(defaultKey, "Features");
      }
    }
  }, { threshold: 0.4 });

  featureSections.forEach(sec => observer.observe(sec));

  function setFeaturesOpen(open) {
    featuresDropdown.classList.toggle("show", open);
    featuresTrigger.setAttribute("aria-expanded", String(open));
  }

  featuresTrigger.addEventListener("click", () => {
    setFeaturesOpen(featuresTrigger.getAttribute("aria-expanded") !== "true");
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown-container")) setFeaturesOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && event.target.closest(".nav-dropdown-container") &&
        featuresTrigger.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      setFeaturesOpen(false);
      featuresTrigger.focus();
    }
  });
  document.addEventListener("focusin", (event) => {
    if (!event.target.closest(".nav-dropdown-container")) setFeaturesOpen(false);
  });
  featureLinks.forEach((link) => link.addEventListener("click", () => setFeaturesOpen(false)));
});
