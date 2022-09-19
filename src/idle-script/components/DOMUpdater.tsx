import { useEffect } from "preact/hooks";
import { useGlobalState } from "../../state";

export default function Updater() {
  const [blocklist, _] = useGlobalState("blocklist");

  const ratings = document.querySelectorAll(".box-rating ul li a");

  useEffect(() => {
    ratings.forEach((node) => {
      if (
        blocklist.hasOwnProperty(node?.textContent?.trim().toLowerCase() ?? "")
      ) {
        (node as HTMLElement).style.display = "none";
      } else {
        (node as HTMLElement).style.removeProperty("display");
      }
    });

    return () => {};
  }, [JSON.stringify(blocklist)]);
  return null;
}
