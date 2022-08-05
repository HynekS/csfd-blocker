import {
  clearChromeStorage,
  getChromeStorageValue,
  setChromeStorageValue,
} from "./utils/storage";
import { DOMAIN_PATTERN } from "./constants";
import type { IBlocklist, IResponse } from "./types";

chrome.runtime.onMessage.addListener(function (
  request,
  sender,
  sendResponse: (response: IResponse) => void
) {
  chrome.tabs.query({ url: DOMAIN_PATTERN }, function (tabs = []) {
    tabs.forEach(function () {
      switch (request.type) {
        case "USER_REMOVED": {
          getChromeStorageValue<{ blocklist: IBlocklist }>(["blocklist"])
            .then(({ blocklist = {} }) => {
              if (blocklist[request.payload.toLowerCase()]) {
                delete blocklist[request.payload.toLowerCase()];
              }
              return blocklist;
            })
            .then((blocklist) =>
              setChromeStorageValue<{ blocklist: IBlocklist }>({ blocklist })
            )
            .then(() => {
              sendResponse({
                type: "SUCCESS",
                message: `User ${request.payload} was unblocked`,
              });
            });
          break;
        }

        case "USER_ADDED": {
          // Is from popup?
          const isUserInput = sender.origin?.startsWith("chrome-extension");

          getChromeStorageValue<{ blocklist: IBlocklist }>(["blocklist"])
            .then(({ blocklist = {} }) => {
              if (
                blocklist.hasOwnProperty(request.payload.toLowerCase()) &&
                isUserInput
              ) {
                sendResponse({
                  type: "NOTICE",
                  message: `User ${request.payload} is already blocked`,
                });
                return;
              }

              if (blocklist.hasOwnProperty(request.payload.toLowerCase())) {
                blocklist[request.payload.toLowerCase()].userNamePreservedCase =
                  request.payload;

                sendResponse({
                  type: "NOTICE",
                  message: `User ${request.payload} is already blocked`,
                });
                return setChromeStorageValue<{ blocklist: IBlocklist }>({
                  blocklist,
                });
              }

              // New record
              blocklist[request.payload.toLowerCase()] = {
                dateAdded: +new Date(),
                ...(!isUserInput && { userNamePreservedCase: request.payload }),
              };
              return setChromeStorageValue<{ blocklist: IBlocklist }>({
                blocklist,
              });
            })
            .then(() => {
              sendResponse({
                type: "SUCCESS",
                message: `User ${request.payload} has been blocked`,
              });
            });
          break;
        }

        case "BLOCKLIST_CLEARED": {
          clearChromeStorage().then(() => {
            sendResponse({
              type: "SUCCESS",
              message: "Blocklist has been cleared",
            });
          });
          break;
        }

        default:
          const errorMessage = `Something went wrong (Unknown event type)`;
          sendResponse({
            type: "ERROR",
            message: errorMessage,
          });
          throw new Error(errorMessage);
      }
    });
  });

  return true;
});
