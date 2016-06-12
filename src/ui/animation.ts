namespace Ui{
    export interface OnloadCallback{
        (anim: Animation): void;
    }
    export interface Animation{
        onload: OnloadCallback[];
        loaded: boolean;
        prepare(canvas: HTMLCanvasElement, scale: number, orientation: Util.Orientation, shiftOut: Util.Vector);
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation);
    }

    class AnimationSet implements Animation{
        parts: AnimationPart[] = new Array(4);
        onload: OnloadCallback[] = [];
        loaded: boolean = false;
        constructor(data: GameData.AnimationSet, public plan: Plan.GamePlan){
            this.parts[Util.Orientation.WEST] = new AnimationPart(data.west, plan);
            this.parts[Util.Orientation.EAST] = new AnimationPart(data.east, plan);
            this.parts[Util.Orientation.NORTH] = new AnimationPart(data.north, plan);
            this.parts[Util.Orientation.SOUTH] = new AnimationPart(data.south, plan);
            // wait for all parts to load then fire our own handler
            for(var part of this.parts){
                part.onload.push(()=>{
                    for(var part of this.parts){
                        if(!part.loaded) return;
                    }
                    this.loaded = true;
                    for(var onload of this.onload){
                        onload(this);
                    }
                });
            }
        }
        prepare(canvas: HTMLCanvasElement, scale: number, orientation: Util.Orientation, shiftOut: Util.Vector){
            this.parts[orientation].prepare(canvas, scale, Util.Orientation.WEST, shiftOut);
        }
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation){
            this.parts[orientation].render(canvas, Util.Orientation.WEST);
        }
    }
    interface AnimationCanvas{
        factorioRejectedShiftX: number;
        factorioRejectedShiftY: number;
        factorioScale: number;
    }
    class AnimationPart implements Animation{
        image: HTMLImageElement;
        onload: OnloadCallback[] = [];
        loaded: boolean = false;
        constructor(public data: GameData.AnimationPart, public plan: Plan.GamePlan){
            this.image = new Image();
            this.image.onload = () => {
                this.loaded = true;
                for(var onload of this.onload){
                    onload(this);
                }
            };
            this.image.src = plan.data.prefix + data.filename;
        }
        prepare(canvas: HTMLCanvasElement, scale: number, orientation: Util.Orientation, shiftOut: Util.Vector){
            // a Factorio animation is centered in the drawn area and then the shift is applied
            // We will convert them to shift from (0,0), not the center. Then we will 
            // compensate for the case where canvas would not cover all the tiles
            var w = this.data.width;
            var h = this.data.height;
            var x = Ui.Sizes.TILE_SIZE/2 - this.data.width*scale / 2 + this.data.shift[0] * scale * Ui.Sizes.FACTORIO_TILE_SIZE;
            var y = Ui.Sizes.TILE_SIZE/2 - this.data.height*scale / 2 + this.data.shift[1] * scale * Ui.Sizes.FACTORIO_TILE_SIZE;
            
            // remember the rejected shift -- that is which shift was applied to fix the 
            // canvas size here
            var rshift = <AnimationCanvas><any> canvas;
            rshift.factorioRejectedShiftX = 0;
            rshift.factorioRejectedShiftY = 0;
            rshift.factorioScale = scale;
            if(x > 0){
                rshift.factorioRejectedShiftX = x;
                x = 0;
            }
            if(y > 0){
                rshift.factorioRejectedShiftY = y;
                y = 0;
            }
            if(x + w < Ui.Sizes.TILE_SIZE)
                w = Ui.Sizes.TILE_SIZE - x;
            if(y + h < Ui.Sizes.TILE_SIZE)
                h = Ui.Sizes.TILE_SIZE - y;
                
            canvas.height = h;
            canvas.width = w;
            canvas.style.width = w + "px";
            canvas.style.height = h + "px";
            shiftOut.x = x;
            shiftOut.y = y;
                
        }
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation){
            var ctx = canvas.getContext("2d");
            var rshift = <AnimationCanvas><any> canvas;
            ctx.drawImage(this.image,
                0, 0,
                this.data.width, this.data.height, 
                rshift.factorioRejectedShiftX, rshift.factorioRejectedShiftY,
                this.data.width * rshift.factorioScale, this.data.height * rshift.factorioScale); 
        }
    }
    
    export function animationFromData(
        data: GameData.AnimationSet | GameData.AnimationPart,
        plan: Plan.GamePlan,
        cb: OnloadCallback): Animation
    {
            if(!data.jsanimation){
                if((<GameData.AnimationSet>data).north){
                    data.jsanimation = new AnimationSet(<GameData.AnimationSet>data, plan);
                }else{
                    data.jsanimation = new AnimationPart(<GameData.AnimationPart>data, plan);
                }
            }
            if(data.jsanimation.loaded){
                cb(data.jsanimation);
            }else{
                data.jsanimation.onload.push(cb);
            }
            return data.jsanimation;
    }
}