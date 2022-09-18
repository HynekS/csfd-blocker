import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";
import Toastify from "toastify-js";

import Menu from "./Menu";
import MenuItem from "./MenuItem";
import UnbanIcon from "./UnbanIcon";
import { PREFIX } from "../../constants";

import type { IResponse } from "../../types/index";

export default function Blocked({
  element,
  userName,
}: {
  element: Element;
  userName: string;
}) {
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
    element.addEventListener("transitionend", (e) =>
      console.log("end transition! ", e)
    );

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
                    style: {
                      background: "linear-gradient(to right, #ED9699, #C02126)",
                      fontWeight: "600",
                    },
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
}
