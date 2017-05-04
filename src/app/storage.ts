/// <reference path="../ui/dialog.ts" />
/// <reference path="../libstorage/localstorage.ts" />
/// <reference path="../libstorage/util.ts" />

var factorioDefaultVersion: string;
var factorioVersions: string[];

namespace App{
    export interface ReadyCallback{
        ():void;
    }
    var examplePlanName = 'Example plan';
    var filesSupported = File && FileReader && FileList && Blob && URL.createObjectURL;
    
    var lastPlanName: string;
    var htmlPlanName: HTMLInputElement;
    var htmlSaving: HTMLElement;
    
    var backend = new LibStorage.Local.Provider();
    var useLocalStorage = backend.isSupported();
    var storage = backend.getLocation({prefix: 'beltalpan'});
    var currentDocument: LibStorage.Document;
    var saveTimer: LibStorage.Util.DelayedSave = new LibStorage.Util.DelayedSave(); 
    
    class OpenPlanDialog extends Ui.Dialog{
        constructor(){
            super(() => {});
            
            if(!filesSupported){
                alert('Your browser does not support saving and loading local files');
                this.closeCancel();
            }           
            this.html.classList.add('open-dialog');
            
            var newPlanHeader = document.createElement('h2');
            newPlanHeader.textContent = "New Plan";
            this.html.appendChild(newPlanHeader);
            
            var newPlanBar = document.createElement('dialog-buttons');
            newPlanBar.classList.add('dialog-buttons');
            var planVersionCombo = document.createElement('select');
            for(var i = 0; i < factorioVersions.length; i++){
                var value = document.createElement('option');
                value.textContent = factorioVersions[i];
                value.value = factorioVersions[i];
                
                console.log(factorioDefaultVersion);
                   planVersionCombo.appendChild(value);
            }
            planVersionCombo.value = factorioDefaultVersion;
            newPlanBar.appendChild(planVersionCombo);
            
            var newPlanButton = document.createElement('button');
            newPlanButton.textContent = "Create";
            newPlanButton.style.display = 'inline-block';
            newPlanButton.onclick = () => {
                App.loadData(planVersionCombo.value, (data) => {
                    create(new Plan.GamePlan(data), () => this.destroy());
                });
            };
            newPlanBar.appendChild(newPlanButton);
            
            this.html.appendChild(newPlanBar);
            
            if(useLocalStorage){
                var savedHeader = document.createElement('h2');
                savedHeader.textContent = "Saved plans";
                this.html.appendChild(savedHeader);
                
                var fileList = document.createElement('ol');
                fileList.classList.add('file-list');
                var files = Object.keys(storage.list());
                files.sort();
                
                for(var k of files){
                    var fileLi = document.createElement('li');
                    fileLi.innerHTML = k;
                    fileLi.onclick = ((k) => () => {
                        var doc = storage.open(k, 'open');
                        doc.get((blob) => {
                            loadPlanFromBlob(blob, () => this.closeOk(), () => doc);
                        });
                    })(k);
                    fileList.appendChild(fileLi);
                }
                
                this.html.appendChild(fileList);
                
                var savesBar = document.createElement('div');
                
                if(files.length > 1 && currentDocument){
                    var docToDelete = currentDocument;
                    var buttonDelete = document.createElement('button');
                    buttonDelete.textContent = "Delete currently open plan";
                    buttonDelete.onclick = () => {
                        files.splice(files.indexOf(currentDocument.name()), 1);
                        
                        var doc = storage.open(files[0], "open");
                        doc.get((blob) => {
                            loadPlanFromBlob(blob, () =>{
                                docToDelete.remove(() => this.closeOk());
                            }, () => doc);
                        });
                    }
                    
                    savesBar.appendChild(buttonDelete);
                }
                
                this.html.appendChild(savesBar);
            }
            
            var fromTextHeader = document.createElement('h2');
            fromTextHeader.textContent = "Import/Export";
            this.html.appendChild(fromTextHeader);
                       
            var serializeBar = document.createElement('div');
            serializeBar.classList.add('dialog-buttons');
            
            var buttonExport = document.createElement('button');
            buttonExport.textContent = "Export";
            buttonExport.addEventListener('click', () => {
               var data = savePlanToBlob();
               var url = URL.createObjectURL(data);
               
               var link = document.createElement('a');
               (<any>link).download = htmlPlanName.value + '.bpl';
               link.target='_blank';
               link.href = url;
               document.body.appendChild(link);
               link.click();
               window.setTimeout(() => URL.revokeObjectURL(url), 2000);
            });
            serializeBar.appendChild(buttonExport);
            
            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            serializeBar.appendChild(fileInput);
            
            var buttonImport = document.createElement('button');
            buttonImport.textContent = "Import";
            buttonImport.addEventListener('click', () => {
                if(fileInput.files.length != 1){
                    alert('Select a file');
                    return;
                }
                var file = fileInput.files[0];
                loadPlanFromBlob(file, () => this.closeOk(), (json) => {
                    if(useLocalStorage){
                        try{
                            return storage.open(json.planName, 'create');
                        }catch(ex){
                            warning('You already have plan named ' + json.planName);
                        }
                    }
                    return null;
                });
            });
            serializeBar.appendChild(buttonImport);
            
            this.html.appendChild(serializeBar);
        }
    }
    
    function storeLastPlanName(){
        if(document)
            window.localStorage.setItem('lastPlan', lastPlanName);
    }
    
    function setPlan(plan: Plan.GamePlan, document: LibStorage.Document, name: string, cb: () => void){
        saveTimer.waitForSave(() => {            
            // set the plan and let interested components know
            App.plan = plan;
            currentDocument = document;
            htmlPlanName.value = name;
            lastPlanName = name;
            storeLastPlanName();
            
            plan.listeners.add(new TileSelectionListener());
            plan.listeners.add({
                changed: () => saveTimer.changed()
            });
            initPlacementForPlan();
            viewport.showPlan(plan);
            saveTimer.changed();
            
            cb();
        });
    }
    
    function create(plan: Plan.GamePlan, cb: () => void){       
        window.localStorage.setItem('lastPlan', name);
        var name = "New Plan";
        var document;
        if(useLocalStorage){
            var fileList = storage.list();
            for(var i = 1; i < 10000; i++){
                name = "New Plan #"+i;
                if(!(name in fileList))
                    break;
            }
            document = storage.open(name, 'create')
        }
        setPlan(plan, document, name, cb);
    }
    
    function importExamplePlan(callback: ReadyCallback){
        var req = new XMLHttpRequest();
        req.responseType = 'blob';
        req.addEventListener('load', () => {
            if(useLocalStorage && examplePlanName in storage.list()){
                var doc = storage.open(examplePlanName, 'open');
                doc.get((blob) => {
                    loadPlanFromBlob(blob, callback, () => doc);
                });
            }else{
                loadPlanFromBlob(req.response, callback, (json) => {
                    if(useLocalStorage){
                            return storage.open(examplePlanName, 'create');
                    }
                    return null;
                });
            }
        });
        req.open('GET', 'default-plan.bpl', true);
        req.send();
    }
    
    export function initLocalStorage(cb: ()=>void){
        htmlPlanName = <HTMLInputElement> document.getElementById('plan-name');
        htmlSaving = document.getElementById('saving-notification');
        document.getElementById('button-open').addEventListener('click', () => {
            new OpenPlanDialog().show();
        });
        
        if(backend.isSupported){
            backend.addListener({
                error: (description: string, op: LibStorage.Operation) => {
                    alert(description);
                } 
            });
            
            saveTimer.saveCallback = () => {
                if(currentDocument){
                    if(lastPlanName != htmlPlanName.value){
                        lastPlanName = htmlPlanName.value;
                        storeLastPlanName();
                        currentDocument.rename(htmlPlanName.value, () => {
                            currentDocument.set(savePlanToBlob(), () => saveTimer.saveComplete());
                        });
                    }else{
                        currentDocument.set(savePlanToBlob(), () => saveTimer.saveComplete());
                    }
                }else{
                    saveTimer.saveComplete();
                }
            };
            
            saveTimer.stateChangeCallback = () => {
                htmlSaving.style.display = (saveTimer.unsaved && currentDocument) ? '' : 'none';
            };
            
            htmlPlanName.onchange = () => {
                saveTimer.changed();
            };
            
            storage.connect(() => {
                var lastPlanName = window.localStorage.getItem('lastPlan');
                if(lastPlanName == null){
                    importExamplePlan(cb);
                }else{
                    try{
                        var doc = storage.open(lastPlanName, 'open');
                        doc.get((blob) => {
                            loadPlanFromBlob(blob, cb, () => doc);
                        });
                    }catch(ex){
                        // backup
                        importExamplePlan(cb);
                    }
                }
            });
        }else{
            saveTimer.saveCallback = () => saveTimer.saveComplete();
            importExamplePlan(cb);
        }
    }
    
    function savePlanToBlob(): Blob{
        var json = {
            'saveData': 'beltaplan',
            'planName': htmlPlanName.value
        };
        plan.savePlan(json);
        return new Blob([JSON.stringify(json)],
            {type:'application/vnd.rkapl.factorio'});
    }
    
    function loadPlanFromBlob(blob: Blob, success: () => void, documentProvider: (json) => LibStorage.Document){
        var fr = new FileReader();
        fr.onload = () => {
            try{
                var json = JSON.parse(fr.result);
                var document;
                if(json['saveData'] != 'beltaplan'){
                    warning("Not a valid plan");
                    return;
                }
                
                try{
                    document = documentProvider(json);
                }catch(ex){
                    return;
                }
                
                var plan = Plan.GamePlan.loadPlan(json, (plan: Plan.GamePlan) => {
                    setPlan(plan, document, json.planName, success);
                });
            }catch(syntaxError){
                warning((<SyntaxError>syntaxError).message);
            }
        };
        fr.readAsText(blob);
    }
}
