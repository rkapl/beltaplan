namespace Plan{
    class SourceInfoBox extends InfoBox{
        public constructor(public source: Source){
            super(source);
            var header = document.createElement('h3');
            header.textContent = this.source.providesItem.name + " source";
            this.htmlFooter.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.textContent = 'Change produced item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.source.plan, ()=>{
                    this.source.setItem(d.selected);
                    this.source.updateIncludingNeighbours();
                });
                d.show();
            };
            this.htmlContent.appendChild(itemButton);
            
            this.htmlContent.appendChild(this.createPropertyDisplay('Provides', 
                this.source.participant.fromConnectionsConsumption(this.source.providesItem).toFixed(), 'i/m'));
        }
    }
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Source extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        providesItem: GameData.Item;
        
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
            
        }
        createInfo(): InfoBox{
            return new SourceInfoBox(this);
        }
    }
}