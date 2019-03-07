namespace Icons{
    export class IconView extends Util.Widget implements LoadListener{
        private canvas: HTMLCanvasElement
        public constructor(parent: Util.HObject, public icon: Icon){
            super(parent);
            this.html = this.canvas = document.createElement('canvas');
            this.canvas.width = 32;
            this.canvas.height = 32;
            icon.addLoadListener(this);
        }
        loaded(icon){
            var ctx = this.canvas.getContext("2d");
            this.icon.draw(ctx, 0, 0, 32, 32);
        }
    }

    export interface LoadListener{
        loaded(object);
    }

    export class Icon {
        listeners: Set<LoadListener> = new Set();
        loaded: boolean;
        w: number;
        h: number;
        public constructor(public layers: IconLayer[]){
            for(let l of this.layers){
                l.image = new Image();
                l.image.onload = () => {
                    l.loaded = true;
                    this.checkLoaded();
                };
                l.image.src = l.url;
            }
        }
        public addLoadListener(l: LoadListener){
            if(this.loaded)
                l.loaded(this);
            this.listeners.add(l);
        }
        public removeLoadListener(l: LoadListener){
            this.listeners.delete(l);
        }
        private checkLoaded(){
            for(var l of this.layers){
                if(!l.loaded)
                    return;
            }

            this.loaded = true;
            this.w = this.layers[0].image.width;
            this.h = this.layers[0].image.height;
            this.listeners.forEach((l) => l.loaded(this));
        }
        public createView(): IconView{
            var iconView = <IconView><any> document.createElement('canvas');
            return iconView;
        }
        public draw(ctx: CanvasRenderingContext2D, x:number, y:number, w:number, h:number){
            if(!this.loaded)
                return;

            var helper = document.createElement('canvas');
            helper.width = this.w;
            helper.height = this.h;
            var helperCtx = helper.getContext('2d');
            helperCtx.globalCompositeOperation = 'copy';
            for(var l of this.layers){
                helperCtx.drawImage(l.image, 0, 0);
                if(l.tint){
                    // tint the image pixel by pixel
                    var a = l.tint.a;
                    var imgData = helperCtx.getImageData(0, 0, this.w, this.h);
                    var buf = imgData.data;
                    var len = this.w * this.h * 4;
                    for(var i = 0; i<len; i+=4){
                        buf[i+0] = buf[i+0]*(1-a) + l.tint.r*0xFF*a;
                        buf[i+1] = buf[i+1]*(1-a) + l.tint.g*0xFF*a;
                        buf[i+2] = buf[i+2]*(1-a) + l.tint.b*0xFF*a;
                    }
                    helperCtx.putImageData(imgData, 0, 0);
                }
                // draw it to the destination
                ctx.drawImage(helper, x, y, w, h);
            }
        }
    }

    class IconLayer{
        public image: HTMLImageElement;
        public loaded: boolean;
        public constructor(public url:string, public tint: GameData.RGBA){
        }
    }

    var recipeMap: {
        [key:string]: Icon;
    } = {};

    var itemMap: {
        [key:string]: Icon;
    } = {};

    export function forRecipe(plan: Plan.GamePlan, r: GameData.Recipe):Icon{
        var k = plan.data.version + "/" + r.name;
        if(recipeMap[k])
            return recipeMap[k];

        var icon;
        if(r.icon || r.icons){
            icon = forItem(plan, r);
        }else{
            icon = forItem(plan, plan.data.item[GameData.recipeVariant(r).results[0].name])
        }
        return recipeMap[k] = icon;
    }

    export function forItem(plan: Plan.GamePlan, item: GameData.IconHolder): Icon{
        var k = plan.data.version + "/" + item.name;
        if(itemMap[k])
            return itemMap[k];

        var icon;
        if(item.icon){
            icon = new Icon([new IconLayer(plan.data.prefix + item.icon, null)]);
        }else{
            var layers = [];
            for(var factorioLayer of item.icons){
                layers.push(new IconLayer(plan.data.prefix + factorioLayer.icon, factorioLayer.tint));
            }
            icon = new Icon(layers);
        }
        return itemMap[k] = icon;
    }
}