import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

import { getChromeStorageValue } from "../utils/storage";
import "./app.scss";

import type { IBlocklist, IResponse } from "../types";

type Entries<T> = { [K in keyof T]: [K, T[K]] }[keyof T];

// Todo extract to utils
function ObjectEntries<T extends object>(t: T): Entries<T>[] {
  return Object.entries(t) as any;
}

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

  return (
    <li>
      <strong>{item.userNamePreservedCase ?? item.userNameLowerCase}</strong>
      <small>added {new Date(item.dateAdded).toDateString()}</small>
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
        <ul>
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

// NOTE: the storage updates could be done in service worker altogether (gain: single source of truth)
const App = () => {
  const [blocklist, setBlocklist] = useState({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const listener = async () => {
      const { blocklist = {} } = await getChromeStorageValue<{
        blocklist: IBlocklist;
      }>(["blocklist"]);

      setBlocklist(blocklist);
    };
    chrome.storage.onChanged.addListener(listener);
    return () => {
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  useEffect(() => {
    const getChromeStorageData = async () => {
      const { blocklist = {} } = await getChromeStorageValue<{
        blocklist: IBlocklist;
      }>(["blocklist"]);
      setBlocklist(blocklist);
    };
    getChromeStorageData();
  }, []);

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
    <div id="app-root">
      <h1 style={{ transition: " all 0.5s ease" }}> Let's block them!</h1>
      <div>
        <h2>Add to Blocklist</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" ref={inputRef} placeholder="verbal" />
          <button>Add to blocklist</button>
        </form>
      </div>
      <h2>Blocklist</h2>
      <BlockList blocklist={blocklist} />
      <button onClick={clearBlocklist}>Clear blocklist</button>
      <hr />
    </div>
  );
};

export default App;
