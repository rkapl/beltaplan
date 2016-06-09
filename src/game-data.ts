namespace GameData{
    // raw data imported from the json
    export interface Data{
        producers: { [id: string]: Producer};
        item: { [id: string]: Item};
        recipe: { [id: string]: Recipe};
    }
    export interface Item{
        icon: string
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
    }
    export interface FactorioQuantity{
        amount: number;
        name: string,
        type: string
    }
    export interface RecipeResult extends FactorioQuantity{
        
    }
    export interface RecipeIngredient extends FactorioQuantity{
        
    }

    export function iconForRecipe(r: Recipe, data:Data): string{
        if(r.icon)
            return r.icon;
        else
            return data.item[r.results[0].name].icon;
    }
}


