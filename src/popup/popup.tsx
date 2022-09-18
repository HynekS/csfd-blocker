import { Fragment, h, render } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import {
  LockClosedIcon,
  PencilIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/20/solid";

import { useGlobalState } from "../state";
import "./popup.css";

import type { IBlocklist, IResponse } from "../types";

type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

function ObjectEntries<T extends object>(t: T): Entries<T>[] {
  return Object.entries(t) as any;
}

type Unit = keyof typeof units;

const LOCALE = "en-GB";

const units = {
  year: 24 * 60 * 60 * 1000 * 365,
  month: (24 * 60 * 60 * 1000 * 365) / 12,
  week: 24 * 60 * 60 * 1000 * 7,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
};

const getRelativeTime = (
  timestamp: number,
  limit = units.week,
  locale = LOCALE
): string | null => {
  const rtf: Intl.RelativeTimeFormat = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  const elapsed = timestamp - new Date().getTime();

  if (Math.abs(elapsed) > limit) return null;

  for (const u of Object.keys(units)) {
    if (Math.abs(elapsed) > units[u as Unit] || u == "second")
      return rtf.format(Math.round(elapsed / units[u as Unit]), u as Unit);
  }
  return null;
};

const BlockListItem = ({
  item,
}: {
  item: IBlocklist[keyof IBlocklist] & {
    userNameLowerCase: keyof IBlocklist & string;
  };
}) => {
  const handleClick = () => {
    chrome.runtime.sendMessage(
      { type: "USER_REMOVED", payload: item.userNameLowerCase },
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
  };

  const timestamp = new Date(item.dateAdded).getTime();
  const relativeDate = getRelativeTime(timestamp);

  return (
    <li class="pt-2 pb-2.5 mb-1 bg-white flex justify-between items-center">
      <div>
        <div class="text-sm font-bold text-zinc-600">
          {item.userNamePreservedCase ?? item.userNameLowerCase}
        </div>
        <div class="text-xs text-zinc-400 leading-tight">
          added{" "}
          {relativeDate ?? new Date(item.dateAdded).toLocaleDateString(LOCALE)}
        </div>
      </div>

      <button
        onClick={handleClick}
        class="rounded-full p-1 hover:bg-[#F9DCDC] hover:text-primary transition-colors"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </li>
  );
};

const BlockList = ({ blocklist = {} }) => {
  const sortedBlocklist = ObjectEntries<IBlocklist>(blocklist)
    .map(([key, values]) => ({
      ...values,
      userNameLowerCase: key.toLowerCase(),
    }))
    .sort((a, b) => (a.dateAdded > b.dateAdded ? -1 : 1));

  return (
    <div class="flex-1">
      {sortedBlocklist.length ? (
        <ul class="pb-3 divide-y divide-solid">
          {sortedBlocklist.map((item) => (
            <BlockListItem key={item.userNameLowerCase} item={item} />
          ))}
        </ul>
      ) : (
        <div class="flex h-full justify-center items-center pb-4">
          <span>The blocklist is empty.</span>
        </div>
      )}
    </div>
  );
};

interface ITab {
  label: "Block users" | "Edit blocklist";
  key: "block users" | "edit blocklist";
  Icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
}

const tabs: readonly ITab[] = [
  { label: "Block users", key: "block users", Icon: LockClosedIcon },
  { label: "Edit blocklist", key: "edit blocklist", Icon: PencilIcon },
];

type TabProps = ITab & {
  isActive: boolean;
  handleClick: h.JSX.MouseEventHandler<HTMLElement>;
};

const Tab = <T extends typeof tabs[number]>({
  key,
  label,
  Icon,
  isActive,
  handleClick,
}: TabProps) => {
  return (
    <li
      key={key}
      class={`flex gap-3 items-center font-semibold p-4 border-t border-b border-b-transparent cursor-pointer ${
        isActive
          ? "bg-white"
          : "bg-zinc-200 text-zinc-500 border-b border-b-zinc-300 border-t-transparent hover:bg-zinc-300/50"
      }`}
      onClick={handleClick}
    >
      <span
        class={`flex shrink-0 rounded-full w-7 h-7 items-center justify-center ${
          isActive ? "text-sky-700 bg-sky-300/25" : "bg-zinc-400/25"
        }`}
      >
        <Icon className="w-4 h-4 opacity-50" />
      </span>
      <span class="leading-tight">{String(label)}</span>
    </li>
  );
};

const ClearConfirmDialog = ({ elem }: { elem: Element }) => {
  const removeSelfFromDOM = () => {
    (elem.parentNode as Element)?.remove();
  };

  const handleConfirm = () => {
    removeSelfFromDOM();
    chrome.runtime.sendMessage(
      {
        type: "BLOCKLIST_CLEARED",
      },
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
  };

  return (
    <div class="w-full font-semibold">
      <div class="bg-white text-zinc-700">
        Are you sure you want to clear the blocklist?
      </div>
      <div class="flex justify-end gap-2">
        <button
          class="px-2 py-1 bg-zinc-900 text-white rounded border-transparent hover:bg-zinc-700 transition-colors"
          onClick={handleConfirm}
        >
          Clear
        </button>
        <button
          class="px-2 py-1 bg-white text-zinc-600 rounded border hover:bg-zinc-50 transition-colors"
          onClick={removeSelfFromDOM}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const Popup = () => {
  const [blocklist, _] = useGlobalState("blocklist");
  const [activeTab, setActiveTab] =
    useState<typeof tabs[number]["key"]>("block users");

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeTab]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (inputRef && inputRef.current.value) {
      chrome.runtime.sendMessage(
        {
          type: "USER_ADDED",
          payload: inputRef.current.value,
        },
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

      inputRef.current.value = "";
    }
  };

  const clearBlocklist = () => {
    let dialogContainer = document.createElement("div");
    render(<ClearConfirmDialog elem={dialogContainer} />, dialogContainer);

    Toastify({
      node: dialogContainer,
      duration: -1,
      style: {
        background: "#FFFFFF",
      },
    }).showToast();
  };

  return (
    <div id="app-root" class="w-[240px] text-zinc-700">
      <header class="relative">
        <div class="absolute top-4 right-6 w-4 h-4 text-zinc-400 hover:text-zinc-500 transition-colors">
          <a
            href="https://github.com/HynekS/csfd-blocker"
            target="__blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .296c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.306.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 6.099c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.771.84 1.235 1.911 1.235 3.221 0 4.608-2.807 5.624-5.479 5.921.43.372.823 1.101.823 2.222v3.293c0 .318.191.693.801.575C20.566 22.093 24 17.596 24 12.296c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </header>
      <header class="flex gap-2 mb-4 justify-center items-center py-8 px-5">
        <img
          src="icon-32.png"
          width="32"
          height="32"
          alt=""
          class="w-[32px] h-[32px]"
        />
        <h1 class="text-2xl text-primary leading-[0.75]">
          <span>
            <span class="block mt-4">
              <span class="font-bold">CSFD </span>
              <span>Blocker</span>
            </span>
            <span class="text-xs text-zinc-400 font-semibold ml-1">
              They s<span class="font-bold text-primary">*</span>uck? You block!
            </span>
          </span>
        </h1>
      </header>

      <nav>
        <ul class="flex divide-x">
          {tabs.map(({ key, label, Icon }) => (
            <Tab
              key={key}
              label={label}
              Icon={Icon}
              isActive={activeTab === key}
              handleClick={() => setActiveTab(key)}
            ></Tab>
          ))}
        </ul>
      </nav>
      {activeTab === "block users" && (
        <div class="p-8">
          <h2 class="text-base text-zinc-400 font-semibold mb-1">
            Add to Blocklist
          </h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              ref={inputRef}
              placeholder="verbal"
              class="border px-2 py-1.5 mb-3 mr-0.5 w-full outline-none rounded-sm focus:ring-2 focus:ring-sky-400 focus:bg-sky-50 focus:placeholder-sky-400 transition-colors"
            />
            <button class="bg-zinc-900 text-white rounded px-4 py-3 px-4 flex justify-center gap-2 items-center w-full hover:bg-zinc-700 transition-colors">
              <span class="font-semibold text-sm">Block user</span>
            </button>
          </form>
        </div>
      )}
      {activeTab === "edit blocklist" && (
        <Fragment>
          {Object.keys(blocklist).length > 2 && <div class="shadow h-2"></div>}
          <div class="p-8 h-64 scrollbar-thin scrollbar-thumb-zinc-400 hover:scrollbar-thumb-zinc-500 scrollbar-track-zinc-200  scrollbar-thumb-rounded-full overflow-y-scroll flex flex-col">
            <div class="flex justify-between items-center">
              <h2 class="text-base text-zinc-400 font-semibold mb-1 flex-1">
                Blocklist
              </h2>
              <div class="flex items-center font-semibold text-zinc-400">
                <span>({Object.keys(blocklist).length} </span>
                <UserIcon className="w-3 h-3 text-zinc-400" />
                <span>)</span>
              </div>
            </div>

            <BlockList blocklist={blocklist} />
            <button
              onClick={clearBlocklist}
              class="bg-zinc-50 border rounded px-4 py-2 hover:bg-zinc-100 text-zinc-600 hover:text-zinc:700 transition-colors"
            >
              Clear blocklist
            </button>
          </div>
        </Fragment>
      )}
      <footer class="px-5 py-0.5 bg-gradient-to-r from-[#F9DCDC] to-[#F0A8A8] text-[9px] text-primary font-semibold"></footer>
    </div>
  );
};

export default Popup;
