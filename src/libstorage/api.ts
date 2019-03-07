namespace LibStorage{    
    export type OperationType = "connect" | "get" | "set" | "rename" | "delete";
    
    export type OpenMode = "open" | "create" | "open-or-create";
    
    export class NameTakenException{}
    export class NameNotFoundException{}
     
    export interface Operation{
        type: OperationType;
        provider: Provider;
        location?: Location;
        document?: Document;
        data?: Blob;
    }
    
    export interface OperationCallback{
        (op: Operation): void;
    }
    
    export interface StorageListener{
        error?: (description: string, op: Operation) => void;
        
        connectStarted?: OperationCallback;
        connectFinished?: OperationCallback;
        
        setStarted?: OperationCallback;
        setFinished?: OperationCallback;
        getStarted?: OperationCallback;
        getFinished?: OperationCallback;
        renameStarted?: OperationCallback;
        renameFinished?: OperationCallback;
        deleteStarted?: OperationCallback;
        deleteFinished?: OperationCallback;
    }
          
    export interface Provider{
        checkFileName(name: string): boolean | string;
        getLocation(options: any): Location;
        isLocal(): boolean;
        isSupported(): boolean;
        
        addListener(l: StorageListener);
        removeListener(l: StorageListener);
    }
    
    export interface FileListing{
        [name: string]: Document;
    }
    
    export interface Location{
        provider(): Provider;
        connect(success: () => void);
        list(): FileListing;
        open(name: string, mode: OpenMode): Document;
    }
    
    export interface Document{
        location(): Location;
        name(): string;
        
        get(success: (data: Blob) => void): Operation;
        set(data: Blob, success: () => void): Operation;
        remove(success: () => void): Operation;
        rename(newName: string, success: () => void): Operation;
    }
}