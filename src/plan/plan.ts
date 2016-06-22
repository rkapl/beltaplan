
namespace Plan{
    

    
    class LoopException{
    }
    
    var knownTiles = ['Block', 'Bus', 'Factory', 'Sink', 'Source'];
         
    export interface GamePlanListener{
        changed(x: number, y: number);
    }
    export class Connection{
        from: BusParticipant;
        to: BusParticipant;
        item: GameData.Item;
    }
    // exception used to stop BFS search
    class Connected{}
    export class GamePlan{
        public viewport: Ui.Viewport;
        public listeners: Set<GamePlanListener> = new Set();
        
        private tiles: {[index : string] : Tile} = {};        
        
        constructor(public data: GameData.Data){
        }
        forAllTiles(each: (t: Tile) => void){
             for(var t in this.tiles){
                 if(this.tiles[t])
                    each(this.tiles[t]);
             }
        }
        savePlan(json){
            json.gameVersion = this.data.version;
            
            var tiles = [];
            this.forAllTiles((t) => {
               var tileJson = {};
               t.serialize(tileJson);
               tiles.push(tileJson); 
            });
            json.tiles = tiles;
        }
        forAllBusses(cb: (bus: Bus) => void){
            for(var tile in this.tiles){
                if(this.tiles[tile] instanceof Bus)
                    cb(<Bus> this.tiles[tile]);
            }
        }
        forAllParticipants(cb: (p: BusParticipant) => void){
            this.forAllTiles((t) =>{
               if(t.isBusParticipant())
                  cb(<BusParticipant><any>t);
            });
        }
        
        private bfsBus(roots: Bus[], visit: (bus: Bus, path: Bus[]) => Set<Bus>){
            this.forAllBusses((t: Bus) => {
                t.visited = false;
            });
            // queue paths
            var queue = [];
            for(var i = 0; i<roots.length; i++){
                queue.push([roots[i]]);
                roots[i].visited = true;
            }
            
            while(queue.length > 0){
                var path = queue.shift();
                var bus = path[path.length - 1];
                var nexts = visit(bus, path);
                nexts.forEach((next) => {
                    if(!next.visited){
                        next.visited = true;
                        var newPath = path.slice();
                        newPath.push(next);
                        queue.push(newPath);
                    }
                });
            }
        }
        private addToBag<K,V>(bag: Map<K, Set<V>>, key: K, value: V){
            if(!bag.has(key))
                bag.set(key, new Set());
            bag.get(key).add(value);
        }        
        private addConnection(item: GameData.Item, from: BusParticipant, to: BusParticipant, path: Bus[]){
            var c = new Connection();
            c.from = from;
            c.to = to;
            c.item =  item;
            
            this.addToBag(from.participant.fromConnections, item, c);
            for(var i = 0; i<path.length; i++){
                this.addToBag(path[i].items, item, c);
            }
            from.participant.toConnections.set(item, c);
        }
        updateBus(){
            // clear 
            this.forAllBusses((t: Bus) => {
                t.items.clear();
                t.itemIcons = [];
            });
            this.forAllParticipants((b) => {
                b.participant.fromConnections.clear();
                b.participant.toConnections.clear();
            });
            
            // connect sinks to sources
            this.forAllParticipants((from) => {
                if(!from.participant.connectedTo)
                    return;
                from.participant.needs.forEach((item) => {
                    try{
                        this.bfsBus([from.participant.connectedTo], (bus, path) => {
                            bus.directParticipants.forEach((to) => {
                                if(to.participant.provides.has(item)){
                                    this.addConnection(item, from, to, path);
                                    throw new Connected();
                                } 
                            });
                            
                            if(bus.blocked.has(item))
                                return new Set();
                            return bus.inputs;
                        });
                    }catch(e){
                        if(!(e instanceof Connected))
                            throw e;
                    }
                });
            });
            
            // update the icons (needs to be done in BFS order from the bus starts)
            var busStarts = [];
            this.forAllBusses((bus) => {
                if(bus.inputs.size == 0)
                    busStarts.push(bus);
            })
            this.bfsBus(busStarts,
                (bus, path) => {
                    bus.updateIcons();
                    return bus.outputs;
                }
            );
            
            // if the bus starts with a loop, we might loose some updateIcons,
            // so be sure
            this.forAllBusses((b) => {
                if(!b.visited)
                    b.updateIcons()
            });
            
            // and show the resultsa
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
            this.listeners.forEach((l) => l.changed(x, y));
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