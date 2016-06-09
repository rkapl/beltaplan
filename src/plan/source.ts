namespace Plan{
    
    /* Tile producing a specified item.
     *
     * Typically used when a certain item is provided by some external factory.
     */
    export class Source extends ItemTile implements BusParticipant{
        connectedTo: Bus;
        needs: Set<GameData.Item> = new Set();
        provides: Set<GameData.Item> = new Set();
        constructor(plan: Plan){
            super(plan);
        }
        setItem(item: GameData.Item){
            super.setItem(item);
            this.provides = new Set();
            this.provides.add(item);
        }
        isBusParticipant():boolean{
            return true;
        }
        overlay(ctx: CanvasRenderingContext2D){
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "center";
            ctx.fillText(this.rate + " ips", FACTORIO_TILE_SIZE*1.5, FACTORIO_TILE_SIZE*2.5);
        }
        setMissing(missing: any){
            // can not happen
        }
    }
}