///<reference path="tile.ts" />

namespace Plan{
    interface FactorioItemMixin{
        factorioItem: GameData.Item;
    } 
    
    export class Bus extends Tile{
        canvas: HTMLCanvasElement;
        // padding between then belt and tile
        private border = TILE_SIZE/9;
        inputs: Set<Bus> = new Set();
        outputs: Set<Bus> = new Set();;
        // all items available at this tile with the possible sources (computed by update_bus)
        items: Map<GameData.Item, Set<BusParticipant>> =  new Map<GameData.Item, Set<BusParticipant>>();
        // all BusProviders connected directly to this bus (computed by update_peer)
        connected: Set<BusParticipant> = new Set();
        itemIcons: HTMLImageElement[] = [];
        solved: boolean;
        
        constructor(public plan: Plan){
            super(plan, 'canvas');
            this.canvas = <HTMLCanvasElement>this.peer;
            this.canvas.width = this.canvas.height = TILE_SIZE;
        }
        remove(){
            super.remove();
            this.removeBusStart();
        }
        removeBusStart(){
            var idx = this.plan.busStarts.indexOf(this);
            if(idx != -1)
                this.plan.busStarts.splice(idx, 1);
        }
        removeBusEnd(){
            var idx = this.plan.busEnds.indexOf(this);
            if(idx != -1)
                this.plan.busEnds.splice(idx, 1);
        }
        updatePeer(){
            super.updatePeer();
            var ctx = this.canvas.getContext('2d');
            ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
            var n:Tile[] = [];
            for(var i = 0; i<4; i++){
                n.push(this.getNeighbour(i));
            }
            var border = this.border;
            
            ctx.fillStyle = 'grey';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillRect(border, border, TILE_SIZE - border*2, TILE_SIZE - border*2);

            this.inputs.clear();
            this.outputs.clear();

            var east = this.getNeighbourOriented(Util.Orientation.EAST);
            var west = this.getNeighbourOriented(Util.Orientation.WEST);
            var south = this.getNeighbourOriented(Util.Orientation.SOUTH);
            var north = this.getNeighbourOriented(Util.Orientation.NORTH);
            
            // figure out the inputs and outputs
            if(east instanceof Bus && east.orientation == this.orientation){
                this.drawOpen(ctx, Util.Orientation.EAST)
                this.inputs.add(<Bus>east);
            }else{
                this.drawClosed(ctx, Util.Orientation.EAST);
            }
                     
            
            if(west instanceof Bus && west.orientation != Util.oppositeOrientation(this.orientation)){
                this.drawOpen(ctx, Util.Orientation.WEST);
                this.outputs.add(<Bus>west);
            }else{
                this.drawClosed(ctx, Util.Orientation.WEST);
            }
            
            //TODO
            this.drawClosed(ctx, Util.Orientation.NORTH);
            this.drawClosed(ctx, Util.Orientation.SOUTH);
            
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(TILE_SIZE/2 + 5, TILE_SIZE/2 - 15);
            ctx.lineTo(TILE_SIZE/2 - 5, TILE_SIZE/2);
            ctx.lineTo(TILE_SIZE/2 + 5, TILE_SIZE/2 + 15);
            ctx.stroke();
            
            // find bus participants
            this.connected.forEach((c)=>{
                c.connectedTo = null;
            });
            this.connected.clear();
            for(var d = 0; d<4; d++){
                var t = this.getNeighbour(d);
                if(t && t.orientation == Util.oppositeOrientation(d) && t.isBusParticipant()){
                    var bp = <BusParticipant><any> t;
                    bp.connectedTo = this;
                    this.connected.add(bp);
                }
            }
            
            this.removeBusStart();
            this.removeBusEnd();
            if(this.inputs.size == 0)
                this.plan.busStarts.push(this);
            if(this.outputs.size == 0)
                this.plan.busEnds.push(this);
            
            ctx.save();
            ctx.shadowOffsetX = -3;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 5;
            
            var gridSize = Math.max(3, Math.ceil(Math.sqrt(this.itemIcons.length)))
            for(var i = 0; i<this.itemIcons.length; i++){
                if(!this.itemIcons[i])
                    continue;
                var x = gridSize - Math.floor(i / gridSize) - 1;
                var y = i % gridSize;
                var iconSize = (TILE_SIZE - border*2)/gridSize;
                var grow = iconSize/10;
                
                // counteract the rotation of the tile so that icons are always facing up
                ctx.save();
                ctx.translate(border + (x+0.5)*iconSize, border + (y+0.5)*iconSize)
                ctx.rotate(-this.orientation*Math.PI/2);
                ctx.drawImage(this.itemIcons[i],
                    -iconSize/2 - grow, -iconSize/2 - grow,
                    iconSize + grow*2, iconSize + grow*2);
                ctx.restore();
            }                            
            ctx.restore();
            
        }
        // called by update_bus after the bus is computed (in BFS order)
        updateIcons(){
            this.itemIcons = new Array();
            // try to maintain ordering of our inputs
            var someInput:Bus = null;
            this.inputs.forEach((input) => someInput = input);
            if(someInput)
                this.itemIcons = new Array(someInput.itemIcons.length);
            
            var added = new Set();
            // we try to maintain positions on the bus, so in the first iteration we position
            // items that are already on our input bus
            if(someInput){
                for(var i = 0; i<someInput.itemIcons.length; i++){
                    if(!someInput.itemIcons[i])
                        continue;
                        
                    var item = (<FactorioItemMixin><any>someInput.itemIcons[i]).factorioItem;
                    if(this.items.has(item)){
                        this.itemIcons[i] = this.imageForItem(item);
                        added.add(item);
                    }
                }
            }
            var lastInsertPos = 0;
            this.items.forEach((sources, item) => {
                if(added.has(item))
                    return;
                    
                while(this.itemIcons[lastInsertPos])
                    lastInsertPos++;
                    
                if(lastInsertPos == this.itemIcons.length)
                    this.itemIcons.push(this.imageForItem(item));
                else
                    this.itemIcons[lastInsertPos] = this.imageForItem(item);
            });
            this.updatePeer();
        }
        private imageForItem(item: GameData.Item){
            var img = new Image();
            img.src = this.plan.dataPrefix + item.icon;
            img.onload = () => this.updatePeer();
            (<FactorioItemMixin><any>img).factorioItem = item;
            return img;
        }
        private drawOpen(ctx: CanvasRenderingContext2D, o: Util.Orientation){
            ctx.save();
            ctx.translate(TILE_SIZE/2, TILE_SIZE/2);
            ctx.rotate(o * Math.PI / 2);
            ctx.translate(-TILE_SIZE/2, -TILE_SIZE/2);
            ctx.fillRect(0, this.border, this.border*2, TILE_SIZE - this.border*2);
            
            ctx.beginPath();
            ctx.moveTo(0, this.border);
            ctx.lineTo(this.border, this.border);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(0, TILE_SIZE - this.border);
            ctx.lineTo(this.border, TILE_SIZE - this.border);
            ctx.stroke();
            
            ctx.restore()
        }
        private drawClosed(ctx: CanvasRenderingContext2D, o: Util.Orientation){
            ctx.save();
            ctx.translate(TILE_SIZE/2, TILE_SIZE/2);
            ctx.rotate(o * Math.PI / 2);
            ctx.translate(-TILE_SIZE/2, -TILE_SIZE/2);
            ctx.beginPath();
            ctx.moveTo(this.border, this.border);
            ctx.lineTo(this.border, TILE_SIZE - this.border);
            ctx.stroke()
            ctx.restore()
        }
    }
    
}