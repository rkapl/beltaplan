///<reference path="tile.ts" />

namespace Plan{
    export class Factory extends TileBase implements BusParticipant{
        private animation: Ui.Animation;
        private recipe: GameData.Recipe;
        participant: BusParticipantData = new BusParticipantData();
        private recipeIcon: HTMLImageElement;
        private type: GameData.Producer;
        
        constructor(plan: GamePlan, type: GameData.Producer){
            super(plan);
            if(type)
                this.setType(type);
        }
        isMissing(item: GameData.Item): boolean{
            return !this.participant.toConnections.has(item);
        }
        isAnyMissing(): boolean{
            var missing = false;
            this.participant.needs.forEach((item) => {
                if(this.isMissing(item))
                    missing = true;
            });
            return missing;
        }
        setType(type: GameData.Producer){
            this.type = type;
            this.setRecipe(this.plan.data.recipe['iron-gear-wheel'])
            this.animation = Ui.animationFromData(this.type.animation, this.plan, () => {
                this.updateState();
            });
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Factory';
            json.recipe = this.recipe.name;
            json.producer = this.type.name;
        }
        deserialize(json){
            super.deserialize(json);
            this.setType(this.plan.data.producers[json.producer]);
            this.setRecipe(this.plan.data.recipe[json.recipe])
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            
            var title = document.createElement('h3');
            title.innerText = this.type.name;
            contents.appendChild(title);
            
            var recipe = document.createElement('div');
            recipe.classList.add('recipe');
            contents.appendChild(recipe);
            
            for(var needs of this.recipe.ingredients){
                var ingredient = document.createElement('span');
                var img = new Image();
                var item = this.plan.data.item[needs.name];
                img.src= this.plan.data.prefix + item.icon;
                ingredient.appendChild(document.createTextNode(needs.amount.toString()));
                ingredient.appendChild(img);
                if(this.isMissing(item))
                    ingredient.classList.add("missing");
                recipe.appendChild(ingredient);
            }
            
            recipe.appendChild(document.createTextNode(String.fromCharCode(0x25b6)));
            
            for(var provides of this.recipe.results){
                
                var result = document.createElement('span');
                var img = new Image();
                img.src = this.plan.data.prefix + this.plan.data.item[provides.name].icon;
                result.appendChild(document.createTextNode(provides.amount.toString()));
                result.appendChild(img);
                recipe.appendChild(result);
            }
            
            var recipeButton = document.createElement('button');
            recipeButton.innerText = 'Change recipe';
            recipeButton.onclick =  () => {
                var d = new Ui.SelectRecipe(this.plan,
                    (r: GameData.Recipe) => GameData.canProducerProduceRecipe(this.type, r), 
                    ()=>{
                        this.setRecipe(d.selected);
                        this.updateIncludingNeighbours();
                    });
                d.show();
            };
            contents.appendChild(recipeButton);
        }
        isBusParticipant(): boolean{
            return true;
        }
        setRecipe(recipe: GameData.Recipe){
            this.recipe = recipe;
            this.participant.provides = new Set(); 
            for(var result of this.recipe.results){
                this.participant.provides.add(this.plan.data.item[result.name]);
            }
            this.recipeIcon = new Image();
            this.recipeIcon.onload = () => this.updateState();
            this.recipeIcon.src = this.plan.data.prefix + GameData.iconForRecipe(recipe, this.plan.data);
            this.participant.needs = new Set();
            for(var ingredient of recipe.ingredients){
                this.participant.needs.add(this.plan.data.item[ingredient.name]);
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
            
            var tiles = Math.max(GameData.entityTileHeight(this.type), GameData.entityTileWidth(this.type));
            var scale = 3/tiles;
            
            this.animation.prepare(canvas, scale, this.orientation, this.shift);
            this.animation.render(canvas, this.orientation);
            
            this.drawInCenter(ctx, this.viewport.resourceRecipeOverlayDecal, 0)
            this.drawInCenter(ctx, this.viewport.resourceOrientationArrow, this.orientation);
            this.drawInCenter(ctx, this.recipeIcon, 0);
            
            if(this.isAnyMissing())
                this.drawInCenter(ctx, this.viewport.resourceAlert, 0);           
        }
    }
}