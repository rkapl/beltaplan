namespace Plan{   
    export interface Tile{
        position: Util.Vector
        orientation: Util.Orientation;
        
        // called whenever this tile or its neighbors have changed
        updateState();
        // rotate the tile (increase orientation)
        rotate();
        // true if BusParticipant interface is supported
        isBusParticipant():boolean;
        destroy();
        
        // UI stuff
        showInfo(box: HTMLElement);
        hideInfo();
        updateInfo();
        
        createHtml(vp: Ui.Viewport);
        updateHtml()
        removeHtml();
        
        serialize(destination);
        deserialize(from);
    }
    
    export class TileBase implements Ui.InfoBoxContents{
        // position in tile coordinates (set by Plan)
        public position: Util.Vector;
        public orientation: Util.Orientation;
        // possibly null, if not viewport
        html: HTMLElement;
        viewport: Ui.Viewport;
        
        // the UI peer can be shifted, because it is larger than the actual tile
        shift: Util.Vector; 
        // infobox, if shown
        infoBox: HTMLElement = null;
        elementType: string;
        
        constructor(public plan: GamePlan){
            this.position = undefined;          
            this.orientation = Util.Orientation.NORTH;
            this.shift = new Util.Vector(0,0);
        }
        
        serialize(json){
            json.x = this.position.x;
            json.y = this.position.y;
            json.orientation = this.orientation;
        }
        deserialize(json){
            this.orientation = json.orientation;
        }
        
        showInfo(box: HTMLElement){
            this.infoBox = box;
        }
        
        hideInfo(){
            while(this.infoBox.hasChildNodes())
                this.infoBox.removeChild(this.infoBox.lastChild)
            this.infoBox = null;
        }
        
        createHtml(vp: Ui.Viewport){
            if(this.html)
                throw "Peer already set";
                
            this.html = this.createHtmlElement();
            this.html.classList.add("tile");
            this.viewport = vp;
            this.viewport.html.appendChild(this.html);
            this.updateHtml();
        }
        
        removeHtml(){
            this.viewport.html.removeChild(this.html);
            this.viewport = null;
            this.html = null;
        }
        
        createHtmlElement(): HTMLElement{
            var canvas = document.createElement('canvas');
            canvas.width = canvas.height = Ui.Sizes.TILE_SIZE;
            return canvas;
        }
        
        updateInfo(){
            var box = this.infoBox;
            this.hideInfo();
            this.showInfo(box);
        }
        
        showInfoHeader(){
            var title = document.createElement('h3');
            title.textContent = this.constructor['name'];
            this.infoBox.appendChild(title);
        }
        drawInCenter(ctx: CanvasRenderingContext2D, img: HTMLImageElement, o: Util.Orientation){
            ctx.save();
            ctx.translate(-this.shift.x + Ui.Sizes.TILE_SIZE/2, -this.shift.y + Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(o*Math.PI/2);
            ctx.drawImage(img, - img.width/2, - img.height/2);
            ctx.restore();
        }
        createNumberInputField(text: string, binding: string, unit: string){
            var row = document.createElement('div');
            row.classList.add('key-value-pair');
            
            var label = document.createElement('label');
            label.textContent = text;
            row.appendChild(label);
            
            var input = document.createElement('input');
            input.value = this[binding];
            input.type = 'number';
            input.min = '0';
            input.onchange = () => {
                this[binding] = input.value;
            };
            row.appendChild(input);
            
            var unitLabel = document.createElement('span');
            unitLabel.textContent = unit;
            row.appendChild(unitLabel);
            
            return row;
        }
        createPropertyDisplay(text: string, value: string, unit: string){
            var div = document.createElement('div');
            div.classList.add('key-value-pair');
            
            var label = document.createElement('label');
            label.textContent = text;
            div.appendChild(label);
            
            var valueSpan = document.createElement('span');
            valueSpan.textContent = value;
            div.appendChild(valueSpan);
            
            var unitSpan = document.createElement('span');
            unitSpan.textContent = unit;
            div.appendChild(unitSpan);
            
            return div;
        }
        // make a footer with buttons, return a div where a content should be placed
        showInfoStandardButtons(footerCallback?: (footer: HTMLElement) => void): HTMLDivElement{
            var footer = document.createElement('div');
            
            footer.classList.add('footer');
            var rotate = new Image();
            rotate.src = 'img/rotate.svg';
            rotate.classList.add('action-button');
            rotate.classList.add('d1');
            rotate.addEventListener('click', ()=> this.rotate());
            footer.appendChild(rotate);
            
            var deleteButton = new Image();
            deleteButton.src = 'img/delete.svg';
            deleteButton.classList.add('action-button');
            deleteButton.classList.add('d2');
            deleteButton.addEventListener('click', ()=> this.plan.set(this.position, null));
            footer.appendChild(deleteButton);
            
            var contents = document.createElement('div');
            contents.classList.add('contents');
            this.infoBox.appendChild(contents);
            this.infoBox.appendChild(footer);
            
            if(footerCallback)
                footerCallback(footer);
            
            return contents;
        }
        rotate(){
            this.orientation = (this.orientation+1)%4;
            this.updateIncludingNeighbours();  
        }

        isBusParticipant():boolean{
            return false;
        }
        getNeighbour(direction: Util.Orientation){
            var pos = this.position.copy();
            pos.add(Util.Vector.fromOrientation(direction));
            return this.plan.get(pos);
        }
        /* Gets the direction of the tile if the world is turned so that
           tile 'to' faces WEST */
        relativeOrientation(to: Tile): Util.Orientation{
            return this.orientation - to.orientation;
        }
        updateState(){
            if(this.infoBox)
                this.updateInfo();
            if(this.html)
                this.updateHtml();            
        }
        updateHtml(){
            this.html.style.left = (this.position.x * Ui.Sizes.TILE_SIZE + this.shift.x) + 'px';
            this.html.style.top = (this.position.y * Ui.Sizes.TILE_SIZE + this.shift.y) + 'px';
        }
        updateIncludingNeighbours(){
            this.updateState();
            for(var i = 0 ; i<4; i++){
                var n = this.getNeighbour(i);
                if(n)
                    n.updateState();
            }
        }
        destroy(){
            if(this.html)
                this.removeHtml();
        }
    }
    
    export class ItemTile extends TileBase{   
        item: GameData.Item;
        itemIcon: HTMLImageElement;
        constructor(plan: GamePlan){
            super(plan);
        }
        setItem(item: GameData.Item){
            this.item = item;
            this.itemIcon = new Image();
            this.itemIcon.onload = () => {
                if(this.html)
                    this.updateHtml();
            };
            this.itemIcon.src = this.plan.data.prefix + this.item.icon;
        }
        serialize(json){
            super.serialize(json);
            json.item = this.item.name;
        }
        deserialize(json){
            super.deserialize(json);
            this.setItem(this.plan.data.item[json.item]);
        }
        updateHtml(){
            super.updateHtml();
            var canvas = <HTMLCanvasElement> this.html;
            canvas.width = canvas.height = Ui.Sizes.TILE_SIZE;
            
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.underlay(ctx);
            
            ctx.save();
            ctx.translate(Ui.Sizes.TILE_SIZE/2, Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(Math.PI/2*this.orientation);
            ctx.drawImage(this.viewport.resourceOrientationArrow, -Ui.Sizes.TILE_SIZE/2, -Ui.Sizes.TILE_SIZE/2);
            ctx.restore();
            
            ctx.drawImage(this.itemIcon, Ui.Sizes.FACTORIO_TILE_SIZE, Ui.Sizes.FACTORIO_TILE_SIZE);
            this.overlay(ctx)
        }
        overlay(ctx: CanvasRenderingContext2D){}
        underlay(ctx: CanvasRenderingContext2D){}
    }
}