///<reference path="tile.ts" />

namespace Plan{    
    export class Block extends ItemTile{
        constructor(plan: Plan){
            super(plan);
        }
        underlay(ctx: CanvasRenderingContext2D){
            ctx.drawImage(this.plan.resourceBlock, 0, 0);
        }
    }
}