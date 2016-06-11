///<reference path="tile.ts" />

namespace Plan{
    export class Factory extends TileBase implements BusParticipant{
        animation: Ui.Animation;
        recipe: GameData.Recipe;
        needs: Set<GameData.Item>;
        provides: Set<GameData.Item>;
        missing: Set<GameData.Item> = new Set();
        connectedTo: Bus;
        recipeIcon: HTMLImageElement;
        constructor(plan: Plan, public type: GameData.Producer){
            super(plan);
            this.setRecipe(plan.data.recipe['iron-gear-wheel'])
            this.animation = Ui.animationFromData(this.type.animation, plan, () => {
                this.updateState();
            });
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            this.showInfoStandardButtons();
            
            var title = document.createElement('h3');
            title.innerText = this.type.name;
            box.appendChild(title);
            
            var recipe = document.createElement('div');
            recipe.classList.add('recipe');
            box.appendChild(recipe);
            
            for(var needs of this.recipe.ingredients){
                var ingredient = document.createElement('span');
                var img = new Image();
                var item = this.plan.data.item[needs.name];
                img.src= this.plan.dataPrefix + item.icon;
                ingredient.appendChild(document.createTextNode(needs.amount.toString()));
                ingredient.appendChild(img);
                if(this.missing.has(item))
                    ingredient.classList.add("missing");
                recipe.appendChild(ingredient);
            }
            
            recipe.appendChild(document.createTextNode(String.fromCharCode(0x25b6)));
            
            for(var provides of this.recipe.results){
                
                var result = document.createElement('span');
                var img = new Image();
                img.src = this.plan.dataPrefix + this.plan.data.item[provides.name].icon;
                result.appendChild(document.createTextNode(provides.amount.toString()));
                result.appendChild(img);
                recipe.appendChild(result);
            }
            
            var recipeButton = document.createElement('button');
            recipeButton.innerText = 'Change recipe';
            recipeButton.onclick =  () => {
                var d = new Ui.SelectRecipe(this.plan, ()=>{
                    this.setRecipe(d.selected);
                    this.updateState();
                });
                d.show();
            };
            box.appendChild(recipeButton);
        }
        isBusParticipant(): boolean{
            return true;
        }
        setRecipe(recipe: GameData.Recipe){
            this.recipe = recipe;
            this.provides = new Set(); 
            for(var result of this.recipe.results){
                this.provides.add(this.plan.data.item[result.name]);
            }
            this.recipeIcon = new Image();
            this.recipeIcon.onload = () => this.updateState();
            this.recipeIcon.src = this.plan.dataPrefix + GameData.iconForRecipe(recipe, this.plan.data);
            this.needs = new Set();
            for(var ingredient of recipe.ingredients){
                this.needs.add(this.plan.data.item[ingredient.name]);
            }
        }
        drawInCenter(ctx: CanvasRenderingContext2D, img: HTMLImageElement, o: Util.Orientation){
            ctx.save();
            ctx.translate(-this.shift.x + Ui.Sizes.TILE_SIZE/2, -this.shift.y + Ui.Sizes.TILE_SIZE/2);
            ctx.rotate(o*Math.PI/2);
            ctx.drawImage(img, - img.width/2, - img.height/2);
            ctx.restore();
        }
        updateHtml(){
            super.updateHtml();
            var canvas = <HTMLCanvasElement>this.html;
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.animation.prepare(canvas, this.orientation, this.shift);
            this.animation.render(canvas, this.orientation);
            
            this.drawInCenter(ctx, this.viewport.resourceRecipeOverlayDecal, 0)
            this.drawInCenter(ctx, this.viewport.resourceOrientationArrow, this.orientation);
            this.drawInCenter(ctx, this.recipeIcon, 0);
            
            if(this.missing.size > 0)
                this.drawInCenter(ctx, this.viewport.resourceAlert, 0);           
        }
        setMissing(missing: Set<GameData.Item>){
            this.missing = missing;
        }
    }
}