namespace Ui{
    var dialog_initialized = false;
    
    export interface DialogCallback{
        (d: Dialog) : void;
    }
    export class Dialog{
        html: HTMLElement;
        constructor(public cb: DialogCallback){
            this.html = document.getElementById('dialog-contents');
        }
        show(){
            var dlg = document.getElementById('dialog'); 
            if(!dialog_initialized){
                dialog_initialized = true;
                for(var x of ['keypress', 'keyup', 'keydown']){
                    dlg.addEventListener(x, (ev) => ev.stopPropagation());
                }
            }
            dlg.style.display = 'block';
        }
        closeOk(){
            this.hide();
            this.cb(this);
        }
        hide(){
            while(this.html.hasChildNodes())
                this.html.removeChild(this.html.lastChild);
            document.getElementById('dialog').style.display = 'none';
            this.html.className = "";
        }
    }
    
    
}