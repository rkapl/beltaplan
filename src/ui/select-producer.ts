/// <reference path="selector.ts" />
namespace Ui{
    class ProducerAdapter implements DialogItemAdapter<GameData.Producer>{
        constructor(public plan: Plan.GamePlan){}
        
        imageUrl(producer: GameData.Producer): string{
            return this.plan.data.prefix + producer.icon;
        }
    }
    
    export class SelectProducer extends Selector<GameData.Producer>{        
        constructor(public plan: Plan.GamePlan, cb: DialogCallback){
            super(cb, new ProducerAdapter(plan), plan.data.producers);
        }
    }
}