import { h, render, Fragment, cloneElement, VNode, toChildArray } from "preact";
import { useState, useRef, useEffect } from "preact/hooks";
import { createGlobalState } from "react-hooks-global-state";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

import { PREFIX } from "./constants";
import useOnClickOutside from "./hooks/useOnClickOuside";
import { getChromeStorageValue } from "./utils/storage";

import type * as CSS from "csstype";
import type { IBlocklist, IResponse } from "./types";

const targets = [
  "article[id^='review']",
  "article[id^='highlight-post-']:not(.deleted)",
];

const listener = async () => {
  const { blocklist = {} } = await getChromeStorageValue<{
    blocklist: IBlocklist;
  }>(["blocklist"]);
  console.log("Blocklist updated from listener!");
  setGlobalState("blocklist", blocklist);
};
chrome.storage.onChanged.addListener(listener);

const initialState = {
  blocklist: {},
};
const { useGlobalState, setGlobalState } = createGlobalState(initialState);

(async () => {
  getChromeStorageValue<{
    blocklist: IBlocklist;
  }>(["blocklist"]).then(({ blocklist = {} }) =>
    setGlobalState("blocklist", blocklist)
  );
})();

const Blocked = ({
  element,
  userName,
}: {
  element: Element;
  userName: string;
}) => {
  const [isShown, setIsShown] = useState(false);

  const showChildren = (parent: Element) => {
    // TODO remove the actual component from the list
    // TODO Fix images
    [...parent.children].forEach((node) => {
      (node as HTMLElement).style.maxHeight = node.scrollHeight + "px";
      (node as HTMLElement).removeAttribute("aria-hidden");
    });
  };

  const hideChildren = (parent: Element) => {
    // TODO remove the actual component from the list
    // TODO Fix images
    [...parent.children].forEach((node) => {
      (node as HTMLElement).style.removeProperty("max-height");
      (node as HTMLElement).ariaHidden = "true";
    });
  };

  useEffect(() => {
    element.classList.add(`${PREFIX}__hide-children`);
    hideChildren(element);

    return () => {
      element.classList.remove(`${PREFIX}__hide-children`);
      showChildren(element);
    };
  }, []);

  return (
    <Fragment>
      <div class={`${PREFIX}__blocked-header__container`}>
        <span class={`${PREFIX}__blocked-header__label`}>
          blocked by <strong>csfd blocker</strong>
        </span>
        <button
          class={`${PREFIX}__blocked-header__button`}
          onClick={() => {
            if (isShown) {
              hideChildren(element);
              return setIsShown(false);
            }
            if (!isShown) {
              showChildren(element);
              return setIsShown(true);
            }
          }}
        >
          {isShown ? "Hide Post" : "Show Post"}
        </button>
      </div>
      {isShown ? (
        <Menu style={{ top: "37px", right: 0 }}>
          <MenuItem
            onClick={() => {
              chrome.runtime.sendMessage(
                { type: "USER_REMOVED", payload: userName },
                function (response: IResponse) {
                  Toastify({
                    text: response.message,
                    duration: 2000,
                  }).showToast();
                }
              );
            }}
          >
            <Fragment>
              <UnbanIcon />
              <span class={`${PREFIX}__menu__label`}>
                Unblock user <strong>{userName}</strong>
              </span>
            </Fragment>
          </MenuItem>
        </Menu>
      ) : null}
    </Fragment>
  );
};

const Root = ({
  element,
  userName,
}: {
  element: Element;
  userName: string;
}) => {
  const [blocklist, _] = useGlobalState("blocklist");

  const isBlocklisted = (name: string) =>
    blocklist && blocklist.hasOwnProperty(name.toLowerCase());

  return isBlocklisted(userName) ? (
    <Blocked element={element} userName={userName} />
  ) : (
    <Menu style={{ top: "12px", right: 0 }}>
      <MenuItem
        onClick={() => {
          chrome.runtime.sendMessage(
            { type: "USER_ADDED", payload: userName },
            function (response: IResponse) {
              Toastify({
                text: response.message,
                duration: 2000,
              }).showToast();
            }
          );
        }}
      >
        <Fragment>
          <BanIcon />
          <span class={`${PREFIX}__menu__label`}>
            Block user <strong>{userName}</strong>
          </span>
        </Fragment>
      </MenuItem>
    </Menu>
  );
};

const Menu = ({
  style,
  children,
}: {
  style: CSS.Properties;
  children: VNode | VNode[];
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMenuOpened, setIsMenuOpened] = useState(false);
  useOnClickOutside(ref, () => setIsMenuOpened(false));

  return (
    <div class={`${PREFIX}__menu__container`} ref={ref} style={{ ...style }}>
      <button
        class={`${PREFIX}__menu__button`}
        onClick={() => setIsMenuOpened(!isMenuOpened)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          class={`${PREFIX}__menu__button-icon`}
        >
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>
      <div
        class={`${PREFIX}__menu__menu ${
          isMenuOpened && `${PREFIX}__menu__menu--active`
        }`}
      >
        <div class={`${PREFIX}__menu__arrow`}></div>
        {toChildArray(children).map((child) =>
          cloneElement(child as VNode, {
            onClose: () => {
              setIsMenuOpened(false);
            },
          })
        )}
      </div>
    </div>
  );
};

const BanIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      class={`${PREFIX}__menu__button-icon`}
    >
      <path
        fill-rule="evenodd"
        d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
        clip-rule="evenodd"
      />
    </svg>
  );
};

const UnbanIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      class={`${PREFIX}__menu__button-icon`}
    >
      <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
    </svg>
  );
};

const MenuItem = ({
  onClick,
  children,
  onClose,
}: {
  onClick: (event?: Event | undefined) => void;
  onClose?: () => void;
  children: VNode | VNode[];
}) => {
  return (
    <button
      class={`${PREFIX}__menu__button ${PREFIX}__menu__button--menu-item`}
      onClick={() => {
        onClick();
        typeof onClose === "function" && onClose();
      }}
    >
      {toChildArray(children)}
    </button>
  );
};

const renderToContainingNode = (element: Element) => {
  const containerElement = document.createElement("div");

  const userName =
    element.querySelector('a[href^="/uzivatel/"]')?.textContent ?? "";

  element.append(containerElement);
  render(<Root element={element} userName={userName} />, containerElement);
};

async function main() {
  targets.forEach((target) => {
    document.querySelectorAll(target).forEach((node) => {
      renderToContainingNode(node);
    });
  });
  // TODO do in a loop, avoid non-null asserts
  if (document.getElementById("snippet--comments") instanceof HTMLElement)
    document.getElementById("snippet--comments")!.style.visibility = "visible";
  if (document.getElementById("topPost") instanceof HTMLElement)
    document.getElementById("topPost")!.style.visibility = "visible";
}

main();
