window.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("injectedStyle")) {
    let styleLink = document.createElement("link");
    styleLink.setAttribute("id", "injectedStyle");
    styleLink.setAttribute("rel", "stylesheet");
    styleLink.setAttribute(
      "href",
      chrome.runtime.getURL("injected-styles.css")
    );
    document.head.appendChild(styleLink);
  }
});
