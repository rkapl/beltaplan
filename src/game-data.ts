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
        // contents of settings.json
        settings: Settings;
    }
    export interface Settings{
        belt: {[key: string]: BeltSetting};
    }
    export interface BeltSetting{
        speed: number;
    }
    
    export interface IconHolder{
        icon: string;
        icons: IconLayer[];
        name: string;
    }

    export interface IconLayer{
        icon: string;
        tint: any;
    }

    export interface Item extends IconHolder{
        name: string;
        type: string;
    }
    
    export interface Module extends Item{
        limitation: string[];
        effect: ModuleEffect;
        tier: number;
    }
    
    export interface ModuleEffect{
        productivity: SingleModuleEffect;
        pollution: SingleModuleEffect;
        consumption: SingleModuleEffect;
        speed: SingleModuleEffect;
    }
    
    export interface SingleModuleEffect{
        bonus: number;
    }
    
    export interface Producer extends IconHolder{
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
        allowed_effects: string[];
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
    export interface Recipe extends IconHolder{
        enabled: boolean;
        name: string;
        type: string;
        category: string;
        normal: RecipeVariant;
    }
    export interface RecipeVariant{
        results: RecipeResult[];
        ingredients: RecipeIngredient[];
        energy_required: number;
    }
    export interface FactorioQuantity{
        amount: number;
        name: string,
        type: string
    }
    export interface RGBA{
        r: number;
        g: number;
        b: number;
        a: number;
    }

    export interface RecipeResult extends FactorioQuantity{}
    export interface RecipeIngredient extends FactorioQuantity{}

    export function recipeVariant(r: Recipe): RecipeVariant{
        if(r.normal)
            return r.normal;
        return <RecipeVariant><any> r;
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
      
    export function canProducerUseModule(producer: Producer, recipe: Recipe, mod: Module, in_beacon: boolean): boolean{
        var allowed_effects: string[];
        if(in_beacon){
            allowed_effects = ['pollution', 'consumption', 'speed']
        }else if(producer.allowed_effects){
            allowed_effects = producer.allowed_effects;
        }else{
            allowed_effects = ['pollution', 'consumption', 'speed', 'productivity'];
        }
        
        if(mod.effect.consumption && allowed_effects.indexOf('consumption') ==  -1)
            return false;
            
        if(mod.effect.pollution && allowed_effects.indexOf('pollution') ==  -1)
            return false;
            
        if(mod.effect.speed && allowed_effects.indexOf('speed') ==  -1)
            return false;
            
        if(mod.effect.productivity && allowed_effects.indexOf('productivity') ==  -1)
            return false;
            
        if(mod.limitation && mod.limitation.indexOf(recipe.name) == -1)
            return false
        
        return true;    
    }
    
    export function canProducerProduceRecipe(producer: Producer, r: Recipe): boolean{
        var category = r.category;
        if(!category)
            category = "crafting";
        return producer.crafting_categories.indexOf(category) != -1;
    }
}


