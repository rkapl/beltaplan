/// <reference path="selector.ts" />
namespace Ui{
    class ItemAdapter implements DialogItemAdapter<GameData.Item>{
        constructor(public plan: Plan.GamePlan){}
        
        imageUrl(item: GameData.Item): string{
            return this.plan.data.prefix + item.icon;
        }
    }
    
    export class SelectItem extends Selector<GameData.Item>{        
        constructor(public plan: Plan.GamePlan, cb: DialogCallback){
            super(cb, new ItemAdapter(plan), plan.data.item);
        }
    }
}