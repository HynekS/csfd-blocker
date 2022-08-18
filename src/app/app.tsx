import { h } from "preact";
import { useRef } from "preact/hooks";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

import { useGlobalState } from "../state";
import "./app.css";

import type { IBlocklist, IResponse } from "../types";

type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

// Todo extract to utils
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

const ListItem = ({
  item,
}: {
  item: IBlocklist[keyof IBlocklist] & {
    userNameLowerCase: keyof IBlocklist & string;
  };
}) => {
  const handleClick = () => {
    chrome.runtime.sendMessage(
      { type: "USER_REMOVED", payload: item.userNameLowerCase },
      (response) => {
        console.log(response);
      }
    );
  };

  const timestamp = new Date(item.dateAdded).getTime();
  const relativeDate = getRelativeTime(timestamp);

  return (
    <li class="border rounded py-1 px-2 mb-1">
      <div>
        <strong>{item.userNamePreservedCase ?? item.userNameLowerCase}</strong>
      </div>
      <small>
        added{" "}
        {relativeDate ?? new Date(item.dateAdded).toLocaleDateString(LOCALE)}
      </small>
      <button onClick={handleClick}>remove</button>
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
    <div>
      {sortedBlocklist.length ? (
        <ul class="pb-2">
          {sortedBlocklist.map((item) => (
            <ListItem key={item.userNameLowerCase} item={item} />
          ))}
        </ul>
      ) : (
        "The blocklist is empty"
      )}
    </div>
  );
};

const App = () => {
  const [blocklist, _] = useGlobalState("blocklist");

  const inputRef = useRef<HTMLInputElement>(null);

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
          }).showToast();
        }
      );

      inputRef.current.value = "";
    }
  };

  const clearBlocklist = () => {
    chrome.runtime.sendMessage({
      type: "BLOCKLIST_CLEARED",
    });
  };

  return (
    <div id="app-root" class="p-8">
      <h1 class="text-2xl text-red-600"> Let's block them!</h1>
      <div>
        <h2 class="text-lg font-medium mt-4">Add to Blocklist</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            ref={inputRef}
            placeholder="verbal"
            class="border px-2 py-1 mb-2"
          />
          <button class="bg-gray-100 rounded px-4 py-2">Block user</button>
        </form>
      </div>
      <h2 class="text-lg font-medium mt-4">Blocklist</h2>
      <BlockList blocklist={blocklist} />
      <button onClick={clearBlocklist} class="bg-gray-100 rounded px-4 py-2">
        Clear blocklist
      </button>
    </div>
  );
};

export default App;
