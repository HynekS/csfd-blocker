import { h, Fragment } from "preact";
import Toastify from "toastify-js";
import { PREFIX } from "../../constants";

import { useGlobalState } from "../../state";
import BanIcon from "./BanIcon";
import Blocked from "./Blocked";
import Menu from "./Menu";
import MenuItem from "./MenuItem";

import type { IResponse, ITarget } from "../../types";

const positions = {
  review: { top: "12px", right: "0" },
  comment: { top: "17px", right: "0" },
};

export default function InjectedNode({
  element,
  userName,
  context,
}: {
  element: Element;
  userName: string;
  context: ITarget;
}) {
  const [blocklist, _] = useGlobalState("blocklist");

  const isBlocklisted = (name: string) =>
    blocklist && blocklist.hasOwnProperty(name.toLowerCase());

  return isBlocklisted(userName) ? (
    <Blocked element={element} userName={userName} />
  ) : (
    <Menu
      style={{ ...(positions[context.tag as keyof typeof positions] || {}) }}
    >
      <MenuItem
        onClick={() => {
          chrome.runtime.sendMessage(
            { type: "USER_ADDED", payload: userName },
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
          <BanIcon />
          <span class={`${PREFIX}__menu__label`}>
            Block user <strong>{userName}</strong>
          </span>
        </Fragment>
      </MenuItem>
    </Menu>
  );
}
