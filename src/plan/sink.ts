namespace Plan{
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Sink extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        private needsItem: GameData.Item;
        private consumption: number = 5;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        itemTransferFunction(){
            var c = this.participant.toConnections.get(this.needsItem);
            c.consumption = this.consumption;
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Sink';
            json.consumption = this.consumption;
        }
        deserialize(json){
            super.deserialize(json);
            this.consumption = json.consumption;
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
        isItemMissing(){
            return !this.participant.toConnections.has(this.needsItem);
        }
        overlay(ctx: CanvasRenderingContext2D){
            if(this.isItemMissing())
                this.drawInCenter(ctx, this.viewport.resourceAlert, 0);   
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
            
            contents.appendChild(this.createNumberInputField('Consumption:', 'consumption', 'i/m'));
        }
    }
}