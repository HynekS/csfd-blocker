import { h, render } from "preact";

import "toastify-js/src/toastify.css";

import DOMUpdater from "./components/DOMUpdater";
import InjectedNode from "./components/InjectedNode";

const targets = [
  "article[id^='review']",
  "article[id^='highlight-post-']:not(.deleted)",
];

const renderToContainingNode = (element: Element) => {
  const containerElement = document.createElement("div");

  const userName =
    element.querySelector('a[href^="/uzivatel/"]')?.textContent ?? "";

  element.append(containerElement);
  render(
    <InjectedNode element={element} userName={userName} />,
    containerElement
  );
};

async function main() {
  targets.forEach((target) => {
    document.querySelectorAll(target).forEach((node) => {
      renderToContainingNode(node);
    });
  });
  const containerFragment = document.createDocumentFragment();
  document.body.append(containerFragment);
  render(<DOMUpdater />, containerFragment);

  ["#snippet--comments", "#topPost"].forEach((selector) => {
    let selected = Array.from(document.querySelectorAll(selector));
    selected.forEach((element) => {
      (element as HTMLElement).style.visibility = "visible";
    });
  });
}

main();
