///<reference path="tile.ts" />

namespace Plan{    
    class BlockInfoBox extends InfoBox{
        public constructor(public block: Block){
            super(block);

            var header = document.createElement('h3');
            header.textContent = this.block.item.name + " filter";
            this.htmlContent.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.textContent = 'Change filtered item';
            itemButton.onclick =  () => {
                var d = new Ui.SelectItem(this.block.plan, ()=>{
                    this.block.setItem(d.selected);
                    this.block.updateIncludingNeighbours();
                });
                d.show();
            };
            this.htmlContent.appendChild(itemButton);
        }
    }
    export class Block extends ItemTile implements BusParticipant{
        participant: BusParticipantData = new BusParticipantData();
        blocksItem: GameData.Item;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        itemTransferFunction(){
            
        }
        createInfo(): InfoBox{
            return new BlockInfoBox(this);
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Block';
        }
        underlay(ctx: CanvasRenderingContext2D){
            ctx.drawImage(this.viewport.resourceBlock, 0, 0);
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.participant.blocks.clear();
            this.participant.blocks.add(item);
            this.blocksItem = item;
        }
        isBusParticipant():boolean{
            return true;
        }
    }
}