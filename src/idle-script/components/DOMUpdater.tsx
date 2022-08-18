import { useEffect } from "preact/hooks";
import { useGlobalState } from "../../state";

export default function Updater() {
  const [blocklist, _] = useGlobalState("blocklist");
  useEffect(() => {
    // update DOM

    console.log("blocklist has changed!");
    return () => {};
  }, [JSON.stringify(blocklist)]);
  return null;
}
