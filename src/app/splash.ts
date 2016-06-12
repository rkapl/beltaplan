namespace App{
    export function showSplash(text: string){
        document.getElementById("splash").classList.remove("hidden");
        document.getElementById("splash").innerText = text;
    }
    export function hideSplash(){
        document.getElementById("splash").classList.add("hidden");
    }
}