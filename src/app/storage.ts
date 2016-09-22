/// <reference path="../ui/dialog.ts" />

var factorioDefaultVersion: string;
var factorioVersions: string[];

namespace App{
    export interface ReadyCallback{
        ():void;
    }
    
    // TODO: local storage is not finished and the UI is disabled as of yet
    //var localStorageSupported = window.indexedDB && window.localStorage;
    var localStorageSupported = false;
    var localStorageDb: IDBDatabase;
    var filesSupported = File && FileReader && FileList && Blob && URL.createObjectURL;
    var htmlPlanName: HTMLInputElement;
    
    var currentPlanId: number;
    
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
                    setPlan(new Plan.GamePlan(data));
                    htmlPlanName.value = "New Plan";
                    this.hide();
                });
            };
            newPlanBar.appendChild(newPlanButton);
            
            this.html.appendChild(newPlanBar);
            
            if(localStorageSupported){
                var savedHeader = document.createElement('h2');
                savedHeader.textContent = "Saved plans";
                this.html.appendChild(savedHeader);
            }
            
            var fromTextHeader = document.createElement('h2');
            fromTextHeader.textContent = "Import/Export";
            this.html.appendChild(fromTextHeader);
                       
            var serializeBar = document.createElement('div');
            serializeBar.classList.add('dialog-buttons');
            
            var buttonExport = document.createElement('button');
            buttonExport.textContent = "Export";
            buttonExport.addEventListener('click', () => {
               var json = {
                   'saveData': 'beltaplan',
                   'planName': htmlPlanName.value
                };
               plan.savePlan(json);
               var data = new Blob([JSON.stringify(json)],
                    {type:'application/vnd.rkapl.factorio'});
               var url = URL.createObjectURL(data);
               
               var link = document.createElement('a');
               (<any>link).download = json.planName + '.bpl';
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
                if(fileInput.files.length != 1)
                    alert('Select a file');
                var file = fileInput.files[0];
                var reader = new FileReader();
                reader.onload = () => {
                    loadFromJSON(reader.result, () => this.closeOk());
                };
                reader.readAsText(file)                
            });
            serializeBar.appendChild(buttonImport);
            
            this.html.appendChild(serializeBar);
        }
    }

    export function initLocalStorage(callback:ReadyCallback){
        htmlPlanName = <HTMLInputElement> document.getElementById('plan-name');
        document.getElementById('button-open').addEventListener('click', () => {
                new OpenPlanDialog().show();
            });
         
        if(!localStorageSupported){
            loadExamplePlan(callback);
        }else{
            
            // prepare the database
            var req = indexedDB.open('plans');
            req.onupgradeneeded = () =>{
                var db = <IDBDatabase> req.result;
                var planStore = db.createObjectStore('plans', {keyPath: 'id'});
                var nameStore = db.createObjectStore('plan_names', {keyPath: 'id'})
                var nameStoreById = nameStore.createIndex('by_id', 'id', {unique: true});
            };
            req.onerror = () => {
              error("Can not open plan storage DB");  
            };
            req.onsuccess = () => {
                localStorageDb = <IDBDatabase> req.result;
                callback();
            }
            
            // load default plan 
            var lastPlanId = window.localStorage.getItem('lastPlanId');
            if(lastPlanId){
                loadById(lastPlanId, callback);
            }else{
                loadExamplePlan(callback);
            }
        } 
    }
    function loadExamplePlan(callback: ReadyCallback){
        var req = new XMLHttpRequest();
        req.addEventListener('load', () => {
            loadFromJSON(req.responseText, callback);
        });
        req.open('GET', 'default-plan.bpl', true);
        req.send();
    }
    export function planChanged(){
        // request for save
    }
    function setPlan(plan: Plan.GamePlan){
        // set the plan and let interested components know
        App.plan = plan;
        plan.listeners.add(new TileSelectionListener());
        initPlacementForPlan();
        viewport.showPlan(plan);
    }
    function create(name: string, plan: Plan.GamePlan, cb: ReadyCallback){
        App.plan = plan;
        htmlPlanName.value = name;
        setPlan(plan);
        cb();
    }
    function loadById(planId: number, cb: ReadyCallback ){
        
    }
    function loadFromJSON(text: string, callback: () => void){
        try{
            var json = JSON.parse(text);
            if(json['saveData'] != 'beltaplan'){
                warning("Not a valid plan");
                return;
            }
            htmlPlanName.value = json['planName'];
            var plan = Plan.GamePlan.loadPlan(json, (plan: Plan.GamePlan) => {
                setPlan(plan);
                callback(); 
            });
        }catch(syntaxError){
            warning((<SyntaxError>syntaxError).message);
        }
    }
    function save(cb: ReadyCallback){
        
    }
}
