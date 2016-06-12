///<reference path="tile.ts" />

namespace Plan{    
    export class Block extends ItemTile{
        constructor(plan: Plan){
            super(plan);
        }
        underlay(ctx: CanvasRenderingContext2D){
            ctx.drawImage(this.viewport.resourceBlock, 0, 0);
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            this.showInfoStandardButtons();
        }
    }
}