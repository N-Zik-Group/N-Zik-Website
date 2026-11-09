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
  const language = multilingual.stringLanguage(key);
  icon.setAttribute("aria-label", label);
  icon.setAttribute("lang", language);
  icon.setAttribute("dir", multilingual.directionFor(language));
  icon.setAttribute("title", label);
}
updateThemeIcon();

// Dark Mode (Initialization moved to index.html inline script to prevent flash)
function toggleDark() {
  const dark = document.body.classList.contains("dark");
  document.body.classList.toggle("dark");
  Multilingual.writePreference("dark", !dark);
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
matchMedia("(max-width: 640px)").addEventListener("change", () => multilingual.closeLanguageMenu(true));
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

// Features navigation menu
document.addEventListener("DOMContentLoaded", function() {
  const featuresDropdown = document.getElementById("featuresDropdown");
  const featuresTrigger = document.getElementById("featuresDropdownTrigger");
  const featureLinks = document.querySelectorAll(".feature-link");

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
