export interface IBlocklist {
  [userName: string]: {
    userNamePreservedCase?: string;
    dateAdded: number;
  };
}

export interface IResponse {
  type: "SUCCESS" | "NOTICE" | "ERROR";
  message: string;
}

export interface ITarget {
  selector: string;
  tag: string;
}
