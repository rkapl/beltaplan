/// <reference path="selector.ts" />
namespace Ui{
    class ProducerAdapter implements DialogItemAdapter<GameData.Producer>{
        constructor(public plan: Plan.GamePlan){}
        
        createImage(parent: Util.HObject, item: GameData.Producer): Util.Widget{
            return new Icons.IconView(parent, Icons.forItem(this.plan, item));
        }
    }
    
    export class SelectProducer extends Selector<GameData.Producer>{        
        constructor(public plan: Plan.GamePlan, cb: DialogCallback){
            super(cb, new ProducerAdapter(plan), plan.data.producers);
        }
    }
}