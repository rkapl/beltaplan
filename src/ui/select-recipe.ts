/// <reference path="selector.ts" />
namespace Ui{
    class RecipeAdapter implements DialogItemAdapter<GameData.Recipe>{
        constructor(public plan: Plan.GamePlan){}
        
        createImage(parent: Util.HObject, item: GameData.Recipe): Util.Widget{
            return new Icons.IconView(parent, Icons.forRecipe(this.plan, item));
        }
    }
    
    export interface RecipePredicate{
        (r: GameData.Recipe): boolean;
    } 
    
    function filterWith(data: GameData.Dictionary<GameData.Recipe>, filter: RecipePredicate)
        :GameData.Dictionary<GameData.Recipe>
    {
        var filtered:GameData.Dictionary<GameData.Recipe> = {};
        for(var k in data){
            if(filter(data[k]))
                filtered[k] = data[k];
        }
        return filtered;
    }
    
    export class SelectRecipe extends Selector<GameData.Recipe>{        
        constructor(public plan: Plan.GamePlan, filter: RecipePredicate, cb: DialogCallback){
            super(cb, new RecipeAdapter(plan), filterWith(plan.data.recipe, filter));
        }
    }
}