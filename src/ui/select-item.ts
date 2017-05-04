/// <reference path="selector.ts" />
namespace Ui{
    class ItemAdapter implements DialogItemAdapter<GameData.Item>{
        constructor(public plan: Plan.GamePlan){}
        
        createImage(parent: Util.HObject, item: GameData.Item): Util.Widget{
            return new Icons.IconView(parent, Icons.forItem(this.plan, item));
        }
    }
    
    export class SelectItem extends Selector<GameData.Item>{        
        constructor(public plan: Plan.GamePlan, cb: DialogCallback){
            super(cb, new ItemAdapter(plan), plan.data.item);
        }
    }
}