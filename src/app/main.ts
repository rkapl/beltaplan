namespace App{
    export var data: GameData.Data;
    export var dataPrefix: string;
    

    export var plan: Plan.Plan;
    export var viewport: Ui.Viewport;
    
    export var selectedTile: Plan.Tile;
    
    export enum Mode{NORMAL, PLACE};
    export var currentMode: Mode = Mode.NORMAL;
    
    export function init(){
        initPlacement();
        createDefaultPlan();
        handlers();
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
        });
        document.getElementById('new-producer-type-button').addEventListener('click', () => {
            var dlg = new Ui.SelectProducer(plan, () => {
                selectProducer(dlg.selected);
            });
            dlg.show();
        });
        document.getElementById('')
        window.addEventListener('keypress', (ev) => {
            if(ev.charCode == 114 && currentMode == Mode.NORMAL){
                if(selectedTile){
                    selectedTile.rotate();
                }
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
    function createDefaultPlan(){
        viewport = new Ui.Viewport(document.getElementById("viewport"))
        plan = new Plan.Plan(dataPrefix, data);
        viewport.showPlan(plan);
        for(var i = 0; i < 10; i++){
            var bus = new Plan.Bus(plan);
            bus.orientation = Util.Orientation.EAST;
            plan.setXY(i, 0, bus);
        }
        var iron = new Plan.Source(plan);
        iron.setItem(data.item['iron-plate']);
        iron.orientation = Util.Orientation.NORTH;
        plan.setXY(0,1, iron);
        var copper = new Plan.Source(plan);
        copper.setItem(data.item['copper-plate']);
        copper.orientation = Util.Orientation.NORTH;
        plan.setXY(1,1, copper);
        
        var recipes = [
            "iron-gear-wheel",
            "science-pack-1",
            "copper-cable",            
            "electronic-circuit",
            //"block:copper-cable",
            "basic-transport-belt",
            "basic-inserter",
            "science-pack-2",
            "science-pack-3",
        ];
        
        var factoryData = plan.data.producers['assembling-machine-3'];
        for(var i = 2; i < recipes.length + 2; i++){
            var recipe = recipes[i - 2];
            if(recipe.indexOf('block:') == 0){
                var block = new Plan.Block(plan);
                block.orientation = Util.Orientation.NORTH;
                block.setItem(data.item[recipe.substr('block:'.length)]);
                plan.setXY(i, 1, block);
            }else{
                var factory = new Plan.Factory(plan, factoryData);
                factory.orientation = Util.Orientation.NORTH;
                factory.setRecipe(data.recipe[recipe]);
                plan.setXY(i, 1, factory);
            }
        }
        plan.updateBus();
    }
    export function error(what: string){
        alert(what);
        throw what;
    }
}

var data_path = "base-0.12";
document.addEventListener('DOMContentLoaded', function () {
    document.getElementById("splash-text").innerText = "Loading Factorio " + data_path;
    var request = new XMLHttpRequest();
    request.addEventListener("load", function () {
        App.data = JSON.parse(request.responseText);
        App.dataPrefix = 'data/' + data_path + '/';
        document.getElementById("splash").classList.add("hidden");
        App.init();
    });
    request.open('GET', 'data/' + data_path + '/data.json');
    request.send();
});
//# sourceMappingURL=main.ts.map