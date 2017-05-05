namespace Ui{
    export namespace Sizes{
        export var FACTORIO_TILE_SIZE = 32;
        export var TILE_SIZE = FACTORIO_TILE_SIZE*3;
    }
    
    var SCROLL_SPEED = 1;
    export class Viewport{
        public resourceOrientationArrow : HTMLImageElement;
        public resourceRecipeOverlayDecal : HTMLImageElement;
        public resourceBlock : HTMLImageElement;
        public resourceAlert : HTMLImageElement;
        
        public offset: Util.Vector = new Util.Vector(128, 128);
        public zoom: number = 1;
        // in units per pixel scroll, for pgup/down its for 0.2sec
        private zoomSpeed: number = 0.002;
        a
        public html: HTMLElement;
        private background: HTMLElement;
        private pressedKeys: {[index: number] : boolean} = {};
        private isScrollingOrZooming: boolean;
        private lastAnimationTime: number;
        private plan: Plan.GamePlan;
        
        constructor(html: HTMLElement){
            this.html = html;
            this.resourceOrientationArrow = new Image();
            this.resourceOrientationArrow.onload = () => this.updateAll();
            this.resourceOrientationArrow.src = 'img/orientation-arrow.svg';
            
            this.resourceRecipeOverlayDecal = new Image();
            this.resourceRecipeOverlayDecal.onload = () => this.updateAll();
            this.resourceRecipeOverlayDecal.src = 'img/recipe-overlay-decal.svg';
            
            this.resourceBlock = new Image();
            this.resourceBlock.src = 'img/block.svg';
            
            this.resourceAlert = new Image();
            this.resourceAlert.src = 'img/alert.svg';
            
            this.background = <HTMLElement>this.html.getElementsByClassName('viewport-background')[0];
            window.addEventListener('keydown', (e) => {
                if(this.ignoreKeypressInside(<HTMLElement>e.target))
                    return;
               
               if(e.keyCode == 33 || e.keyCode == 34)
                    e.preventDefault();
               
               this.pressedKeys[e.keyCode] = true;
               if(!this.isScrollingOrZooming 
                    && (!this.currentScrollDirection().isZero()
                        || this.currentZoomDirection() != 0)){
                    this.isScrollingOrZooming = true;
                    window.requestAnimationFrame((ts) => this.scrollAnimation(ts));
                    this.lastAnimationTime = performance.now();
               }
            });
            window.addEventListener('keyup', (e) => {
               delete this.pressedKeys[e.keyCode];
            });
            window.addEventListener('resize', (e) => this.resizeBackground());
            window.addEventListener('wheel', (e) => {
                if(e.deltaMode == e.DOM_DELTA_LINE || e.deltaMode == e.DOM_DELTA_PAGE){
                    this.applyZoom(1 - e.deltaY * 10 * this.zoomSpeed);
                }else{
                    this.applyZoom(1 - e.deltaY * this.zoomSpeed);
                }
            });
            this.resizeBackground();
            this.updateScroll();
        }
        private updateAll(){
            if(this.plan)
                this.plan.forAllTiles((t: Plan.Tile) => t.updateHtml());
        }
        private ignoreKeypressInside(tag: HTMLElement){
            return tag.tagName.toLowerCase() == 'input' || tag.tagName.toLowerCase() == 'textarea';
        }
        showPlan(plan: Plan.GamePlan){
            if(plan == this.plan)
                return;
            if(this.plan){
                this.plan.forAllTiles((t: Plan.Tile) => t.removeHtml());
                this.plan.viewport = null;
            }
            this.plan = plan;
            this.plan.viewport = this;
            this.plan.forAllTiles((t: Plan.Tile) => t.createHtml(this));
            
        }
        clientToGrid(client: Util.Vector):Util.Vector{
            return new Util.Vector(
                (client.x - this.offset.x)/(this.zoom*Sizes.TILE_SIZE),
                (client.y - this.offset.y)/(this.zoom*Sizes.TILE_SIZE));
        }
        gridToClient(grid: Util.Vector):Util.Vector{
            return new Util.Vector(
                grid.x*this.zoom*Sizes.TILE_SIZE + this.offset.x, 
                grid.y*this.zoom*Sizes.TILE_SIZE + this.offset.y);
        }
        private resizeBackground(){
            var w = Math.ceil(window.innerWidth/(Sizes.TILE_SIZE*this.zoom) + 1)*Sizes.TILE_SIZE;
            var h = Math.ceil(window.innerHeight/(Sizes.TILE_SIZE*this.zoom) + 1)*Sizes.TILE_SIZE;
            this.background.style.width = w + 'px';
            this.background.style.height = h + 'px';
        }
        private applyZoom(scale: number){
            // maintain the center
            var windowCenter = new Util.Vector(window.innerWidth/2, window.innerHeight/2);
            var center = this.clientToGrid(windowCenter);
            
            this.zoom *= scale;
            this.offset = center;
            this.offset.scale(this.zoom * Sizes.TILE_SIZE);
            this.offset.sub(windowCenter);
            this.offset.scale(-1);
            
            // opacity scaling
            var gridTreshold = 0.2;
            var gridFadeDuration = 0.3;
            var fade = (this.zoom - gridTreshold)/gridFadeDuration;
            this.background.style.opacity = Math.max(Math.min(fade ,1 ), 0).toString();
            
            this.updateScroll();
            this.resizeBackground();
        }
        private scrollAnimation(ts: number){
            var offset = this.currentScrollDirection();
            var zoomDirection = this.currentZoomDirection();
            this.isScrollingOrZooming = false;
            
            var delta = ts - this.lastAnimationTime;
            if(!offset.isZero()){
                this.isScrollingOrZooming = true;
                this.lastAnimationTime = ts;
                offset.scale(-SCROLL_SPEED * delta);
                this.offset.add(offset);
                this.updateScroll();
            }
            
            if(zoomDirection != 0){
                this.isScrollingOrZooming = true;
                this.applyZoom(1 + this.zoomSpeed*zoomDirection*delta*0.2);
            }
            
            if(this.isScrollingOrZooming){
                window.requestAnimationFrame((ts) => this.scrollAnimation(ts))
            }
        }
        private currentScrollDirection():Util.Vector{
            var p = new Util.Vector(0, 0);
            for(var key in this.pressedKeys){
                p.add(this.keyCodeToDirection(parseInt(key)));
            }
            return p;
        }
        private currentZoomDirection(): number{
            if(this.pressedKeys[33])
                return -1;
            else if (this.pressedKeys[34])
                return 1;
            else return 0;
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
            this.html.style.transform = "translate(" + x + "px," + y + "px) translateZ(0) scale("+this.zoom+")";
            this.html.style.transformOrigin = "0px 0px";
            
            var bgx = -x/this.zoom;
            var bgy = -y/this.zoom
            var bgxTileSlack = Util.mod(x/this.zoom, Sizes.TILE_SIZE);
            var bgyTileSlack = Util.mod(y/this.zoom, Sizes.TILE_SIZE); 
            
            if(typeof window['InstallTrigger'] !== 'undefined'){
                // Gecko seems to handle background-position just fine but has problems with
                // the repaint of layer edges
                this.background.style.transform = "translate(" + bgx + "px," + bgy + "px)";
                this.background.style.backgroundPosition = 
                    bgxTileSlack + 'px ' + bgyTileSlack + 'px';
            }else{
                // Chrome causes repaints on backgroundPosition change
                var bgxPos = bgx + bgxTileSlack - Sizes.TILE_SIZE;
                var bgyPos = bgy + bgyTileSlack - Sizes.TILE_SIZE;
                this.background.style.transform = "translate(" + bgxPos + "px," + bgyPos + "px) translateZ(0)";
                this.background.style.transformOrigin = "0px 0px";
            }
        } 
    }
}