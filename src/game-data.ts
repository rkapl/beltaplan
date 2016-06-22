namespace GameData{
    // helper types for the raw data
    type Box = number[][];
    
    export interface Dictionary<T>{
        [id: string]: T;
    }
    
    // raw data imported from the json
    export interface Data{
        producers: Dictionary<Producer>;
        item: Dictionary<Item>;
        recipe: Dictionary<Recipe>;
        
        // prefix and version is filled by the loader
        // all data in this dataset can be downloaded by prepending this url
        prefix: string;
        // game version from which the data come
        version: string;
    }
    export interface Item{
        icon: string
        name: string;
    }
    export interface Producer{
        icon: string;
        type: string;   
        name: string;
        crafting_speed: number;
        animation: AnimationPart | AnimationSet;
        module_specification: { 
            module_slots: number;
        } 
        energy_source: {
            type: string,
        }
        crafting_categories: string[]
        collision_box: Box
        selection_box: Box
        drawing_box: Box
        tile_width: number
        tile_height: number
    }
    export interface AnimationBase{
        jsanimation: Ui.Animation;
    }
    export interface AnimationSet extends AnimationBase{
        west: AnimationPart;
        east: AnimationPart;
        north: AnimationPart;
        south: AnimationPart;
    }
    export interface AnimationPart extends AnimationBase{
        width: number;
        filename: string;
        shift: number[];
        height: number;
        frame_count: number;
        line_length: number;
        animation_speed: number;
        x: number;
        y: number;
        scale: number;
    }
    export interface Recipe{
        enabled: boolean;
        icon: string;
        name: string;
        type: string;
        results: RecipeResult[];
        ingredients: RecipeIngredient[];
        category: string;
        energy_required: number;
    }
    export interface FactorioQuantity{
        amount: number;
        name: string,
        type: string
    }
    export interface RecipeResult extends FactorioQuantity{}
    export interface RecipeIngredient extends FactorioQuantity{}

    export function iconForRecipe(r: Recipe, data:Data): string{
        if(r.icon)
            return r.icon;
        else
            return data.item[r.results[0].name].icon;
    }
    export function entityTileWidth(producer: Producer){
        if(producer.tile_width)
            return producer.tile_width;
        else
            return Math.ceil(producer.collision_box[1][0] - producer.collision_box[0][0]);
    }
    export function entityTileHeight(producer: Producer){
        if(producer.tile_height)
            return producer.tile_height;
        else
            return Math.ceil(producer.collision_box[1][1] - producer.collision_box[0][1]);
    }
    export function canProducerProduceRecipe(producer: Producer, r: Recipe): boolean{
        var category = r.category;
        if(!category)
            category = "crafting";
        return producer.crafting_categories.indexOf(category) != -1;
    }
}


