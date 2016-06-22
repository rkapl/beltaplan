namespace App{
    export function loadData(version: string, cb: (data: GameData.Data) => void){
        var request = new XMLHttpRequest();
        request.addEventListener("load", function () {
            var data = <GameData.Data> JSON.parse(request.responseText)
            data.prefix = 'data/' + version + '/';
            data.version = version;
            
            request = new XMLHttpRequest();
            request.addEventListener("load", function() {
                data.settings = <GameData.Settings> JSON.parse(request.responseText);
                cb(data);
            });
            request.open('GET', 'data/' + version + '/settings.json');
            request.send();
        });
        request.open('GET', 'data/' + version + '/data.json');
        request.send();
    }
}