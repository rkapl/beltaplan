namespace Ui{
    var dialog_initialized = false;
    
    export interface DialogCallback{
        (d: Dialog) : void;
    }
    export class Dialog{
        // TODO: fix focus leaving this homemade dialog and other event weirdness
        html: HTMLElement;
        constructor(public cb: DialogCallback){
            this.html = document.getElementById('dialog-contents');
            this.html.className = '';
        }
        show(){
            var dlg = document.getElementById('dialog'); 
            if(!dialog_initialized){
                dialog_initialized = true;
                for(var x of ['keypress', 'keydown', 'keyup']){
                    dlg.addEventListener(x, (ev) => ev.stopPropagation());
                }
                window.addEventListener('keydown', (ev) => {
                    if(ev.keyCode == 27){
                        this.hide();
                    }
                });
                document.getElementById('dialog-close-button').addEventListener('click', () => {
                   hideCurrentDialog(); 
                });
            }
            dlg.style.display = 'flex';
        }
        closeOk(){
            this.hide();
            this.cb(this);
        }
        closeCancel(){
            this.hide();
        }
        hide(){
            hideCurrentDialog();
        }
    }
    function hideCurrentDialog(){
        var html = this.html = document.getElementById('dialog-contents');
        while(html.hasChildNodes())
           html.removeChild(this.html.lastChild);
        document.getElementById('dialog').style.display = 'none';
    }
    
}