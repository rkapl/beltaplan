///<reference path="tile.ts" />

namespace Plan{
    interface FactorioItemMixin{
        factorioItem: GameData.Item;
    } 
    
    enum BusConnection{
        NO, IN, OUT
    };
    
    var LOAD_FACTOR_REORDER_TRESHOLD = 0.5;
    var MIN_GRID_SIZE = 3;
    
    export class Bus extends TileBase{
        
        // padding between then belt and tile (for the UI)
        private border = Ui.Sizes.TILE_SIZE/9;
        
        // relationship with neighbors
        inputs: Set<Bus> = new Set();
        outputs: Set<Bus> = new Set();
        //indexed by direction
        busConnections: BusConnection[] = [BusConnection.NO, BusConnection.NO, BusConnection.NO, BusConnection.NO];
        directParticipants: Set<BusParticipant> = new Set();
        
        // data from the bus calculation algorithms all items transported on this tile
        items: Map<GameData.Item, Set<Connection>> =  new Map<GameData.Item, Set<Connection>>();
        blocked: Set<GameData.Item> = new Set();       
        itemIcons: HTMLImageElement[] = [];
        
        // used by the graph algorithms
        visited: boolean;
        
        constructor(public plan: GamePlan){
            super(plan);
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Bus';
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
            this.outputs.clear();
            this.blocked.clear();
            // first check bus participants, reset bus connections
            for(var i = 0; i <4; i++){
                var t = this.getNeighbour(i);
                this.busConnections[i] = BusConnection.NO;  
                if(t && t.isBusParticipant() && this.isOrientedTowards(i)){
                    var p = <BusParticipant><any>t;
                    p.participant.connectedTo = this;
                    this.directParticipants.add(p);
                    p.participant.blocks.forEach((blocker) => {
                        this.blocked.add(blocker);
                    });
                }
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
            
            var gridSize = Math.max(MIN_GRID_SIZE, Math.ceil(Math.sqrt(this.itemIcons.length)))
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
        private loadFactor<T>(array: T[]): number{
            var used = 0;
            for(var i = 0; i<array.length; i++)
                if(array[i])
                    used++;
            return used / array.length; 
        }
        // called by update_bus after the bus is computed
        // to get best results, call in bfs-like order
        updateIcons(){
            this.itemIcons = new Array();
            // select some input whose ordering we will try to maintain
            // we chose the one with most icons
            var someInput:Bus = null;
            this.inputs.forEach((input) => {
                if(!someInput || input.itemIcons.length >= someInput.itemIcons.length)
                    someInput = input;
            });
            
            var added = new Set();
            // we try to maintain positions on the bus, so in the first iteration we position
            // items that are already on our input bus
            if(someInput){
                this.itemIcons = new Array(someInput.itemIcons.length);
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
            // add everything that did not fit in
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
            
            // if we did not manage to keep the load factor, compress
            if(this.loadFactor(this.itemIcons) < LOAD_FACTOR_REORDER_TRESHOLD 
               && this.itemIcons.length > MIN_GRID_SIZE*MIN_GRID_SIZE){
                var reorderedIcons = [];
                for(var i = 0; i<this.itemIcons.length; i++){
                    if(this.itemIcons[i])
                        reorderedIcons.push(this.itemIcons[i]);
                }
                this.itemIcons = reorderedIcons;
            }
        }
        private imageForItem(item: GameData.Item){
            var img = new Image();
            img.src = this.plan.data.prefix + item.icon;
            img.onload = () => {
                if(this.viewport) 
                    this.updateHtml();
            }
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
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            var table = document.createElement('table');
            table.classList.add('bus-contents');
            this.items.forEach((connections, item) => {
                var tr = document.createElement('tr');
                
                var amountTd = document.createElement('td');
                var amount = 0;
                connections.forEach((c) => amount += c.consumption);
                amountTd.innerText = amount.toFixed(2);
                tr.appendChild(amountTd);
                
                var unitTd = document.createElement('td');
                unitTd.classList.add('unit');
                unitTd.innerText = 'i/m';
                tr.appendChild(unitTd);
                              
                var iconTd = document.createElement('td');
                var icon = document.createElement('img');;
                icon.src = this.plan.data.prefix + item.icon;
                iconTd.appendChild(icon);
                tr.appendChild(iconTd);
                
                var nameTd = document.createElement('td');
                nameTd.innerText = item.name;
                tr.appendChild(nameTd);
                
                table.appendChild(tr);
            });
            contents.appendChild(table);
        }
    }
    
}