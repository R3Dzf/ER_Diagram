import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
const root = new URL("../", import.meta.url);
const contents = path => readFileSync(new URL(path, root), "utf8");

test("guest sign-in is discoverable, accessible, and separate from account management", () => {
  const { document } = parseHTML(contents("public/studio/index.html"));
  const signIn = document.querySelector("#headerGoogleSignIn");
  assert.ok(signIn);
  assert.equal(signIn.getAttribute("href"), "/account/google.html");
  assert.equal(signIn.getAttribute("target"), "_top");
  assert.match(signIn.textContent, /Sign in with Google/);
  assert.ok(document.querySelector("#accountBtn"));
  assert.ok(document.querySelector("#mobileMoreBtn[aria-expanded='false']"));
  assert.ok(document.querySelector("#mobileMoreMenu[hidden]"));
  for (const action of ["import", "save", "share", "collaborate", "appearance", "install", "account"]) {
    assert.ok(document.querySelector(`[data-mobile-action="${action}"]`));
  }
});

test("notation choices are explicit, accessible, and share the existing saved model", () => {
  const { document } = parseHTML(contents("public/studio/index.html"));
  const strip = document.querySelector(".drawing-area > .notation-strip");
  assert.ok(strip);
  assert.ok(document.querySelector("#notationSelect"));
  const options = [...strip.querySelectorAll("button[data-notation]")];
  assert.deepEqual(options.map(b => b.dataset.notation), ["chen", "crowfoot"]);
  assert.ok(options.every(b => b.getAttribute("aria-pressed") !== null));
  assert.match(contents("public/studio/app.js"), /select\.onchange\(\{target:select\}\)/);
});

test("responsive stylesheet is loaded after base styles, with mobile and dark controls", () => {
  const { document } = parseHTML(contents("public/studio/index.html"));
  const paths = [...document.querySelectorAll('link[rel="stylesheet"]')].map(x => x.getAttribute("href"));
  assert.ok(paths.indexOf("ux-refinements.css") > paths.indexOf("theme.css"));
  const css = contents("public/studio/ux-refinements.css");
  assert.match(css, /@media\(max-width:760px\)/);
  assert.match(css, /@media\(max-width:440px\)/);
  assert.match(css, /\[data-theme="dark"\] \.notation-strip/);
  assert.match(css, /\.header-google-signin/);
  assert.match(css, /\.mobile-more-menu:not\(\[hidden\]\)/);
  assert.match(css, /\.notation-segments button\[aria-pressed="true"\]/);
  const cache = contents("public/sw.js");
  assert.ok(cache.includes("/studio/ux-refinements.css"), "Offline shell must cache responsive styles");
});

test("editor trims redundant explanations and exposes concise actions", () => {
 const html=contents("public/studio/index.html");
 assert.doesNotMatch(html,/Switch views from the bar above the canvas/);
 assert.doesNotMatch(html,/Switch views without changing your model/);
 assert.match(html,/>SQL<\/button>/);
 assert.match(html,/>History<\/button>/);
 const css=contents("public/studio/ux-refinements.css");
 assert.match(css,/\.inspector \.inspector-tips\{display:none\}/);
 assert.match(css,/\.palette \.shape-tools small\{display:none\}/);
});
test("history sync uses the same /studio/ route without disrupting share hashes", () => {
 const app=contents("public/studio/app.js");
 assert.match(app,/window\.history\[replace\?'replaceState':'pushState'\]/);
 assert.match(app,/window\.addEventListener\('popstate'/);
 assert.match(app,/url\.searchParams\.set\('diagram',activeId\)/);
 assert.match(app,/url\.searchParams\.set\('view','templates'\)/);
 assert.match(app,/url\.pathname\+url\.search\+url\.hash/);
});
