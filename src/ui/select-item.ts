/// <reference path="selector.ts" />
namespace Ui{
    class ItemAdapter implements DialogItemAdapter<GameData.Item>{
        constructor(public plan: Plan.Plan){}
        
        imageUrl(item: GameData.Item): string{
            return this.plan.dataPrefix + item.icon;
        }
    }
    
    export class SelectItem extends Selector<GameData.Item>{        
        constructor(public plan: Plan.Plan, cb: DialogCallback){
            super(cb, new ItemAdapter(plan), plan.data.item);
        }
    }
}