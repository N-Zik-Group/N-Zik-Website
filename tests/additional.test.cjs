const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../js/additional.js"), "utf8");

function createPreviews(reducedMotion = false) {
  const previews = Array.from({ length: 2 }, () => ({
    playCalls: 0,
    paused: true,
    play() {
      this.playCalls++;
      this.paused = false;
      return Promise.resolve();
    },
    pause() { this.paused = true; },
  }));
  const motion = new EventTarget();
  motion.matches = reducedMotion;
  const observed = new Set();
  let observer;
  const themeIcon = {
    classList: { toggle() {} },
    getAttribute() {},
    setAttribute() {},
    addEventListener() {},
  };

  vm.runInNewContext(script, {
    document: {
      body: { classList: { contains: () => false } },
      getElementById: (id) => id === "toggledark" ? themeIcon : null,
      querySelectorAll: (selector) => selector === "video" ? previews : [],
      addEventListener() {},
    },
    multilingual: { getString() {}, stringLanguage: () => "en", directionFor: () => "ltr" },
    window: new EventTarget(),
    matchMedia: (query) => query === "(prefers-reduced-motion: reduce)" ? motion : new EventTarget(),
    IntersectionObserver: class {
      constructor(callback) {
        this.callback = callback;
        observer = this;
      }
      observe(target) { observed.add(target); }
      unobserve(target) { observed.delete(target); }
      disconnect() { observed.clear(); }
    },
  });

  return {
    previews,
    observed,
    notifyIntersection(target, isIntersecting, intersectionRatio) {
      observer.callback([{ target, isIntersecting, intersectionRatio }], observer);
    },
    setReducedMotion(matches) {
      motion.matches = matches;
      motion.dispatchEvent(new Event("change"));
    },
  };
}

test("previews wait until at least a quarter of the video is visible", () => {
  const { previews: [first, second], observed, notifyIntersection } = createPreviews();
  assert.deepEqual(observed, new Set([first, second]));
  assert.equal(first.playCalls, 0);
  notifyIntersection(first, false, 0);
  notifyIntersection(first, true, 0.1);
  assert.equal(first.playCalls, 0);
  notifyIntersection(first, true, 0.25);
  assert.equal(first.playCalls, 1);
  assert.equal(first.paused, false);
  assert.equal(second.playCalls, 0);
});

test("reduced motion suppresses autoplay and pauses a playing preview", async () => {
  const { previews: [preview], observed, notifyIntersection, setReducedMotion } = createPreviews(true);
  assert.equal(observed.size, 0);
  notifyIntersection(preview, true, 1);
  assert.equal(preview.playCalls, 0);

  await preview.play();
  setReducedMotion(false);
  assert.ok(observed.has(preview));
  setReducedMotion(true);
  assert.equal(preview.paused, true);
  assert.equal(observed.size, 0);
  notifyIntersection(preview, true, 1);
  assert.equal(preview.playCalls, 1);
});

test("a preview autostarts once and stays manually paused after returning into view", () => {
  const { previews: [first, second], observed, notifyIntersection, setReducedMotion } = createPreviews();
  notifyIntersection(first, true, 1);
  assert.equal(first.playCalls, 1);
  assert.equal(observed.has(first), false);
  first.pause();

  // An entry queued before unobserve can still be delivered.
  notifyIntersection(first, false, 0);
  notifyIntersection(first, true, 1);
  assert.equal(first.playCalls, 1);
  assert.equal(first.paused, true);

  setReducedMotion(true);
  setReducedMotion(false);
  assert.equal(observed.has(first), false);
  assert.equal(first.paused, true);
  assert.ok(observed.has(second));
  notifyIntersection(second, true, 1);
  assert.equal(second.playCalls, 1);
});
