namespace Plan{
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Source extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        private providesItem: GameData.Item;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        itemTransferFunction(){
            
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.participant.provides.clear();
            this.participant.provides.add(item);
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
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            
            var header = document.createElement('h3');
            header.textContent = this.providesItem.name + " source";
            contents.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.textContent = 'Change produced item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.plan, ()=>{
                    this.setItem(d.selected);
                    this.updateIncludingNeighbours();
                });
                d.show();
            };
            contents.appendChild(itemButton);
            
            contents.appendChild(this.createPropertyDisplay('Provides', 
                this.participant.fromConnectionsConsumption(this.providesItem).toFixed(), 'i/m'));
        }
    }
}