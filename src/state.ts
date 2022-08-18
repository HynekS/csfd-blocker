import { createGlobalState } from "react-hooks-global-state";
import { getChromeStorageValue } from "./utils/storage";

import type { IBlocklist } from "./types";

const listener = async () => {
  const { blocklist = {} } = await getChromeStorageValue<{
    blocklist: IBlocklist;
  }>(["blocklist"]);
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

export { useGlobalState };
