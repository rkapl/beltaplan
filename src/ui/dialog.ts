namespace Ui{
    var dialog_initialized = false;
    
    export interface DialogCallback{
        (d: Dialog) : void;
    }
    export class Dialog{
        // TODO: fix focus leaving this homemade dialog and other event weirdness
        html: HTMLElement;
        htmlDialog: HTMLElement;
        private preventClosingFlag: boolean;
        constructor(public cb: DialogCallback){
            this.html = document.getElementById('dialog-contents');
            this.html.className = '';
        }
        show(){
            this.htmlDialog = document.getElementById('dialog'); 
            if(!dialog_initialized){
                dialog_initialized = true;
                this.htmlDialog.addEventListener('keypress', (ev) => {
                   
                    ev.stopPropagation();
                });
                this.htmlDialog.addEventListener('keydown', (ev) => {
                    if(ev.keyCode == 9){ // tab
                        this.keepFocusInDialog(ev);
                    }
                    ev.stopPropagation();
                });
                this.htmlDialog.addEventListener('keyup', (ev) => {
                    ev.stopPropagation();
                });
                this.htmlDialog.addEventListener('wheel', (ev) => {
                   ev.stopPropagation(); 
                });
                window.addEventListener('keydown', (ev) => {
                     if(ev.keyCode == 27){
                        this.hide();
                    }
                });
                document.getElementById('dialog-close-button').addEventListener('click', () => {
                   hideCurrentDialog(); 
                });
            }
            this.htmlDialog.style.display = 'flex';
            
            document.getElementById('dialog-close-button').focus();
        }
        keepFocusInDialog(ev: KeyboardEvent){
            // focusable items (approximation), for constraining the tab order,
            // algorithm from https://www.w3.org/TR/wai-aria-practices/#trap_focus
            var focusables = this.htmlDialog.querySelectorAll('input, textarea, button, a[href]')
            var first = <HTMLElement> focusables[0];
            var last = <HTMLElement> focusables[focusables.length - 1];
            
            if(first == last){
                ev.preventDefault();
            }else if(first == document.activeElement && ev.shiftKey){
                last.focus();
                ev.preventDefault();
            }else if(last == document.activeElement && !ev.shiftKey){
                first.focus();
                ev.preventDefault();
            }
        }
        preventClosing(){
            this.preventClosingFlag = true;
        }
        closeOk(){
            this.preventClosingFlag = false;
            this.cb(this);
            this.hide();
        }
        closeCancel(){
            this.hide();
        }
        hide(){
            if(this.preventClosingFlag){
                this.preventClosingFlag = false;
                return;                
            }
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