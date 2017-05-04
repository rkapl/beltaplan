///<reference path="tile.ts" />

namespace Plan{
   
   export class FactoryModules{
       constructor(public producer: GameData.Producer){
           if(producer.module_specification)
               this.direct = new Array(producer.module_specification.module_slots);
           else
               this.direct = [];
           this.beacon = []; 
       }
       public anyDirectSet(): boolean{
           for(var d of this.direct){
               if(d)
                    return true;
           }
           return false;
       }
       public serialize(json){
           if(this.anyDirectSet())
                json.direct = this.direct.map((m) => m && m.name);
           if(this.beacon.length > 0)
                json.beacon = this.beacon.map((m) => m.name);
       }
       
       public deserialize(json, data: GameData.Data){
           if(json.direct)
                this.direct = (<string[]>json.direct).map((s) => <GameData.Module>data.item[s]);
           if(json.beacon)
                this.beacon = (<string[]>json.beacon).map((s) => <GameData.Module>data.item[s]);
       }
       public collectEffects(): GameData.ModuleEffect{
           var r = {
               productivity: {bonus: 1},
               speed: {bonus: 1},
               consumption: {bonus: 1},
               pollution: {bonus: 1},
           };
           function collectEffect(e: GameData.ModuleEffect, c: number){
               if(e == null)
                    return;
               if(e.productivity)
                    r.productivity.bonus += e.productivity.bonus * c;
               if(e.speed)
                    r.speed.bonus += e.speed.bonus * c;
               if(e.consumption)
                    r.consumption.bonus += e.consumption.bonus * c;
               if(e.pollution)
                    r.pollution.bonus += e.pollution.bonus * c;
           }
           for(var d of this.direct){
               if(d != null)
                    collectEffect(d.effect, 1);
           }
           for(var b of this.beacon){
               if(b != null)
                    collectEffect(b.effect, 0.5);
           }
           return r;
       }
       
       public direct: GameData.Module[];
       public beacon: GameData.Module[];
   }

   class FactoryInfoBox extends InfoBox{
       public constructor(public factory: Factory){
            super(factory);
            
            var title = document.createElement('h3');
            title.textContent = this.factory.type.name;
            this.htmlContent.appendChild(title);
            
            var recipe = document.createElement('div');
            recipe.classList.add('recipe');
            this.htmlContent.appendChild(recipe);
            
            for(var needs of this.factory.recipeVariant.ingredients){
                var ingredient = document.createElement('span');
                var item = this.factory.plan.data.item[needs.name];
                var img = new Icons.IconView(this, Icons.forItem(this.factory.plan, item))
                ingredient.appendChild(document.createTextNode(needs.amount.toString()));
                ingredient.appendChild(img.html);
                if(this.factory.isMissing(item))
                    ingredient.classList.add("missing");
                recipe.appendChild(ingredient);
            }
            
            recipe.appendChild(document.createTextNode(" " + String.fromCharCode(0x25b6) + " "));
            
            for(var provides of this.factory.recipeVariant.results){
                var result = document.createElement('span');
                var img = new Icons.IconView(this, Icons.forItem(this.factory.plan, this.factory.plan.data.item[provides.name]));

                result.appendChild(document.createTextNode(provides.amount.toString()));
                result.appendChild(img.html);
                recipe.appendChild(result);
            }
            
            var recipeButton = document.createElement('button');
            recipeButton.textContent = 'Change recipe';
            recipeButton.onclick =  () => {
                var d = new Ui.SelectRecipe(this.factory.plan,
                    (r: GameData.Recipe) => GameData.canProducerProduceRecipe(this.factory.type, r), 
                    ()=>{
                        this.factory.setRecipe(d.selected);
                        this.factory.updateIncludingNeighbours();
                    });
                d.show();
            };
            this.htmlContent.appendChild(recipeButton);
            
            if(this.factory.recipeVariant.results.length == 1){
                this.htmlContent.appendChild(this.createNumberInputField('Over-production:', 'consumption', 'i/m'));
            }
            
            if(this.factory.cpm != undefined){
                this.htmlContent.appendChild(this.createPropertyDisplay('Production cycles:', this.factory.cpm.toFixed(2), 'c/m'));
                
                var time = this.factory.recipeVariant.energy_required;
                if(!time)
                    time = 0.5; 
                    
                var speed =  this.factory.type.crafting_speed * this.factory.totalEffect.speed.bonus;
                var cycle_time = time / speed; 
                var producers = this.factory.cpm * (cycle_time / 60);
                this.htmlContent.appendChild(this.createPropertyDisplay('Producers needed:', producers.toFixed(2), ''));
                this.htmlContent.appendChild(this.createPropertyDisplay('Cycle time:', cycle_time.toFixed(2), 's'));
            }
            
            var modeditor = new Ui.ModuleEditor(this, this.factory);
            this.htmlContent.appendChild(modeditor.html);
       }
   }
   
   export class Factory extends TileBase implements BusParticipant, Icons.LoadListener{
        private animation: Ui.Animation;
        recipe: GameData.Recipe;
        recipeVariant: GameData.RecipeVariant
        participant: BusParticipantData = new BusParticipantData();
        private recipeIcon: Icons.Icon;
        type: GameData.Producer;
        modules: FactoryModules;
        totalEffect: GameData.ModuleEffect;
        consumption: number = 0;
        cpm: number;
        
        constructor(plan: GamePlan, type: GameData.Producer){
            super(plan);
            if(type)
                this.setType(type);
        }
        itemTransferFunction(){
            this.cpm = 0; // cycles per minute
            // collect requirements and take the max cpm
            for(var result of this.recipeVariant.results){
                var resultItem = this.plan.data.item[result.name];
                var needed = this.participant.fromConnectionsConsumption(resultItem);
                if(this.recipeVariant.results.length == 1)
                    needed += this.consumption;
                    
                this.cpm = Math.max(this.cpm, needed/result.amount);
            }
            
            this.totalEffect = this.modules.collectEffects();
            this.cpm /= this.totalEffect.productivity.bonus;
                        
            for(var ingredient of this.recipeVariant.ingredients){
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
            this.modules = new FactoryModules(type);
            this.setRecipe(this.plan.data.recipe['iron-gear-wheel'])
            this.animation = Ui.animationFromData(this.type.animation, this.plan, () => {
                this.updateState();
            });
            this.notifyChange();
        }
        serialize(json){
            super.serialize(json);
            json.type = 'Factory';
            json.recipe = this.recipe.name;
            json.producer = this.type.name;
            
            if(this.modules)
                this.modules.serialize(json);
                
            if(this.recipeVariant.results.length == 1)
                json.consumption = this.consumption;
        }
        deserialize(json){
            super.deserialize(json);
            this.setType(this.plan.data.producers[json.producer]);
            this.setRecipe(this.plan.data.recipe[json.recipe])
            if(this.modules)
                this.modules.deserialize(json, this.plan.data);
            this.consumption = json.consumption;
            if(this.consumption == undefined)
                // JSON compatibility
                this.consumption = 0;
        }
        createInfo(): InfoBox{
            return new FactoryInfoBox(this);
        }
        isBusParticipant(): boolean{
            return true;
        }
        setRecipe(recipe: GameData.Recipe){
            this.clearRecipe();
            this.recipe = recipe;
            this.recipeVariant = GameData.recipeVariant(recipe);
            this.participant.provides = new Set(); 
            for(var result of this.recipeVariant.results){
                this.participant.provides.add(this.plan.data.item[result.name]);
            }
            this.recipeIcon = Icons.forRecipe(this.plan, recipe);
            this.recipeIcon.addLoadListener(this);
            this.participant.needs = new Set();
            for(var ingredient of GameData.recipeVariant(recipe).ingredients){
                this.participant.needs.add(this.plan.data.item[ingredient.name]);
            }
        }
        private clearRecipe(){
            if(this.recipeIcon)
                this.recipeIcon.removeLoadListener(this);
        }
        destroy(){
            super.destroy();
            this.clearRecipe();
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
            
            var iconSize = 32;
            this.drawInCenter(ctx, this.viewport.resourceRecipeOverlayDecal, 0)
            this.drawInCenter(ctx, this.viewport.resourceOrientationArrow, this.orientation);
            this.drawInCenterCb(ctx, iconSize, iconSize, 0, () => {
                this.recipeIcon.draw(ctx, 0,0, iconSize, iconSize);
            });
            
            if(this.isAnyMissing())
                this.drawInCenter(ctx, this.viewport.resourceAlert, 0);
                
            if(this.recipeVariant.results.length == 1 && this.consumption > 0){
                ctx.font = "bold 15px Lato";
                ctx.textAlign = "center";
                ctx.textBaseline = "center";
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                
                var x =  - this.shift.x + Ui.Sizes.TILE_SIZE/2;
                var y =  - this.shift.y + Ui.Sizes.TILE_SIZE - 12
                var text = this.consumption.toFixed(2) + " i/m";
                ctx.strokeText(text, x, y);
                ctx.fillText(text, x, y);
            }           
        }
    }
}