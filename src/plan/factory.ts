///<reference path="tile.ts" />

namespace Plan{
   
    export class Factory extends TileBase implements BusParticipant{
        private animation: Ui.Animation;
        private recipe: GameData.Recipe;
        participant: BusParticipantData = new BusParticipantData();
        private recipeIcon: HTMLImageElement;
        private type: GameData.Producer;
        private consumption: number = 0;
        private cpm: number;
        
        constructor(plan: GamePlan, type: GameData.Producer){
            super(plan);
            if(type)
                this.setType(type);
        }
        itemTransferFunction(){
            this.cpm = 0; // cycles per minute
            for(var i = 0; i<this.recipe.results.length; i++){
                var result = this.recipe.results[i];
                var resultItem = this.plan.data.item[result.name];
                var needed = this.participant.fromConnectionsConsumption(resultItem);
                if(this.recipe.results.length == 1)
                    needed += this.consumption;
                    
                this.cpm = Math.max(this.cpm, needed/result.amount);
            }
            
            for(var i = 0; i<this.recipe.ingredients.length; i++){
                var ingredient = this.recipe.ingredients[i];
                var ingredientItem = this.plan.data.item[ingredient.name];
                if(this.participant.toConnections.has(ingredientItem)){
                    var c = this.participant.toConnections.get(ingredientItem);
                    c.consumption = ingredient.amount * this.cpm;
                }
            }
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
            if(this.recipe.results.length == 1)
                json.consumption = this.consumption;
        }
        deserialize(json){
            super.deserialize(json);
            this.setType(this.plan.data.producers[json.producer]);
            this.setRecipe(this.plan.data.recipe[json.recipe])
            this.consumption = json.consumption;
            if(this.consumption == undefined)
                // JSON compatibility
                this.consumption = 0;
        }
        showInfo(box: HTMLElement){
            super.showInfo(box);
            var contents = this.showInfoStandardButtons();
            
            var title = document.createElement('h3');
            title.textContent = this.type.name;
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
            recipeButton.textContent = 'Change recipe';
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
            
            if(this.recipe.results.length == 1){
                contents.appendChild(this.createNumberInputField('Over-production:', 'consumption', 'i/m'));
            }
            
            if(this.cpm != undefined){
                contents.appendChild(this.createPropertyDisplay('Production cycles:', this.cpm.toFixed(2), 'c/m'));
                
                var energy = this.recipe.energy_required;
                if(!energy)
                    energy = 0.5; 
                    
                var cycle_time = energy / this.type.crafting_speed / 60; 
                var producers = this.cpm * cycle_time;
                contents.appendChild(this.createPropertyDisplay('Producers needed:', producers.toFixed(2), ''));
            }
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
                
            if(this.recipe.results.length == 1 && this.consumption > 0){
                ctx.font = "bold 15px Lato";
                ctx.textAlign = "center";
                ctx.textBaseline = "center";
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                
                var x =  - this.shift.x + Ui.Sizes.TILE_SIZE/2;
                var y =  - this.shift.y + Ui.Sizes.TILE_SIZE - 12
                var text = this.consumption.toFixed(2) + " i/s";
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            }           
        }
    }
}