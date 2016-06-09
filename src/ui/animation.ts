namespace Ui{
    export interface OnloadCallback{
        (anim: Animation): void;
    }
    export interface Animation{
        onload: OnloadCallback[];
        loaded: boolean;
        prepare(canvas: HTMLCanvasElement, orientation: Util.Orientation, shiftOut: Util.Vector);
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation);
    }

    class AnimationSet implements Animation{
        parts: AnimationPart[] = new Array(4);
        onload: OnloadCallback[] = [];
        loaded: boolean = false;
        constructor(data: GameData.AnimationSet, public plan: Plan.Plan){
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
        prepare(canvas: HTMLCanvasElement, orientation: Util.Orientation, shiftOut: Util.Vector){
            this.parts[orientation].prepare(canvas, Util.Orientation.WEST, shiftOut);
        }
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation){
            this.parts[orientation].render(canvas, Util.Orientation.WEST);
        }
    }
    interface RejectedShift{
        factorioRejectedShiftX: number;
        factorioRejectedShiftY: number;
    }
    class AnimationPart implements Animation{
        image: HTMLImageElement;
        onload: OnloadCallback[] = [];
        loaded: boolean = false;
        constructor(public data: GameData.AnimationPart, public plan: Plan.Plan){
            this.image = new Image();
            this.image.onload = () => {
                this.loaded = true;
                for(var onload of this.onload){
                    onload(this);
                }
            };
            this.image.src = plan.dataPrefix + data.filename;
        }
        prepare(canvas: HTMLCanvasElement, orientation: Util.Orientation, shiftOut: Util.Vector){
            
            var rshift = <RejectedShift><any> canvas;
            shiftOut.x = this.data.shift[0] * Plan.FACTORIO_TILE_SIZE;
            shiftOut.y = this.data.shift[1] * Plan.FACTORIO_TILE_SIZE;
            canvas.width = this.data.width;
            // the canvas must always cover the whole tile, but may be larger
            if(canvas.width + shiftOut.x < Plan.FACTORIO_TILE_SIZE)
                canvas.width = Plan.FACTORIO_TILE_SIZE - shiftOut.x;
            if(canvas.height + shiftOut.y < Plan.FACTORIO_TILE_SIZE)
                canvas.width = Plan.FACTORIO_TILE_SIZE - shiftOut.y;
            canvas.height = this.data.height;
            canvas.style.width = canvas.width + 'px';
            canvas.style.height = canvas.height + 'px';
            
            if(shiftOut.x > 0){
                rshift.factorioRejectedShiftX = shiftOut.x;
                shiftOut.x = 0;
            }else{ 
                rshift.factorioRejectedShiftX = 0;
            }
            if(shiftOut.y > 0){
                rshift.factorioRejectedShiftY = shiftOut.y;
                shiftOut.x = 0;
            }else{
                rshift.factorioRejectedShiftY = 0;
            }
        }
        render(canvas: HTMLCanvasElement, orientation: Util.Orientation){
            var ctx = canvas.getContext("2d");
            var rshift = <RejectedShift><any> canvas;
            ctx.drawImage(this.image, rshift.factorioRejectedShiftX, rshift.factorioRejectedShiftY);
        }
    }
    
    export function animationFromData(
        data: GameData.AnimationSet | GameData.AnimationPart,
        plan: Plan.Plan,
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