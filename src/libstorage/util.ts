namespace LibStorage.Util{
    type Callback = ()=>void ;
    
    export class DelayedSave{
        // delay after the last edit, in ms
        saveDelay: number = 2000;
        // save interval during editing, usually larger
        saveInterval: number = 10000;
        
        // the process is two step, to avoid unnecessary timeout rescheduling
        // on each save, first a zero length timeout is scheduled which then schedules
        // the actual save timeout. This helps buffer the schedules
        private zeroTimeout: number;
        private saveTimeout: number;
        
        unsaved: boolean;
        savePending: boolean;
        private firstChangeTime: Date;
        
        private waiting:Callback[] = [];
        
        constructor(){
            this.zeroTimeout = null;
            this.unsaved = false;
            this.savePending = false;
        }
        
        waitForSave(cb:Callback){
            if(this.savePending){
                this.waiting.push(cb);
            }else if(this.unsaved){
                this.savePending = true;
                this.saveCallback();
                this.reconsider();
                this.waiting.push(cb);
            }else{
                cb();
            }
        }
        
        saveComplete(){
            for(var cb of this.waiting)
                cb();
                
            this.waiting = [];
            
            var doCallback = this.savePending && this.stateChangeCallback;
                
            this.unsaved = false;
            this.savePending = false;
            
            if(doCallback)
                this.stateChangeCallback();
            
            this.reconsider();
        }
        
        changed(){
            if(this.waiting.length > 0)
                throw "Changed call when waiting for save";
                
            if(!this.unsaved)
                this.firstChangeTime = new Date();            
            var doCallback = !this.unsaved && this.stateChangeCallback;
            this.unsaved = true;
            
            if(doCallback)
                this.stateChangeCallback();
                
            this.reconsider();
        }
        
        private reconsider(){
            if(this.unsaved && !this.savePending){
                if(this.zeroTimeout === null){
                    this.zeroTimeout = window.setTimeout(() => {
                        this.zeroTimeout = null;
                        this.setupTimer();
                    }, 0);
                }
            }else{
                if(this.zeroTimeout)
                    window.clearTimeout(this.zeroTimeout);
                if(this.saveTimeout)
                    window.clearTimeout(this.saveTimeout);
      
            }
        }
        
        private setupTimer(){
            if(this.savePending)
                throw "Internal error - save and save timer still pending";
            var now = new Date().getTime();
            var delayDeadline = now + this.saveDelay;
            var intervalDeadline = this.firstChangeTime.getTime() + this.saveInterval;
            var rdeadline = Math.min(delayDeadline, intervalDeadline) - now;
            if(rdeadline < 0)
                rdeadline = 0;
                
            this.saveTimeout = window.setTimeout(() => {
                this.savePending = true;
                this.firstChangeTime = new Date();
                this.saveCallback();
            }, rdeadline);
        }
        
        saveCallback: () => void;
        stateChangeCallback: () => void;
    }
}