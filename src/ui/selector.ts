namespace Ui{
    export interface DialogItemAdapter<T>{
        imageUrl(item: T): string;
    }
    
    export class Selector<T> extends Dialog{
        selected: T;
        filterInput: HTMLInputElement;
        imageContainer: HTMLDivElement;
        filtered: HTMLImageElement[] = [];
        
        constructor(
            cb: DialogCallback, 
            public adapter: DialogItemAdapter<T>, 
            public items: {[key: string]: T})
        {
            super(cb);
            this.html.classList.add("select-dialog");
            
            var filter = this.filterInput = document.createElement('input');
            filter.type = 'text';
            filter.addEventListener('keyup', (ev) => {
                if(ev.keyCode == 13 && this.filtered.length == 1){
                    // fast-accept on enter
                    this.filtered[0].click();
                }else if(ev.keyCode == 27){
                    this.closeCancel();
                }else{
                    this.filter()
                }
            });
            filter.addEventListener('change', () => this.filter());
            this.html.appendChild(filter);
            
            var div = this.imageContainer = document.createElement('div');
            this.html.appendChild(div);
            
            var keys:string[] = [];
            for(var itemKey in items){
                keys.push(itemKey);
            }
            
            keys.sort();
            this.filtered = [];
            for(var itemName of keys){
                var item  = items[itemName];
                var img = new Image();
                img.title = itemName;
                img.src = adapter.imageUrl(item);
                ((item) => {
                    img.addEventListener('click', ()=>{
                       this.selected = item;
                       this.closeOk();
                    });
                })(item);
                this.filtered.push(img);
                div.appendChild(img);
            }
        }
        show(){
            super.show();
            this.filterInput.focus();
        }
        filter(){
            this.filtered = [];
            for(var i=0; i<this.imageContainer.childNodes.length; i++){
                var img = <HTMLImageElement> this.imageContainer.childNodes[i];
                if(img.title.search(this.filterInput.value) == -1){
                    img.style.display = 'none';
                }else{
                    img.style.display = '';
                    this.filtered.push(img);
                }
            }
        }
    }
}