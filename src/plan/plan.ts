
namespace Plan{
    export interface BusParticipant{
        connectedTo: Bus;
        provides: Set<GameData.Item>;
        needs: Set<GameData.Item>;
        blocks: Set<GameData.Item>;
        
        setMissing(missing: Set<GameData.Item>);
    }
    
    class LoopException{
    }
    
    var knownTiles = ['Block', 'Bus', 'Factory', 'Sink', 'Source'];
         
    export class GamePlan{
        public busStarts: Bus[] = [];
        public busEnds: Bus[] = [];
        public viewport: Ui.Viewport;
        
        private tiles: {[index : string] : Tile} = {};        
        
        constructor(public data: GameData.Data){
        }
        forAllTiles(each: (t: Tile) => void){
             for(var t in this.tiles){
                 if(this.tiles[t])
                    each(this.tiles[t]);
             }
        }
        public savePlan(json){
            json.gameVersion = this.data.version;
            
            var tiles = [];
            this.forAllTiles((t) => {
               var tileJson = {};
               t.serialize(tileJson);
               tiles.push(tileJson); 
            });
            json.tiles = tiles;
        }
        public forAllBusses(cb: (bus: Bus) => void){
            for(var tile in this.tiles){
                if(this.tiles[tile] instanceof Bus)
                    cb(<Bus> this.tiles[tile]);
            }
        }
        
        private bfsBus(roots: Bus[], visit: (bus: Bus) => Set<Bus>, reqs: (bus: Bus) => Set<Bus>){
            this.forAllBusses((t: Bus) => t.solved = false);
            var queue = roots.slice();
            while(queue.length > 0){
                var bus = queue.pop();
                bus.solved = true;
                var nexts = visit(bus);
                nexts.forEach((next) => {
                    var hasUnsolved = false;
                    reqs(next).forEach((input) => {
                        if(!input.solved) 
                            hasUnsolved = true;
                    });
                    if(!hasUnsolved)
                        queue.push(next);
                });
            }
        }
        
        private checkLoop(roots: Bus[], next: (bus: Bus) => Set<Bus>): boolean{
            this.forAllBusses((t: Bus) => {
                t.solved = t.visited = false;
            });
            
            var visit = (b: Bus) => {
                if(b.visited)
                    throw new LoopException();
                if(b.solved) return;
                
                b.visited = true;
                next(b).forEach((nb: Bus) => visit(nb));
                b.visited = false;
                b.solved = true;
            };
            
            try{
                for(var i = 0; i<roots.length; i++)
                    visit(roots[i]);
            }catch (e){
                return false;
            }
                
            return true;
        }
        
        updateBus(){
            if(!this.checkLoop(this.busStarts, (bus) => bus.outputs)){
                alert("There is a loop on your bus");
                return;
            }
            
            // clear
            this.forAllBusses((t: Bus) => {
                t.items.clear();
            });
            // TODO: check that bus is acyclic and show where the cycle is if it is not
            // contains all buses that have all input solved

            var addItemSource = (bus: Bus, item: GameData.Item, source: BusParticipant) => {
                if(!bus.items.has(item))
                    bus.items.set(item, new Set());
                bus.items.get(item).add(source)
            };
            // propagate sources (factories providing some items)
            this.bfsBus(this.busStarts,
                (bus: Bus) => {                                       
                    bus.inputs.forEach( (input) => {                        
                        input.items.forEach((sources, item) => {
                            if(!input.blocked.has(item))
                                sources.forEach((source) => addItemSource(bus, item, source));
                        });
                    });
                    
                    bus.blocked.clear();
                    bus.directParticipants.forEach((c) => {
                        var missing = new Set();
                        c.needs.forEach((needs) => {
                            if(!bus.items.has(needs)){
                                missing.add(needs);
                            }             
                        });
                        
                        c.blocks.forEach((b) => bus.blocked.add(b));
                        
                        c.setMissing(missing);
                        if(missing.size == 0) 
                            c.provides.forEach((item) => addItemSource(bus, item, c));
                    });
                    
                    return bus.outputs;
                },
                (bus: Bus) => bus.inputs
            );
            
            // now propagate sources that are not needed (remove them)
            this.bfsBus(this.busEnds,
                (bus: Bus) => {
                    var needed : Set<GameData.Item> = new Set();;
                    // populate needed from directly connected BusParticipants
                    bus.directParticipants.forEach((c) => {
                       c.needs.forEach((n) => {
                           needed.add(n)
                       });
                       // we also include blocks, so that the stream of items
                       // visibily ends at the block
                       c.blocks.forEach((n) => {
                           needed.add(n)
                       });
                    });
                    // populate needed by propagating from bus outputs
                    bus.outputs.forEach((output)=>{
                       output.items.forEach((sources, item) => {
                           needed.add(item);
                       });
                    });
                    // remove all unneded items along with their sources
                    bus.items.forEach((sources, item) =>{
                        if(!needed.has(item))
                            bus.items.delete(item);
                    });
                    
                    return bus.inputs;
                },
                (bus: Bus) => bus.outputs
            );
            this.bfsBus(this.busStarts,
                (bus: Bus) => {
                    bus.updateIcons();
                    return bus.outputs;
                },
                (bus: Bus) => bus.inputs
            );
            // and show the results
            this.forAllBusses((b) => b.updateIcons());
            if(this.viewport)
                this.forAllTiles((t) => t.updateHtml());
        }
        private reportError(t: Tile, problem: string){
            alert(problem);
        }
        
        get(point: Util.Vector){
            return this.getXY(point.x, point.y);
        }
        getXY(x:number, y:number){
            return this.tiles[x + ":" + y];
        }
        set(point: Util.Vector, tile: Tile){
            this.setXY(point.x, point.y, tile);
        }
        setXY(x:number, y:number, tile: Tile){
            var old = this.tiles[x + ":" + y];
            if(old && old != tile){
                old.destroy();
            }
            this.tiles[x + ":" + y] = tile;
            if(tile){
                if(!tile.position)
                    tile.position = new Util.Vector(0,0);
                tile.position.x = x;
                tile.position.y = y;
                if(this.viewport)
                    tile.createHtml(this.viewport);
            }
            this.updateIncludingNeigbhbours(x, y);
        }
        private updateIncludingNeigbhbours(x: number, y: number){
            this.tryUpdateTile(this.getXY(x, y));
            this.tryUpdateTile(this.getXY(x+1, y));
            this.tryUpdateTile(this.getXY(x, y+1));
            this.tryUpdateTile(this.getXY(x-1, y));
            this.tryUpdateTile(this.getXY(x, y-1));
        }
        private tryUpdateTile(tile: Tile){
            if(tile)
                tile.updateState();
        }
    }
    export function loadPlan(json, cb: (plan: GamePlan) => void){
        App.loadData(json.gameVersion, (data: GameData.Data) => {
           var plan = new GamePlan(data);
           var tiles = <any[]> json.tiles;
           for(var i = 0; i<tiles.length; i++){
               var type = tiles[i].type;
               if(knownTiles.indexOf(type) == -1){
                   App.error("Unknown tile type");
               }
               var tile = <Tile> new Plan[type](plan);
               tile.deserialize(tiles[i]);
               plan.setXY(tiles[i].x, tiles[i].y, tile);
           }
           plan.updateBus(); 
           cb(plan);
        });
    }
}