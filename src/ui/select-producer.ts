/// <reference path="selector.ts" />
namespace Ui{
    class ProducerAdapter implements DialogItemAdapter<GameData.Producer>{
        constructor(public plan: Plan.Plan){}
        
        imageUrl(producer: GameData.Producer): string{
            return this.plan.dataPrefix + producer.icon;
        }
    }
    
    export class SelectProducer extends Selector<GameData.Producer>{        
        constructor(public plan: Plan.Plan, cb: DialogCallback){
            super(cb, new ProducerAdapter(plan), plan.data.producers);
        }
    }
}