import { h, VNode, toChildArray } from "preact";

import { PREFIX } from "../../constants";

export default function MenuItem({
  onClick,
  children,
  onClose,
}: {
  onClick: (event?: Event | undefined) => void;
  onClose?: () => void;
  children: VNode | VNode[];
}) {
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
}
