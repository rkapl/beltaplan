namespace Plan{    
    export interface BusParticipant{
        participant: BusParticipantData;
    }
    export class BusParticipantData{
        connectedTo: Bus;
        provides: Set<GameData.Item> = new Set();
        needs: Set<GameData.Item> = new Set();
        blocks: Set<GameData.Item> = new Set();
        
        fromConnections: Map<GameData.Item, Set<Connection>> = new Map<GameData.Item, Set<Connection>>();
        toConnections: Map<GameData.Item, Set<Connection>> = new Map<GameData.Item, Set<Connection>>();
    }
}