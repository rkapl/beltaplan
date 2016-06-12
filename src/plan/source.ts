namespace Plan{
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Source extends ItemTile implements BusParticipant{
        connectedTo: Bus;
        needs: Set<GameData.Item> = new Set();
        provides: Set<GameData.Item> = new Set();
        blocks: Set<GameData.Item> = new Set();;
        providesItem: GameData.Item;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.provides.clear();
            this.provides.add(item);
            this.providesItem = item;
        }
        isBusParticipant():boolean{
            return true;
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Source';
        }
        overlay(ctx: CanvasRenderingContext2D){
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "center";
        }
        setMissing(missing: any){
            // can not happen
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            
            var header = document.createElement('h3');
            header.textContent = this.providesItem.name + " source";
            contents.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.innerText = 'Change produced item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.plan, ()=>{
                    this.setItem(d.selected);
                    this.updateState();
                });
                d.show();
            };
            contents.appendChild(itemButton);
        }
    }
}