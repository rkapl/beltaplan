///<reference path="tile.ts" />

namespace Plan{
    export class Factory extends Tile implements BusParticipant{
        canvas: HTMLCanvasElement;
        animation: Ui.Animation;
        recipe: GameData.Recipe;
        needs: Set<GameData.Item>;
        provides: Set<GameData.Item>;
        missing: Set<GameData.Item> = new Set();
        connectedTo: Bus;
        recipeIcon: HTMLImageElement;
        factories: number = 1;
        constructor(plan: Plan, public type: GameData.Producer){
            super(plan, 'canvas');
            this.canvas = <HTMLCanvasElement>this.peer;
            this.setRecipe(plan.data.recipe['iron-gear-wheel'])
            this.animation = Ui.animationFromData(this.type.animation, plan, () => {
                this.updatePeer();
            });
        }
        handleShowInfo(box: HTMLElement){
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
                    this.setRecipe(d.recipe);
                    this.updatePeer();
                    this.updateInfo();
                });
                d.show();
            };
            box.appendChild(recipeButton);
            box.appendChild(document.createElement('hr'));
            
            var multiplicity = document.createElement('div');
            var factories_label = document.createElement('label');
            factories_label.innerText = "Factories:";
            multiplicity.appendChild(factories_label);
            var factories_spinner = document.createElement('input');
            factories_spinner.type = 'number';
            factories_spinner.min = '1';
            factories_spinner.max = '100';
            factories_spinner.value = this.factories.toString();
            factories_spinner.addEventListener('change', () => {
               this.factories = parseInt(factories_spinner.value);
               this.updatePeer(); 
            });
            multiplicity.appendChild(factories_spinner);          
            box.appendChild(multiplicity);
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
            this.recipeIcon.onload = () => this.updatePeer();
            this.recipeIcon.src = this.plan.dataPrefix + GameData.iconForRecipe(recipe, this.plan.data);
            this.needs = new Set();
            for(var ingredient of recipe.ingredients){
                this.needs.add(this.plan.data.item[ingredient.name]);
            }
        }
        drawInCenter(ctx: CanvasRenderingContext2D, img: HTMLImageElement, o: Util.Orientation){
            ctx.save();
            ctx.translate(-this.shift.x + TILE_SIZE/2, -this.shift.y + TILE_SIZE/2);
            ctx.rotate(o*Math.PI/2);
            ctx.drawImage(img, - img.width/2, - img.height/2);
            ctx.restore();
        }
        updatePeer(){
            super.updatePeer();
            var ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.animation.prepare(this.canvas, this.orientation, this.shift);
            this.animation.render(this.canvas, this.orientation);
            
            this.drawInCenter(ctx, this.plan.resourceRecipeOverlayDecal, 0)
            this.drawInCenter(ctx, this.plan.resourceOrientationArrow, this.orientation);
            this.drawInCenter(ctx, this.recipeIcon, 0);
            
            if(this.missing.size > 0)
                this.drawInCenter(ctx, this.plan.resourceAlert, 0);
            
            ctx.font = "bold 20px sans-serif";
            ctx.textAlign = "right";
            var text = this.factories + "x";
            ctx.fillStyle = "white";
            ctx.strokeStyle = "black"
            ctx.lineWidth = 3;
            ctx.strokeText(text, -this.shift.x + TILE_SIZE*0.8, -this.shift.y + FACTORIO_TILE_SIZE*2.9);
            ctx.fillText(text, -this.shift.x + TILE_SIZE*0.8, -this.shift.y + FACTORIO_TILE_SIZE*2.9);            
        }
        updatePeerOrientation(){
            // empty, handled by animation
        }
        setMissing(missing: Set<GameData.Item>){
            this.missing = missing;
            this.updatePeer();
        }
    }
}