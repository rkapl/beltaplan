namespace Plan{
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Sink extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        private needsItem: GameData.Item;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Sink';
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.participant.needs.clear();
            this.participant.needs.add(item);
            this.needsItem = item;
        }
        isBusParticipant():boolean{
            return true;
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
            header.textContent = this.needsItem.name + " sink";
            contents.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.innerText = 'Change consumed item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.plan, ()=>{
                    this.setItem(d.selected);
                    this.updateIncludingNeighbours();
                });
                d.show();
            };
            contents.appendChild(itemButton);
        }
    }
}