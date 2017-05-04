namespace Plan{

    class SinkInfoBox extends InfoBox{
        public constructor(public sink: Sink){
            super(sink);
            
            var header = document.createElement('h3');
            header.textContent = this.sink.needsItem.name + " sink";
            this.htmlContent.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.textContent = 'Change consumed item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.sink.plan, ()=>{
                    this.sink.setItem(d.selected);
                    this.sink.updateIncludingNeighbours();
                });
                d.show();
            };
            this.htmlContent.appendChild(itemButton);
            
            this.htmlContent.appendChild(this.createNumberInputField('Consumption:', 'consumption', 'i/m'));
        }
    }
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Sink extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        needsItem: GameData.Item;
        private consumption: number = 5;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        itemTransferFunction(){
            var c = this.participant.toConnections.get(this.needsItem);
            if(c)
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
                
            ctx.font = "bold 15px Lato";
            ctx.textAlign = "center";
            ctx.textBaseline = "center";
            ctx.fillStyle = 'black';   
            ctx.fillText(this.consumption + " i/m", Ui.Sizes.TILE_SIZE/2 , Ui.Sizes.TILE_SIZE - 16);
        }
        createInfo(): InfoBox{
            return new SinkInfoBox(this);
        }
    }
}