namespace Util{
    export class Set{
        
    }
    export class Vector{
        constructor(public x: number, public y:number){
        }
        copy(): Vector{
            return new Vector(this.x, this.y);
        }
        isZero():boolean{
            return this.x == 0 && this.y == 0;
        }
        add(point: Vector){
            this.x += point.x;
            this.y += point.y;
        }
        sub(point: Vector){
            this.x -= point.x;
            this.y -= point.y;
        }
        floor(){
            this.x = Math.floor(this.x);
            this.y = Math.floor(this.y);
        }
        scale(scale: number){
            this.x *= scale;
            this.y *= scale;
        }
        static fromOrientation(o: Orientation){
            switch(o){
                case Orientation.NORTH:
                    return new Vector(0, -1);
                case Orientation.EAST:
                    return new Vector(1, 0);
                case Orientation.SOUTH:
                    return new Vector(0, 1);
                case Orientation.WEST:
                    return new Vector(-1, 0); 
            }
        }
    }
    export enum Orientation{NORTH, EAST, SOUTH, WEST}
    export function oppositeOrientation(o: Orientation): Orientation{
        return addOrientation(o, Orientation.SOUTH);
    }
    export function addOrientation(a: Orientation, b: Orientation){
        return mod((a+b), 4);
    }
    export function subOrientation(a: Orientation, b: Orientation){
        return mod((a-b), 4);
    }
    
    export function mod(x: number, y:number): number{
        //http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
        return (x % y + y) % y;
    }
}