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

    export class InfoBox extends Util.Widget{
        public htmlContent: HTMLElement;
        public htmlFooter: HTMLElement;
        public constructor(public tile: TileBase){
            super(tile);
            this.html = document.createElement('div');
            this.showInfoStandardButtons();
        }
        createNumberInputField(text: string, binding: string, unit: string){
            var row = document.createElement('div');
            row.classList.add('key-value-pair');
            
            var label = document.createElement('label');
            label.textContent = text;
            row.appendChild(label);
            
            var input = document.createElement('input');
            input.value = this.tile[binding];
            input.type = 'number';
            input.min = '0';
            input.step = 'any';
            input.onchange = () => {
                this.tile[binding] = parseFloat(input.value);
                if(this.html)
                    this.tile.updateHtml();
                this.tile.notifyChange();
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
        showInfoStandardButtons(){
            var footer = this.htmlFooter = document.createElement('div');
            
            footer.classList.add('footer');
            var rotate = new Image();
            rotate.src = 'img/rotate.svg';
            rotate.classList.add('action-button');
            rotate.classList.add('d1');
            rotate.addEventListener('click', ()=> this.tile.rotate());
            footer.appendChild(rotate);
            
            var deleteButton = new Image();
            deleteButton.src = 'img/delete.svg';
            deleteButton.classList.add('action-button');
            deleteButton.classList.add('d2');
            deleteButton.addEventListener('click', ()=> this.tile.plan.set(this.tile.position, null));
            footer.appendChild(deleteButton);
            
            var contents = document.createElement('div');
            contents.classList.add('contents');
            this.html.appendChild(contents);
            this.html.appendChild(footer);
            
            this.htmlContent = contents;
        }
    }
    export class DefaultInfoBox extends InfoBox{
        public constructor(tile: TileBase){
            super(tile);
            var title = document.createElement('h3');
            title.textContent = this.constructor['name'];
            this.htmlContent.appendChild(title);
        }
    }

    export class TileBase extends Util.HObject implements Ui.InfoBoxContents, Icons.LoadListener{
        // position in tile coordinates (set by Plan)
        public position: Util.Vector;
        public orientation: Util.Orientation;
        // possibly null, if not viewport
        html: HTMLElement;
        viewport: Ui.Viewport;
        
        // the UI peer can be shifted, because it is larger than the actual tile
        shift: Util.Vector; 
        // infobox, if shown
        infoBox: InfoBox;
        infoBoxParent: HTMLElement;
        elementType: string;
        
        constructor(public plan: GamePlan){
            super(null);
            this.position = undefined;          
            this.orientation = Util.Orientation.NORTH;
            this.shift = new Util.Vector(0,0);
        }
        loaded(icon){
            if(this.html)
                this.updateHtml();
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
            this.infoBoxParent = box;
            this.infoBox = this.createInfo();
            this.infoBoxParent.appendChild(this.infoBox.html);
        }
        
        hideInfo(){
            this.infoBoxParent = null;
            this.infoBox.destroy();
            this.infoBox = null;
        }

        createInfo(): InfoBox{
            return new DefaultInfoBox(this);
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
            var box = this.infoBoxParent;
            this.hideInfo();
            this.showInfo(box);
        }
        drawInCenterCb(ctx: CanvasRenderingContext2D, w: number, h: number, o: Util.Orientation, cb: () => void){
            ctx.save();
            ctx.translate(-this.shift.x + Ui.Sizes.TILE_SIZE/2, -this.shift.y + Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(o*Math.PI/2);
            ctx.translate(- w/2, - h/2);
            cb();
            ctx.restore();
        }
        drawInCenter(ctx: CanvasRenderingContext2D, img: HTMLImageElement, o: Util.Orientation){
            this.drawInCenterCb(ctx, img.width, img.height,o, () => {
                ctx.drawImage(img, 0, 0);
            });
        }
        
        notifyChange(){
            if(this.position)
                this.plan.notifyXY(this.position.x, this.position.y, true);
        }
        rotate(){
            this.notifyChange();
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
            super.destroy();
            if(this.html)
                this.removeHtml();
        }
    }
    
    export class ItemTile extends TileBase implements Icons.LoadListener{   
        item: GameData.Item;
        itemIcon: Icons.Icon;
        constructor(plan: GamePlan){
            super(plan);
        }
        setItem(item: GameData.Item){
            this.clearItem();
            this.item = item;
            this.itemIcon = Icons.forItem(this.plan, item);
            this.itemIcon.addLoadListener(this);
            this.notifyChange();
        }
        destroy(){
            super.destroy()
            this.clearItem();
        }
        private clearItem(){
            if(this.itemIcon)
                this.itemIcon.removeLoadListener(this);
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
            
            this.itemIcon.draw(ctx, Ui.Sizes.FACTORIO_TILE_SIZE, Ui.Sizes.FACTORIO_TILE_SIZE, Ui.Sizes.FACTORIO_TILE_SIZE, Ui.Sizes.FACTORIO_TILE_SIZE);
            this.overlay(ctx)
        }
        overlay(ctx: CanvasRenderingContext2D){}
        underlay(ctx: CanvasRenderingContext2D){}
    }
}