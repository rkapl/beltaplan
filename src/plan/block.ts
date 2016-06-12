///<reference path="tile.ts" />

namespace Plan{    
    export class Block extends ItemTile implements BusParticipant{
        connectedTo: Bus;
        needs: Set<GameData.Item> = new Set();
        provides: Set<GameData.Item> = new Set();
        blocks: Set<GameData.Item> =  new Set();
        blocksItem: GameData.Item;
        
        constructor(plan: GamePlan){
            super(plan);
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Block';
        }
        underlay(ctx: CanvasRenderingContext2D){
            ctx.drawImage(this.viewport.resourceBlock, 0, 0);
        }
        setMissing(){
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.blocks.clear();
            this.blocks.add(item);
            this.needs.add(item);
            this.blocksItem = item;
        }
        isBusParticipant():boolean{
            return true;
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            
            var header = document.createElement('h3');
            header.textContent = this.item.name + " filter";
            contents.appendChild(header);
            
            var itemButton = document.createElement('button');
            itemButton.innerText = 'Change filtered item';
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