namespace App{
    export function loadData(version: string, cb: (data: GameData.Data) => void){
        var request = new XMLHttpRequest();
        request.addEventListener("load", function () {
            var data = <GameData.Data> JSON.parse(request.responseText)
            data.prefix = 'data/' + version + '/';
            data.version = version;
            cb(data);
        });
        request.open('GET', 'data/' + version + '/data.json');
        request.send();
    }
}