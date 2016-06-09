namespace Ui{
    export class SelectRecipe extends Dialog{
        recipe: GameData.Recipe;
        filterInput: HTMLInputElement;
        imageContainer: HTMLDivElement;
        filtered: HTMLImageElement[] = [];
        
        constructor(public plan: Plan.Plan, cb: DialogCallback){
            super(cb);
            this.html.classList.add("select-recipe");
            
            var filter = this.filterInput = document.createElement('input');
            filter.type = 'text';
            filter.addEventListener('keyup', (ev) => {
                if(ev.keyCode == 13 && this.filtered.length == 1){
                    this.filtered[0].click();
                }else{
                    this.filter()
                }
            });
            filter.addEventListener('change', () => this.filter());
            this.html.appendChild(filter);
            
            var div = this.imageContainer = document.createElement('div');
            this.html.appendChild(div);
            var keys:any[] = [];
            for(var recipeName in plan.data.recipe){
                keys.push(recipeName);
            }
            keys.sort();
            this.filtered = [];
            for(var recipeName of keys){
                var recipe  = plan.data.recipe[recipeName];
                var img = new Image();
                img.title = recipe.name;
                img.src = plan.dataPrefix + GameData.iconForRecipe(recipe, plan.data);
                ((recipe) => {
                    img.addEventListener('click', ()=>{
                       this.recipe = recipe;
                       this.closeOk();
                    });
                })(recipe);
                this.filtered.push(img);
                div.appendChild(img);
            }
        }
        show(){
            super.show();
            this.filterInput.focus();
        }
        filter(){
            this.filtered = [];
            for(var i=0; i<this.imageContainer.childNodes.length; i++){
                var img = <HTMLImageElement> this.imageContainer.childNodes[i];
                if(img.title.search(this.filterInput.value) == -1){
                    img.style.display = 'none';
                }else{
                    img.style.display = '';
                    this.filtered.push(img);
                }
            }
        }
    }
}