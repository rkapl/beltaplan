/// <reference path="selector.ts" />
namespace Ui{
    class ModuleAdapter implements DialogItemAdapter<GameData.Module|DeleteModule>{
        constructor(public plan: Plan.GamePlan){}
        
        imageUrl(mod: GameData.Module|DeleteModule): string{
            if(mod instanceof DeleteModule){
                return 'img/delete.svg';
            }else{
                return this.plan.data.prefix + (<GameData.Module>mod).icon;
            }  
        }
    }
    
    class DeleteModule{}
    
    function filterByProducer(data: GameData.Dictionary<GameData.Item>, producer: Plan.Factory, in_beacon: boolean)
        :GameData.Dictionary<GameData.Module|DeleteModule>
    {
        var filtered:GameData.Dictionary<GameData.Module|DeleteModule> = {};
        
        for(var k in data){
            if(data[k].type != 'module')
                continue;
            var mod = <GameData.Module> data[k];
            
            if(GameData.canProducerUseModule(producer.type, producer.recipe , mod, in_beacon))
                filtered[k] = mod;
        }
        return filtered;
    }
    
    class SelectModule extends Selector<GameData.Module|DeleteModule>{        
        constructor(cb: DialogCallback, producer: Plan.Factory, in_beacon: boolean){
            var plan = producer.plan;
            var filtered = filterByProducer(plan.data.item, producer, in_beacon);
            filtered['#delete'] = new DeleteModule();
            super(cb, new ModuleAdapter(plan), filtered);
        }
    }
    
    export class ModuleEditor {
        html: HTMLDivElement;
        direct: HTMLImageElement[] = [];
        beacon: HTMLImageElement[] = [];
        addBeaconImg: HTMLImageElement;
        constructor(public producer: Plan.Factory){
            this.html = document.createElement('div');
            
            var mods = producer.modules;
            if(mods && mods.direct.length != 0){            
                var directDiv = document.createElement('div');
                directDiv.classList.add('key-value-pair');
                
                var directLabel = document.createElement('label');
                directLabel.innerHTML = 'Modules: ';
                directDiv.appendChild(directLabel);
                
                var directValue = document.createElement('span');
                directValue.classList.add('module-list');
                for(var i = 0; i<mods.direct.length; i++){
                    var modslot = document.createElement('img');
                    modslot.classList.add('slot');
                    modslot.onclick = ((i) => () => this.changeDirect(i))(i);
                    this.direct.push(modslot);
                    directValue.appendChild(modslot)
                    this.setDirect(i, mods.direct[i]);
                }
                   
                directDiv.appendChild(directValue);
                this.html.appendChild(directDiv);
            }
            
            var beaconDiv = document.createElement('div');
            beaconDiv.classList.add('key-value-pair');
            
            var beaconLabel = document.createElement('label');
            beaconLabel.innerHTML = "Beacon: ";
            beaconDiv.appendChild(beaconLabel);
            
            var beaconValue = document.createElement('span');
            beaconValue.classList.add('module-list');
                      
            this.addBeaconImg = document.createElement('img');
            this.addBeaconImg.src = 'img/add-slot.png';
            this.addBeaconImg.classList.add('add-slot');
            this.addBeaconImg.onclick = () => this.addBeacon();
            
            beaconValue.appendChild(this.addBeaconImg);
            
            for(var mod of mods.beacon){
                this.addBeaconWithModule(mod);
            }
            
            beaconDiv.appendChild(beaconValue);
            this.html.appendChild(beaconDiv);
        }
        addBeacon(){
            var d = new SelectModule(() => {
                if(!(d.selected instanceof DeleteModule)){
                    this.addBeaconWithModule(<GameData.Module>d.selected);
                    this.producer.modules.beacon.push(<GameData.Module>d.selected);
                }
            }, this.producer, true);
            d.show();
        }
        addBeaconWithModule(mod: GameData.Module){
            // does not add to to factory, only to ui
            var i = this.beacon.length;
            
            var newBeacon = document.createElement('img');
            newBeacon.classList.add('slot');
            newBeacon.onclick = () => {
                newBeacon.parentElement.removeChild(newBeacon);
                this.beacon.splice(i, 1);
                this.producer.modules.beacon.splice(i, 1);
            };
            newBeacon.src = this.producer.plan.data.prefix + mod.icon;
            this.addBeaconImg.parentElement.insertBefore(newBeacon, this.addBeaconImg);
            this.beacon.push(newBeacon);
        }
        changeDirect(i: number){
            var d = new SelectModule(() => this.setDirect(i, d.selected), this.producer, false);
            d.show();
        }
        setBeacon(i: number, mod: GameData.Module){
            this.producer.modules.beacon[i] = mod;
            this.beacon[i].src = this.producer.plan.data.prefix + mod.icon;
        }
        setDirect(i: number, mod: GameData.Module|DeleteModule){
            if(mod == null || mod instanceof DeleteModule){
                this.direct[i].src = 'img/empty-slot.png';
                this.producer.modules.direct[i] = null;
                
            }else{
                this.direct[i].src = this.producer.plan.data.prefix + (<GameData.Module>mod).icon;
                this.producer.modules.direct[i] = <GameData.Module> mod;
            }
                
            
        }
    }
}