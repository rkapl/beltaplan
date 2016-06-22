/// <reference path="../ui/dialog.ts" />
namespace App{
    export interface ReadyCallback{
        ():void;
    }
    
    var localStorageSupported = window.indexedDB && window.localStorage;
    var localStorageDb: IDBDatabase;
    var htmlPlanName: HTMLInputElement;
    
    var currentPlanId: number;
    
    class OpenPlanDialog extends Ui.Dialog{
        constructor(){
            super(() => {});
            this.html.classList.add('open-dialog');
            
            if(localStorageSupported){
                var savedHeader = document.createElement('h2');
                savedHeader.innerText = "Saved plans";
                this.html.appendChild(savedHeader);
            }
            
            var fromTextHeader = document.createElement('h2');
            fromTextHeader.innerText = "Import/Export";
            this.html.appendChild(fromTextHeader);
            
            var textArea = document.createElement('textarea');
            this.html.appendChild(textArea);
            
            var serializeBar = document.createElement('div');
            serializeBar.classList.add('dialog-buttons');
            
            var buttonExport = document.createElement('button');
            buttonExport.innerText = "Export";
            buttonExport.addEventListener('click', () => {
               var json = {
                   'saveData': 'beltaplan',
                   'planName': htmlPlanName.value
                };
               plan.savePlan(json);
               textArea.value = JSON.stringify(json); 
            });
            serializeBar.appendChild(buttonExport);
            
            var buttonImport = document.createElement('button');
            buttonImport.innerText = "Import";
            buttonImport.addEventListener('click', () => {
                try{
                    var json = JSON.parse(textArea.value);
                    if(json['saveData'] != 'beltaplan'){
                        warning("Not a valid plan");
                        return;
                    }
                    var plan = Plan.loadPlan(json, (plan: Plan.GamePlan) => {
                       setPlan(plan); 
                       this.hide();
                    });
                }catch(syntaxError){
                    warning((<SyntaxError>syntaxError).message);
                }
            });
            serializeBar.appendChild(buttonImport);
            
            this.html.appendChild(serializeBar);
        }
    }

    export function initLocalStorage(callback:ReadyCallback){
        
        htmlPlanName = <HTMLInputElement> document.getElementById('plan-name'); 
        if(!localStorageSupported){
            loadData('base-0.12', (data) => {
                setPlan(createDefaultPlan(data));
                callback();
            });
        }else{
            document.getElementById('button-open').addEventListener('click', () => {
                new OpenPlanDialog().show();
            });
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
                loadData('base-0.12', (data) => {
                    create('Example Plan', createDefaultPlan(data), callback);
                });
            }
        } 
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
    }
    function loadById(planId: number, cb: ReadyCallback ){
        
    }
    function save(cb: ReadyCallback){
        
    }
}
