namespace App{
    export function createDefaultPlan(data: GameData.Data): Plan.GamePlan{
        var plan = new Plan.GamePlan(data);
        for(var i = 0; i < 10; i++){
            var bus = new Plan.Bus(plan);
            bus.orientation = Util.Orientation.EAST;
            plan.setXY(i, 0, bus);
        }
        var iron = new Plan.Source(plan);
        iron.setItem(data.item['iron-plate']);
        iron.orientation = Util.Orientation.NORTH;
        plan.setXY(0,1, iron);
        var copper = new Plan.Source(plan);
        copper.setItem(data.item['copper-plate']);
        copper.orientation = Util.Orientation.NORTH;
        plan.setXY(1,1, copper);
        
        var recipes = [
            "iron-gear-wheel",
            "science-pack-1",
            "copper-cable",            
            "electronic-circuit",
            //"block:copper-cable",
            "basic-transport-belt",
            "basic-inserter",
            "science-pack-2",
            "science-pack-3",
        ];
        
        var factoryData = plan.data.producers['assembling-machine-3'];
        for(var i = 2; i < recipes.length + 2; i++){
            var recipe = recipes[i - 2];
            if(recipe.indexOf('block:') == 0){
                var block = new Plan.Block(plan);
                block.orientation = Util.Orientation.NORTH;
                block.setItem(data.item[recipe.substr('block:'.length)]);
                plan.setXY(i, 1, block);
            }else{
                var factory = new Plan.Factory(plan, factoryData);
                factory.orientation = Util.Orientation.NORTH;
                factory.setRecipe(data.recipe[recipe]);
                plan.setXY(i, 1, factory);
            }
        }
        plan.updateBus();
        return plan;
    }
}