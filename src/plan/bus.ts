///<reference path="tile.ts" />

namespace Plan{
    interface FactorioItemMixin{
        factorioItem: GameData.Item;
    } 
    
    enum BusConnection{
        NO, IN, OUT
    };
    
    export class Bus extends TileBase{
        
        // padding between then belt and tile (for the UI)
        private border = Ui.Sizes.TILE_SIZE/9;
        
        // relationship with neighbors
        inputs: Set<Bus> = new Set();
        outputs: Set<Bus> = new Set();
        //indexed by direction
        busConnections: BusConnection[] = [BusConnection.NO, BusConnection.NO, BusConnection.NO, BusConnection.NO];
        directParticipants: Set<BusParticipant> = new Set();
        
        // data from the bus calculation algorithms
        // all items available at this tile with the possible sources (computed by update_bus)
        items: Map<GameData.Item, Set<BusParticipant>> =  new Map<GameData.Item, Set<BusParticipant>>();        
        itemIcons: HTMLImageElement[] = [];
        // used by the graph algorithms
        solved: boolean;
        visited: boolean;
        
        constructor(public plan: Plan){
            super(plan);
        }
        destroy(){
            super.destroy();
            this.removeBusStart();
            this.removeBusEnd();
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
        private isOrientedTowards(neighbor: Util.Orientation){
            var t = this.getNeighbour(neighbor);
            return t.orientation == Util.oppositeOrientation(neighbor);
        }
        private isOrientedOutwards(neighbor: Util.Orientation){
            var t = this.getNeighbour(neighbor);
            return t.orientation == neighbor;
        }
        updateState(){
            this.directParticipants.clear();
            this.inputs.clear();
            this.outputs.clear;
            // first check bus participants, reset bus connections
            for(var i = 0; i <4; i++){
                var t = this.getNeighbour(i);
                this.busConnections[i] = BusConnection.NO;  
                if(t && t.isBusParticipant() && this.isOrientedTowards(i))
                    this.directParticipants.add(<BusParticipant><any>t);
            }
            // now check for connected buses - we work relative to the NORTH of our bus tile
            var northAbsolute = Util.addOrientation(this.orientation, Util.Orientation.NORTH);
            var westAbsolute = Util.addOrientation(this.orientation, Util.Orientation.WEST);
            var eastAbsolute = Util.addOrientation(this.orientation, Util.Orientation.EAST);
            var southAbsolute = Util.addOrientation(this.orientation, Util.Orientation.SOUTH);
            var north = this.getNeighbour(northAbsolute);
            var west = this.getNeighbour(westAbsolute);
            var east = this.getNeighbour(eastAbsolute);
            var south = this.getNeighbour(southAbsolute);
            
            if(north instanceof Bus && !this.isOrientedTowards(northAbsolute))
                this.busConnections[northAbsolute] = BusConnection.OUT;
            if(south instanceof Bus && !this.isOrientedOutwards(southAbsolute))
                this.busConnections[southAbsolute] = BusConnection.IN;
                    
            if(west instanceof Bus){ 
                if(this.isOrientedTowards(westAbsolute))
                    this.busConnections[westAbsolute] = BusConnection.IN;
                else if(this.isOrientedOutwards(westAbsolute))
                    this.busConnections[westAbsolute] = BusConnection.OUT;
            }
            
            if(east instanceof Bus){
                if(this.isOrientedTowards(eastAbsolute))
                    this.busConnections[eastAbsolute] = BusConnection.IN;
                else if(this.isOrientedOutwards(eastAbsolute))
                    this.busConnections[eastAbsolute] = BusConnection.OUT;
            }
            
            // store inputs and outputs
            for(var i = 0; i<4; i++){
                if(this.busConnections[i] == BusConnection.IN)
                    this.inputs.add(<Bus>this.getNeighbour(i));
                else if(this.busConnections[i] == BusConnection.OUT)
                    this.outputs.add(<Bus>this.getNeighbour(i));
            }
            
            // register us as bus ends/starts
            this.removeBusStart();
            this.removeBusEnd();
            if(this.inputs.size == 0)
                this.plan.busStarts.push(this);
            if(this.outputs.size == 0)
                this.plan.busEnds.push(this);
            
            super.updateState();
        }
        updateHtml(){
            super.updateHtml();
            var canvas = <HTMLCanvasElement>this.html;
            
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0,0, canvas.width, canvas.height);
            var border = this.border;
            
            // draw the middle rectangle
            ctx.fillStyle = 'grey';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            ctx.fillRect(border, border, Ui.Sizes.TILE_SIZE - border*2, Ui.Sizes.TILE_SIZE - border*2);
            
            // draw the arrow with appropriate rotation
            ctx.save();
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 6;
            
            ctx.translate(Ui.Sizes.TILE_SIZE/2, Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(this.orientation * Math.PI/2);
            ctx.beginPath();
            ctx.moveTo(-Ui.Sizes.TILE_SIZE/2 + 25, 5);
            ctx.lineTo(0, -5);
            ctx.lineTo(Ui.Sizes.TILE_SIZE/2 - 25, 5);
            ctx.stroke();
            ctx.restore();
            
            // draw a "connector" to neighbouring buses or a bus border if there is 
            // no neighbor
            for(var i = 0; i<4; i++){
                ctx.save();
                this.rotateContext(ctx, i);
                if(this.busConnections[i] != BusConnection.NO)
                    this.drawOpen(ctx);
                ctx.restore();
            }
            
            for(var i = 0; i<4; i++){
                ctx.save();
                this.rotateContext(ctx, i);
                if(this.busConnections[i] == BusConnection.NO)
                    this.drawClosed(ctx);
                ctx.restore();
            }
                    
            // draw icons for transported goods
            ctx.save();
            ctx.shadowOffsetX = 3;
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 5;
            
            var gridSize = Math.max(3, Math.ceil(Math.sqrt(this.itemIcons.length)))
            for(var i = 0; i<this.itemIcons.length; i++){
                if(!this.itemIcons[i])
                    continue;
                var x = Math.floor(i / gridSize);
                var y = i % gridSize;
                var iconSize = (Ui.Sizes.TILE_SIZE - border*2)/gridSize;
                var grow = iconSize/10;
                
                ctx.drawImage(this.itemIcons[i],
                    this.border + x * iconSize - grow, this.border + y * iconSize - grow,
                    iconSize + grow*2, iconSize + grow*2);
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
        }
        private imageForItem(item: GameData.Item){
            var img = new Image();
            img.src = this.plan.dataPrefix + item.icon;
            img.onload = () => this.updateHtml();
            (<FactorioItemMixin><any>img).factorioItem = item;
            return img;
        }
        private rotateContext(ctx: CanvasRenderingContext2D, o: Util.Orientation){
            ctx.translate(Ui.Sizes.TILE_SIZE/2, Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(o * Math.PI / 2);
            ctx.translate(-Ui.Sizes.TILE_SIZE/2, -Ui.Sizes.TILE_SIZE/2);
        }
        private drawOpen(ctx: CanvasRenderingContext2D){
            ctx.fillRect(this.border, 0, Ui.Sizes.TILE_SIZE - this.border*2, this.border*2);
            
            ctx.beginPath();
            ctx.moveTo(this.border, 0);
            ctx.lineTo(this.border, this.border);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(Ui.Sizes.TILE_SIZE - this.border, 0);
            ctx.lineTo(Ui.Sizes.TILE_SIZE - this.border, this.border);
            ctx.stroke();
        }
        private drawClosed(ctx: CanvasRenderingContext2D){
            ctx.beginPath();          
            ctx.moveTo(this.border, this.border);
            ctx.lineTo(Ui.Sizes.TILE_SIZE - this.border, this.border);
            ctx.stroke()
        }
    }
    
}