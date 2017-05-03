namespace Plan{    
    export interface BusParticipant{
        participant: BusParticipantData;
        
        // processes consumption on fromConnections and sets consumption
        // on toConnections
        itemTransferFunction();
    }
    export class Connection{
        from: BusParticipant;
        to: BusParticipant;
        item: GameData.Item;
        
        ready: boolean;
        consumption: number;
    }
    export class BusParticipantData{
        connectedTo: Bus;
        provides: Set<GameData.Item> = new Set();
        needs: Set<GameData.Item> = new Set();
        blocks: Set<GameData.Item> = new Set();
        
        fromConnections: Map<GameData.Item, Set<Connection>> = new Map<GameData.Item, Set<Connection>>();
        toConnections: Map<GameData.Item, Connection> = new Map<GameData.Item, Connection>();
        
        fromConnectionsConsumption(item: GameData.Item){
            var t = 0;
            if(this.fromConnections.has(item)){
                this.fromConnections.get(item).forEach((c) => {
                    t += c.consumption;
                });
            }
            return t;
        }

        forAllFromConnections(cb: (c: Connection) => void){
            this.fromConnections.forEach((set) => {
               set.forEach((c) => {
                   cb(c);
               });
            });
        }
        areAllFromConnectionsReady(){
            var ready = true;
            this.forAllFromConnections((c) => {
                ready = (ready && c.ready);
            });
            return ready;
        }
    }
}