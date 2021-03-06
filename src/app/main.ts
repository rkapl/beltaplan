namespace App{
    export var plan: Plan.GamePlan;
    export var viewport: Ui.Viewport;
    
    export var selectedTile: Plan.Tile;
    
    export enum Mode{NORMAL, PLACE};
    export var currentMode: Mode = Mode.NORMAL;
    
    export function init(){
        initPlacement();
        viewport = new Ui.Viewport(document.getElementById('viewport'));
        initLocalStorage(() =>{
            handlers();
            hideSplash();
        });
    }
    // listens to tile changes 
    export class TileSelectionListener implements Plan.GamePlanListener{
        changed(x: number, y:number, contentOnly: boolean){
            if(selectedTile && !contentOnly){
                if(selectedTile.position.x == x && selectedTile.position.y == y){
                    selectTile(null);
                }
            }
        }
    }
    export function error(what: string){
        alert(what);
        throw what;
    }
    export function warning(what: string){
        alert(what);
    }
    function handlers(){
        document.getElementById("viewport").addEventListener('click', (ev) => {
            if(currentMode == Mode.NORMAL){
                var grid =  viewport.clientToGrid(new Util.Vector(ev.clientX, ev.clientY));
                grid.floor();
                var tile = plan.get(grid);
                selectTile(tile);                    
            }
        });
        document.getElementById('button-recalculate').addEventListener('click', () => {
           plan.updateBus();
           if(selectedTile)
                selectedTile.updateInfo(); 
        });
        
        window.addEventListener('keypress', (ev) => {
            if(ev.charCode == 114 && currentMode == Mode.NORMAL && ev.target == document.body && selectedTile){
                selectedTile.rotate();
            }
        });
        window.addEventListener('keydown', (ev) => {
            if(ev.keyCode == 46 && currentMode == Mode.NORMAL && ev.target == document.body && selectedTile){
                plan.set(selectedTile.position, null);
            }
        });
        
    }
    export function selectTile(tile: Plan.Tile){
        var selection = document.getElementById('selection-rectangle');
        var infobox = document.getElementById('infobox');
        if(selectedTile){
            selectedTile.hideInfo();
        }
        selectedTile = tile;
        if(tile){
            tile.showInfo(infobox);
            selection.style.left =tile.position.x * Ui.Sizes.TILE_SIZE + 'px';
            selection.style.top = tile.position.y * Ui.Sizes.TILE_SIZE + 'px';
            selection.style.display = "block";
        }else{
            selection.style.display = "none";
        }
    }
    
    document.addEventListener('DOMContentLoaded', function () {
        init();        
    });
}
//# sourceMappingURL=main.ts.map