namespace Plan{
    
    export class Tile implements Ui.InfoBoxContents{
        position: Util.Vector;
        peer: HTMLElement;
        orientation: Util.Orientation;
        shift: Util.Vector; 
        infoBox: HTMLElement = null;
        constructor(public plan: Plan, elementType: string){
            this.position = undefined;
            this.peer = document.createElement(elementType);
            this.peer.classList.add("tile");
            this.orientation = Util.Orientation.WEST;
            this.shift = new Util.Vector(0,0);
            this.plan.viewport.appendChild(this.peer);
        }
        showInfo(box: HTMLElement){
            this.infoBox = box;
            var rotate = new Image();
            rotate.src = 'img/rotate.svg';
            rotate.classList.add('action-button');
            rotate.classList.add('d1');
            rotate.addEventListener('click', ()=> this.rotate());
            box.appendChild(rotate);
            
            var deleteButton = new Image();
            deleteButton.src = 'img/delete.svg';
            deleteButton.classList.add('action-button');
            deleteButton.classList.add('d2');
            deleteButton.addEventListener('click', ()=> this.plan.set(this.position, null));
            box.appendChild(deleteButton);
            
            this.handleShowInfo(box);
        }
        hideInfo(box: HTMLElement){
            this.infoBox = null;
            while(box.hasChildNodes())
                box.removeChild(box.lastChild)
        }
        updateInfo(){
            if(this.infoBox){
                var box = this.infoBox;
                this.hideInfo(box);
                this.showInfo(box);
            }
        }
        handleShowInfo(box: HTMLElement){
            var title = document.createElement('h3');
            title.innerText = this.constructor['name'];
            box.appendChild(title);
        }
        showInfoRotation(box: HTMLElement){
            
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
        getNeighbourOriented(direction: Util.Orientation){
            var pos = this.position.copy();
            pos.add(Util.Vector.fromOrientation((direction + this.orientation) % 4));
            return this.plan.get(pos);
        }
        /* Gets the direction of the tile if the world is turned so that
           tile 'to' faces WEST */
        relativeOrientation(to: Tile): Util.Orientation{
            return this.orientation - to.orientation;
        }
        /* Do not call externally, just set tile to null */
        remove(){
            this.plan.viewport.removeChild(this.peer);
        }
        updatePeer(){            
            this.peer.style.left = (this.position.x * TILE_SIZE + this.shift.x) + 'px';
            this.peer.style.top = (this.position.y * TILE_SIZE + this.shift.y) + 'px';
            this.updatePeerOrientation();
        }
        updatePeerOrientation(){
            this.peer.style.transform = 'rotate('+ this.orientation*90 +'deg)';
        }
        updateIncludingNeighbours(){
            this.updatePeer();
            for(var i = 0 ; i<4; i++){
                var n = this.getNeighbour(i);
                if(n)
                    n.updatePeer();
            }
        }
    }
    export class ItemTile extends Tile{
        canvas: HTMLCanvasElement;
        item: GameData.Item;
        itemIcon: HTMLImageElement;
        rate: number = 1;
        constructor(plan: Plan){
            super(plan, 'canvas');
            this.canvas = <HTMLCanvasElement>this.peer;
            this.canvas.width = this.canvas.height = TILE_SIZE;
        }
        setItem(item: GameData.Item){
            this.item = item;
            this.itemIcon = new Image();
            this.itemIcon.onload = () => this.updatePeer();
            this.itemIcon.src = this.plan.dataPrefix + this.item.icon;
        }
        updatePeer(){
            super.updatePeer();
            var ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.underlay(ctx);
            
            ctx.save();
            ctx.translate(TILE_SIZE/2, TILE_SIZE/2);
            ctx.rotate(Math.PI/2*this.orientation);
            ctx.drawImage(this.plan.resourceOrientationArrow, -TILE_SIZE/2, -TILE_SIZE/2);
            ctx.restore();
            
            ctx.drawImage(this.itemIcon, FACTORIO_TILE_SIZE, FACTORIO_TILE_SIZE);
            this.overlay(ctx)
        }
        overlay(ctx: CanvasRenderingContext2D){}
        underlay(ctx: CanvasRenderingContext2D){}
        updatePeerOrientation(){
            // empty handled only the indication arrow rotates
        }
    }
}