/// <reference path="selector.ts" />
namespace Ui{
    class RecipeAdapter implements DialogItemAdapter<GameData.Recipe>{
        constructor(public plan: Plan.Plan){}
        
        imageUrl(recipe: GameData.Recipe): string{
            return this.plan.dataPrefix + GameData.iconForRecipe(recipe, this.plan.data);
        }
    }
    
    export class SelectRecipe extends Selector<GameData.Recipe>{        
        constructor(public plan: Plan.Plan, cb: DialogCallback){
            super(cb, new RecipeAdapter(plan), plan.data.recipe);
        }
    }
}