
namespace Plan{
    export var FACTORIO_TILE_SIZE = 32;
    export var TILE_SIZE = FACTORIO_TILE_SIZE*3;
    var SCROLL_SPEED = 1;    
    
    
    export interface BusParticipant{
        connectedTo: Bus;
        provides: Set<GameData.Item>;
        needs: Set<GameData.Item>;
        setMissing(missing: Set<GameData.Item>);
    }
     
    export class Plan{
        public offset: Util.Vector = new Util.Vector(128, 128);
        public zoom: number = 1;
        public resourceOrientationArrow : HTMLImageElement;
        public resourceRecipeOverlayDecal : HTMLImageElement;
        public resourceBlock : HTMLImageElement;
        public resourceAlert : HTMLImageElement;
        public busStarts: Bus[] = [];
        public busEnds: Bus[] = [];
        
        private tiles: {[index : string] : Tile} = {};
        private background: HTMLElement;
        private pressedKeys: {[index: number] : boolean} = {};
        private isScrolling: boolean;
        private lastAnimationTime: number;
        
        constructor(
            public viewport: HTMLElement, 
            public dataPrefix: string,
            public data: GameData.Data)
        {
            this.resourceOrientationArrow = new Image();
            this.resourceOrientationArrow.src = 'img/orientation-arrow.svg';
            
            this.resourceRecipeOverlayDecal = new Image();
            this.resourceRecipeOverlayDecal.src = 'img/recipe-overlay-decal.svg';
            
            this.resourceBlock = new Image();
            this.resourceBlock.src = 'img/block.svg';
            
            this.resourceAlert = new Image();
            this.resourceAlert.src = 'img/alert.svg';
            
            this.background = <HTMLElement>viewport.getElementsByClassName('viewport-background')[0];
            window.addEventListener('keydown', (e) => {
               this.pressedKeys[e.keyCode] = true;
               if(!this.isScrolling && !this.currentScrollDirection().isZero()){
                    this.isScrolling = true;
                    window.requestAnimationFrame((ts) => this.scrollAnimation(ts));
                    this.lastAnimationTime = performance.now();
               }
            });
            window.addEventListener('keyup', (e) => {
               delete this.pressedKeys[e.keyCode];
            });
            window.addEventListener('resize', (e) => this.resizeBackground());
            this.resizeBackground();
            this.updateScroll();
        }
        clientToGrid(client: Util.Vector):Util.Vector{
            return new Util.Vector(
                (client.x - this.offset.x)/TILE_SIZE,
                (client.y - this.offset.y)/TILE_SIZE);
        }
        gridToClient(grid: Util.Vector):Util.Vector{
            return new Util.Vector(
                grid.x*TILE_SIZE + this.offset.x, 
                grid.y*TILE_SIZE + this.offset.y);
        }
        forAllBusses(cb: (bus: Bus) => void){
            for(var tile in this.tiles){
                if(this.tiles[tile] instanceof Bus)
                    cb(<Bus> this.tiles[tile]);
            }
        }
        
        bfsBus(roots: Bus[], visit: (bus: Bus) => Set<Bus>, reqs: (bus: Bus) => Set<Bus>){
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
        
        updateBus(){
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
                    bus.inputs.forEach( (inputs) => {
                        inputs.items.forEach((sources, item) => {
                            sources.forEach((source) => addItemSource(bus, item, source));
                        }); 
                    });
                    
                    bus.connected.forEach((c) => {
                        var missing = new Set();
                        c.needs.forEach((needs) => {
                            if(!bus.items.has(needs)){
                                missing.add(needs);
                            }                     
                        });
                        c.setMissing(missing);
                        if(missing.size == 0) 
                            c.provides.forEach((item) => addItemSource(bus, item, c)); 
                    });
                    
                    return bus.outputs;
                },
                (bus: Bus) => bus.inputs
            );
            
            // now propagate sources that are not needed
            this.bfsBus(this.busEnds,
                (bus: Bus) => {
                    var needed : Set<GameData.Item> = new Set();;
                    // populate needed from directly connected BusParticipants
                    bus.connected.forEach((c) => {
                       c.needs.forEach((n) => {
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
        }
        private reportError(t: Tile, problem: string){
            alert(problem);
        }
        private resizeBackground(){
            var w = Math.ceil(window.innerWidth/TILE_SIZE + 1)*TILE_SIZE;
            var h = Math.ceil(window.innerHeight/TILE_SIZE + 1)*TILE_SIZE;
            this.background.style.width = w + 'px';
            this.background.style.height = h + 'px';
        }
        private scrollAnimation(ts: number){
            var offset = this.currentScrollDirection();
            if(!offset.isZero()){
                var delta = ts - this.lastAnimationTime;
                this.lastAnimationTime = ts;
                offset.scale(-SCROLL_SPEED * delta);
                this.offset.add(offset);
                this.updateScroll();
                window.requestAnimationFrame((ts) => this.scrollAnimation(ts))
            }else{
                this.isScrolling = false;
            }
        }
        private currentScrollDirection():Util.Vector{
            var p = new Util.Vector(0, 0);
            for(var key in this.pressedKeys){
                p.add(this.keyCodeToDirection(parseInt(key)));
            }
            return p;
        }
        private keyCodeToDirection(key: number){
            var x = 0;
            var y = 0;
            switch(key){
                case 87:
                    y = -1;
                    break;
                case 83:
                    y = 1;
                    break;
                case 65:
                    x = -1;
                    break;
                case 68:
                    x = 1;
                    break;
                default:
            }
            return new Util.Vector(x,y);
        }
        updateScroll(){
            var x = Math.round(this.offset.x);
            var y = Math.round(this.offset.y);
            // translateZ forces the viewport to be a layer in chrome
            this.viewport.style.transform = "translate(" + x + "px," + y + "px) translateZ(0)";
            this.viewport.style.transformOrigin = "0px 0px";
            
            if(typeof window['InstallTrigger'] !== 'undefined'){
                // Gecko seems to handle background-position just fine but has problems with
                // the repaint of layer edges
                this.background.style.transform = "translate(" + -x + "px," + -y + "px)";
                this.background.style.backgroundPosition = 
                    Util.mod(x, TILE_SIZE) + 'px ' + Util.mod(y, TILE_SIZE) + 'px';
            }else{
                // Chrome causes repaints on backgroundPosition change
                var bgx = -x + Util.mod(x, TILE_SIZE) - TILE_SIZE;
                var bgy = -y + Util.mod(y, TILE_SIZE) - TILE_SIZE;
                this.background.style.transform = "translate(" + bgx + "px," + bgy + "px) translateZ(0)";
                this.background.style.transformOrigin = "0px 0px";
            }
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
            if(old && old != tile)
                old.remove();
            this.tiles[x + ":" + y] = tile;
            if(tile){
                if(!tile.position)
                    tile.position = new Util.Vector(0,0);
                tile.position.x = x;
                tile.position.y = y;
                tile.updateIncludingNeighbours();
            }
        }
    }
}