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
        
        public html: HTMLElement;
        private background: HTMLElement;
        private pressedKeys: {[index: number] : boolean} = {};
        private isScrolling: boolean;
        private lastAnimationTime: number;
        private plan: Plan.Plan;
        
        constructor(html: HTMLElement){
            this.html = html;
            this.resourceOrientationArrow = new Image();
            this.resourceOrientationArrow.src = 'img/orientation-arrow.svg';
            
            this.resourceRecipeOverlayDecal = new Image();
            this.resourceRecipeOverlayDecal.src = 'img/recipe-overlay-decal.svg';
            
            this.resourceBlock = new Image();
            this.resourceBlock.src = 'img/block.svg';
            
            this.resourceAlert = new Image();
            this.resourceAlert.src = 'img/alert.svg';
            
            this.background = <HTMLElement>this.html.getElementsByClassName('viewport-background')[0];
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
        showPlan(plan: Plan.Plan){
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
                (client.x - this.offset.x)/Sizes.TILE_SIZE,
                (client.y - this.offset.y)/Sizes.TILE_SIZE);
        }
        gridToClient(grid: Util.Vector):Util.Vector{
            return new Util.Vector(
                grid.x*Sizes.TILE_SIZE + this.offset.x, 
                grid.y*Sizes.TILE_SIZE + this.offset.y);
        }
        private resizeBackground(){
            var w = Math.ceil(window.innerWidth/Sizes.TILE_SIZE + 1)*Sizes.TILE_SIZE;
            var h = Math.ceil(window.innerHeight/Sizes.TILE_SIZE + 1)*Sizes.TILE_SIZE;
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
            this.html.style.transform = "translate(" + x + "px," + y + "px) translateZ(0)";
            this.html.style.transformOrigin = "0px 0px";
            
            if(typeof window['InstallTrigger'] !== 'undefined'){
                // Gecko seems to handle background-position just fine but has problems with
                // the repaint of layer edges
                this.background.style.transform = "translate(" + -x + "px," + -y + "px)";
                this.background.style.backgroundPosition = 
                    Util.mod(x, Sizes.TILE_SIZE) + 'px ' + Util.mod(y, Sizes.TILE_SIZE) + 'px';
            }else{
                // Chrome causes repaints on backgroundPosition change
                var bgx = -x + Util.mod(x, Sizes.TILE_SIZE) - Sizes.TILE_SIZE;
                var bgy = -y + Util.mod(y, Sizes.TILE_SIZE) - Sizes.TILE_SIZE;
                this.background.style.transform = "translate(" + bgx + "px," + bgy + "px) translateZ(0)";
                this.background.style.transformOrigin = "0px 0px";
            }
        } 
    }
}