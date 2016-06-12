/// <reference path="selector.ts" />
namespace Ui{
    class RecipeAdapter implements DialogItemAdapter<GameData.Recipe>{
        constructor(public plan: Plan.GamePlan){}
        
        imageUrl(recipe: GameData.Recipe): string{
            return this.plan.data.prefix + GameData.iconForRecipe(recipe, this.plan.data);
        }
    }
    
    export class SelectRecipe extends Selector<GameData.Recipe>{        
        constructor(public plan: Plan.GamePlan, cb: DialogCallback){
            super(cb, new RecipeAdapter(plan), plan.data.recipe);
        }
    }
}