import { h, VNode, toChildArray, cloneElement } from "preact";
import { useState, useRef } from "preact/hooks";

import { PREFIX } from "../../constants";
import useOnClickOutside from "../../hooks/useOnClickOuside";

import type * as CSS from "csstype";

export default function Menu({
  style,
  children,
}: {
  style: CSS.Properties;
  children: VNode | VNode[];
}) {
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
}
