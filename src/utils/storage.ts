export function getChromeStorageValue<T>(keys: string | string[]): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(keys, function (value) {
        resolve(value as T);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function setChromeStorageValue<T>(obj: T): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(obj, function () {
        resolve(obj);
      });
    } catch (err) {
      reject(err);
    }
  });
}

export function clearChromeStorage(cb?: (args?: any) => any, ...args: any) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.clear(function () {
        resolve(cb ? cb(...args) : undefined);
      });
    } catch (err) {
      reject(err);
    }
  });
}
