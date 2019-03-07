/// <reference path="api.ts" />
namespace LibStorage.Local{
    // http://stackoverflow.com/questions/9267899/arraybuffer-to-base64-encoded-string
    function arrayBufferToBase64( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

    function base64ToArrayBuffer(base64) {
        var binary_string =  window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes.buffer;
    }

    export interface Options{
        prefix: string;
    }
    
    function fireEvent(p: Provider, event: string, ... args:any[]){
        for(var l of p._listeners){
            if(l[event])
                l[event].apply(args);
        }
    }
    
    export class Provider implements LibStorage.Provider{
        _listeners: StorageListener[] = [];
        
        isLocal():boolean{
            return true;
        }
        isSupported():boolean{
            return !!window.localStorage;
        }
        checkFileName(name: string): boolean | string{
            if(name.indexOf('.') != -1)
                return "Filename can not contain dots";
            if(name.indexOf('/') != -1)
                return "Filename can not contain slashes";
                
            return true;
        }
        getLocation(optionsGeneric: any) {
            var opts = <Options>optionsGeneric;
            return new Location(this, opts.prefix);
        }
        addListener(l: StorageListener){
            if(this._listeners.indexOf(l) == -1)
                this._listeners.push(l);
        }
        removeListener(l: StorageListener){
            var index = this._listeners.indexOf(l);
            if(index != -1)
                this._listeners.splice(index, 1);
        }
    }
    
    export class Location implements LibStorage.Location {
        public _storage: Storage;
        public _listing: LibStorage.FileListing;
        public _completePrefix: string;
        constructor(private _provider: Provider, public prefix:string){
            this._storage = window.localStorage;
            this._completePrefix = "libstorage/" + prefix + "/";
        }
        provider(): Provider{
            return this._provider;
        }
        list(): LibStorage.FileListing{
            var r = <LibStorage.FileListing> {}
            for(var k in this._listing){
                r[k] = this._listing[k];
            }
            return r;
        }
        connect(success: () => void){
            var op = {
                type: 'connect',
                provider: this._provider,
                location: this
            }
            fireEvent(this._provider, 'connectStarted', op);
            
            this._listing = {};
            for(var i = 0; i<this._storage.length; i++){
                var name = this._storage.key(i);
                if(name.indexOf(this._completePrefix) == 0){
                    var d = new Document(this, name.substring(this._completePrefix.length));
                    this._listing[d.name()] = d;
                }
            }
            
            fireEvent(this._provider, 'connectFinished', op)
            success();
        }
         open(name: string, mode: LibStorage.OpenMode): LibStorage.Document{
             if(this._listing[name]){
                 if(mode == 'open-or-create' || mode == 'open')
                    return <Document>this._listing[name];
                 else
                    throw new LibStorage.NameTakenException();
             }else{
                 if(mode == 'open-or-create' || mode == 'create'){
                     var doc = new Document(this, name);
                     this._listing[name] = doc;
                     return doc;
                 }else{
                     throw new LibStorage.NameNotFoundException();
                 }
             }
         }
    }
    
    export class Document implements LibStorage.Document{
        private _provider: Provider;
        private _fullName: string;
        private _name: string;
        constructor(private _location: Location, _name: string){
            this._provider = <Provider> _location.provider();
            this.setName(_name);
        }
        private setName(name: string){
            this._fullName = this._location._completePrefix + name;
            this._name = name;
        }
        location(): LibStorage.Location{
            return this._location;
        }
        name(): string{
            return this._name;
        }
        get(success: (data: Blob) => void): Operation{
            var op = {
                type: <LibStorage.OperationType> 'get',
                provider: this._provider,
                location: this._location,
                document: this,
                data: undefined
            };
            fireEvent(this._provider, 'getStarted', op);
            
            var blob = new Blob([base64ToArrayBuffer(this._location._storage.getItem(this._fullName))]);
            op.data = blob;
            
            success(blob);
            fireEvent(this._provider, 'getFinished', op);
            return op;
        }
        set(data: Blob, success: () => void): Operation{
            var op = {
                type: <LibStorage.OperationType> 'get',
                provider: this._provider,
                location: this._location,
                document: this,
                data: data
            };
            
            fireEvent(this._provider, 'setStarted', op);
            
            var reader = new FileReader();
            reader.readAsArrayBuffer(data);
            reader.onload = () =>{
                var base64 = arrayBufferToBase64(reader.result);
                this._location._storage.setItem(this._fullName, base64);
                success();  
                fireEvent(this._provider, 'setFinished', op);
            };
            return op;
        }
        remove(success: () => void): Operation {
            var op = {
                type: <LibStorage.OperationType> 'get',
                provider: this._provider,
                location: this._location,
                document: this,
                data: undefined,
            };
            fireEvent(this._provider, 'removeStarted', op);
            this._location._storage.removeItem(this._fullName);            
            delete this._location._listing[this._name];
            success();
            fireEvent(this._provider, 'removeFinished', op);
            return op;
        }
        rename(newName: string, success: () => void):Operation{
            if(this._location._listing[newName])
                throw new NameTakenException();
            var op = {
                type: <LibStorage.OperationType> 'get',
                provider: this._provider,
                location: this._location,
                document: this,
                data: undefined,
            };
            fireEvent(this._provider, 'renameStarted', op);
            
            var data = this._location._storage.getItem(this._fullName);
            delete this._location._listing[this._name];
            this._location._storage.removeItem(this._fullName); 
            this.setName(newName);
            this._location._listing[this._name] = this;
            this._location._storage.setItem(this._fullName, data)
            
            success();
            fireEvent(this._provider, 'renameFinished', op);
            return op;
        }
    }
}