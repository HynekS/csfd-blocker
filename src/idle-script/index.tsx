import { h, render } from "preact";

import "toastify-js/src/toastify.css";

import DOMUpdater from "./components/DOMUpdater";
import InjectedNode from "./components/InjectedNode";

import type { ITarget } from "../types";

const targets = [
  {
    selector: "article[id^='review']",
    tag: "review",
  },
  {
    selector: "article[id^='highlight-post-']:not(.deleted)",
    tag: "comment",
  },
] as const;

const renderToContainingNode = (element: Element, context: ITarget) => {
  const containerElement = document.createElement("div");

  const userName =
    element.querySelector('a[href^="/uzivatel/"]')?.textContent ?? "";

  element.append(containerElement);
  render(
    <InjectedNode element={element} userName={userName} context={context} />,
    containerElement
  );
};

async function main() {
  targets.forEach((target) => {
    document.querySelectorAll(target.selector).forEach((node) => {
      renderToContainingNode(node, target);
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
