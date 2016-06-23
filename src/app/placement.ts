namespace App{
    var selectedProducer: GameData.Producer;
    var defaultProducer: GameData.Producer;
    var placementOrientation: Util.Orientation = Util.Orientation.NORTH;
    
    export interface TileCreator{
        (previousTile: Plan.Tile): Plan.Tile;
    }
    class PlaceButton{
        public html: HTMLElement;
        public htmlClickHandler: HTMLElement;
        public constructor(buttonId: string, public creator: TileCreator, clickHandler?: string){
            this.html = document.getElementById(buttonId);
            if(!clickHandler)
                clickHandler = buttonId;
            this.htmlClickHandler = document.getElementById(clickHandler);
        }
    }
    
    var placementButtons: PlaceButton[];
    var selectedPlacementButton: PlaceButton = null; 
    var placementRectangle: HTMLImageElement;
    
    var placementDefaultRecipes: GameData.Recipe[];
    var placementDefaultItem: GameData.Item;
       
    export function initPlacementForPlan(){
        defaultProducer = selectedProducer = plan.data.producers["assembling-machine-3"];
        placementDefaultRecipes = [
            plan.data.recipe['iron-gear-wheel'],
            plan.data.recipe['basic-oil-processing'],
            plan.data.recipe['plastic-bar'],
            plan.data.recipe['iron-plate'],
            plan.data.recipe['rocket-part'],
       ];
        placementDefaultItem = plan.data.item['iron-gear-wheel'];

        for(var i = 0; i<placementDefaultRecipes.length; i++){
            if(placementDefaultRecipes[i] == null)
                error("Factorio data incomplete");
        }
        if(placementDefaultItem == null)
            error("Factorio data incomplete");
        if (!selectedProducer)
            error("Factorio data incomplete");
            
        selectProducer(defaultProducer);
    }          
    export function initPlacement(){
        placementRectangle = <HTMLImageElement> document.getElementById('placement-rectangle');
        
        // setup placement buttons and register their events
        var producerPlacementButton = 
        placementButtons = [
            new PlaceButton('button-place-bus', () => new Plan.Bus(plan)), 
            producerPlacementButton = new PlaceButton('button-place-producer', () => { 
                var f = new Plan.Factory(plan, selectedProducer);
                f.setRecipe(placementDefaultRecipes[0]);
                for(var i = 0; i<placementDefaultRecipes.length; i++){
                    if(GameData.canProducerProduceRecipe(selectedProducer, placementDefaultRecipes[i]))
                        f.setRecipe(placementDefaultRecipes[i]);
                }
                return f;
            }, 'button-place-producer-click-area'),
            new PlaceButton('button-place-blocker', () => {
                var b = new Plan.Block(plan);
                b.setItem(placementDefaultItem);
                return b;
            }),
            new PlaceButton('button-place-source', () => {
                var s = new Plan.Source(plan);
                s.setItem(placementDefaultItem);
                return s;
            }),
            new PlaceButton('button-place-sink', () => {
               var s = new Plan.Sink(plan);
               s.setItem(placementDefaultItem);
               return s; 
            })
        ];
        for(var i = 0; i< placementButtons.length; i++){
            ((b: PlaceButton) => {
                b.htmlClickHandler.onclick = () => {
                    if(selectedPlacementButton)
                            selectedPlacementButton.html.classList.remove('selected');
                            
                    if(b == selectedPlacementButton){
                        leavePlacementMode();
                    }else{
                        selectedPlacementButton = b;
                        b.html.classList.add('selected');
                        enterPlacementMode();
                    }
                };
            })(placementButtons[i]);
        }
        document.getElementById('new-producer-type-button').addEventListener('click', () => {
            var dlg = new Ui.SelectProducer(plan, () => {
                selectProducer(dlg.selected);
                placementButtons[1].htmlClickHandler.click();
            });
            dlg.show();
        }); 
    }
    export function selectProducer(producer: GameData.Producer){
        selectedProducer = producer;
        var img = <HTMLImageElement> document.getElementById("selected-producer-img");
        img.src = App.plan.data.prefix + selectedProducer.icon;
    }
    function enterPlacementMode(){
        viewport.html.addEventListener('mousemove', hover);
        viewport.html.addEventListener('click', click);
        window.addEventListener('keyup', keyup);
        window.addEventListener('keypress', keypress);
        currentMode = Mode.PLACE;
    }
    function leavePlacementMode(){
        viewport.html.removeEventListener('mousemove', hover);
        viewport.html.removeEventListener('click', click);
        window.removeEventListener('keyup', keyup);
        window.removeEventListener('keypress', keypress);
        placementRectangle.style.display = 'none';
        currentMode = Mode.NORMAL;
        selectedPlacementButton.html.classList.remove('selected');
        selectedPlacementButton = null;
    }
    function hover(ev: MouseEvent){
        var pos = viewport.clientToGrid(new Util.Vector(ev.clientX, ev.clientY));
        placementRectangle.style.left = Math.floor(pos.x) * Ui.Sizes.TILE_SIZE + "px";
        placementRectangle.style.top = Math.floor(pos.y) * Ui.Sizes.TILE_SIZE + "px";
        placementRectangle.style.display = "block";
    }
    function click(ev: MouseEvent){
        var pos = viewport.clientToGrid(new Util.Vector(ev.clientX, ev.clientY));
        pos.floor();
        var previous = plan.get(pos);
        var tile = selectedPlacementButton.creator(previous);
        tile.orientation = placementOrientation;
        plan.set(pos, tile);
        selectTile(tile);
    }
    function keypress(ev: KeyboardEvent){
        if(ev.charCode == 114){
            placementOrientation = Util.addOrientation(placementOrientation, 1);
            placementRectangle.style.transform = 'rotate('+ placementOrientation*90 +'deg)'
        }
    }
    function keyup(ev: KeyboardEvent){
        if(ev.keyCode == 27){ // escape
            leavePlacementMode();
        }else if(ev.keyCode == 81){ // q
            leavePlacementMode();
        }
    }
}