declare module 'react-native-sqlite-storage' {
  export interface SQLiteDatabase {
    transaction: (fn: (tx: SQLTransaction) => void) => void;
    executeSql: (sql: string, params?: any[]) => Promise<[SQLResultSet]>;
    close: () => Promise<void>;
  }

  export interface SQLTransaction {
    executeSql: (
      sql: string,
      params?: any[],
      success?: (tx: SQLTransaction, result: SQLResultSet) => void,
      error?: (tx: SQLTransaction, error: SQLError) => boolean
    ) => void;
  }

  export interface SQLResultSet {
    insertId: number;
    rowsAffected: number;
    rows: {
      length: number;
      item: (index: number) => any;
      raw: () => any[];
    };
  }

  export interface SQLError {
    code: number;
    message: string;
  }

  namespace SQLite {
    export interface SQLiteDatabase {
      transaction: (fn: (tx: SQLTransaction) => void) => void;
      executeSql: (sql: string, params?: any[]) => Promise<[SQLResultSet]>;
      close: () => Promise<void>;
    }
  }

  const SQLite: {
    DEBUG: (enable: boolean) => void;
    enablePromise: (enable: boolean) => void;
    openDatabase: (
      config: {
        name: string;
        location?: string;
        createFromLocation?: string;
      },
      success?: (database: SQLiteDatabase) => void,
      error?: (error: SQLError) => void
    ) => SQLiteDatabase;
    deleteDatabase: (config: { name: string; location?: string }) => Promise<void>;
    SQLiteDatabase: SQLiteDatabase;
  };

  export default SQLite;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';
  
  export default class MaterialIcons extends Component<IconProps> {}
}
