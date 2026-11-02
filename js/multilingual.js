class Multilingual {
  language;
  defaultValues = {};
  selectedValues = {};
  loadVersion = 0;
  constructor(supported) {
    const user = (navigator.language || navigator.userLanguage).split("-")[0];
    if (supported.includes(user)) {
      this.language = localStorage.getItem("language") || user || "en";
    } else {
      this.language = localStorage.getItem("language") || "en";
    }
  }

  _decode(string) {
    return string
      .replace(/\\n/g, "\n")
      .replaceAll("\\'", "'")
      .replaceAll('\\"', '"')
      .replaceAll("\\\\", "\\")
      .replaceAll("\\t", "\t");
  }
  async loadStrings(lang) {
    const language = lang || this.language;
    const version = ++this.loadVersion;
    this.language = language;
    const readValues = async (path) => {
      const response = await fetch(path);
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      const xml = new DOMParser().parseFromString(await response.text(), "text/xml");
      if (xml.querySelector("parsererror")) throw new Error(`Invalid XML: ${path}`);
      const values = {};
      for (const string of xml.getElementsByTagName("string")) {
        values[string.getAttribute("name")] = this._decode(string.textContent);
      }
      return values;
    };
    const defaults = Object.keys(this.defaultValues).length
      ? Promise.resolve(this.defaultValues)
      : readValues("res/values/strings.xml").catch((error) => {
          console.warn(error);
          return this.defaultValues;
        });
    const selected = readValues(`res/values-${language}/strings.xml`).catch((error) => {
      console.warn(error);
      return {};
    });
    const [defaultValues, selectedValues] = await Promise.all([defaults, selected]);
    if (version !== this.loadVersion) return;
    this.defaultValues = defaultValues;
    this.selectedValues = selectedValues;
    if (lang)
      this.updateDom();
  }
  getString(name) {
    return this.selectedValues[name] || this.defaultValues[name];
  }
  updateDom() {
    const allElements = Array.prototype.slice.call(
      document.body.getElementsByTagName("*"),
    );
    allElements.forEach((el) => {
      const name = el.getAttribute("name");
      if (name) {
        const value = this.getString(name);
        if (value) el.innerHTML = value.replaceAll("\n", "<br>");
      }
    });
  }
  updateLanguage(el) {
    const lang = el.attributes.lang.value;
    localStorage.setItem("language", lang);
  }
  loadLanguageSelectInput(el) {
    const element = el.children[0].children[0].children[0];
    for (const option of element.children) {
      if (option.attributes.lang.value == this.language) {
        langSelect.childNodes[0].textContent = option.innerText;
        const headerText = document.getElementById('headerLangText');
        if (headerText) headerText.textContent = option.innerText;
        break;
      }
    }
  }
  setAttribute(el) {
    el.setAttribute("lang", this.language);
  }
  changeLang(a) {
    const lang = a.target.attributes.lang.value
    console.log("Language change to: " + lang)
    LoadingScreen.unload();
    langSelect.childNodes[0].textContent = a.target.innerText;
    const headerText = document.getElementById('headerLangText');
    if (headerText) headerText.textContent = a.target.innerText;
    langSel.setAttribute("value", lang);
    this.updateLanguage(a.target);
    this.loadStrings(lang);
    if (document.activeElement) document.activeElement.blur();
    setTimeout(() => {
      LoadingScreen.loaded();
    }, 400);
  }
  langEvent(e) {
    if (e.target.closest('#langOption')) {
      if (e.target.tagName.toLowerCase() === 'div') {
        this.changeLang(e);
      }
      return;
    }
    
    const isLangSelect = e.target.closest('#langSelect') !== null;
    const isGlobe = e.target.closest('#globe-container') !== null || e.target.closest('#globe') !== null;
    
    if (isLangSelect || isGlobe) {
      const langBorder = document.getElementById("langBorder");
      const langOption = document.getElementById("langOption");
      if (isGlobe) {
        document.getElementById("globe-container").appendChild(langBorder);
        langOption.style.top = "calc(100% + 5px)";
        langOption.style.bottom = "auto";
      } else {
        langSelect.appendChild(langBorder);
        langOption.style.bottom = "calc(100% + 5px)";
        langOption.style.top = "auto";
      }
      
      document.body.classList.toggle("visible");
      return;
    }
    if (document.body.classList.contains("visible")){
      document.body.classList.remove("visible");
    }
  };
  onwheel = window.onwheel = function (e) {
    if (e.target.id == langSelect.id || e.target.attributes.lang) {
      return;
    }
    document.body.classList.remove("visible");
  }
}
