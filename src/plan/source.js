var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Source = (function (_super) {
    __extends(Source, _super);
    function Source(plan) {
        _super.call(this, plan);
        this.needs = new Set();
        this.provides = new Set();
    }
    Source.prototype.setItem = function (item) {
        _super.setItem.call(this, item);
        this.provides = new Set();
        this.provides.add(item);
    };
    Source.prototype.isBusParticipant = function () {
        return true;
    };
    Source.prototype.overlay = function (ctx) {
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "center";
        ctx.fillText(this.rate + " ips", FACTORIO_TILE_SIZE * 1.5, FACTORIO_TILE_SIZE * 2.5);
    };
    Source.prototype.setMissing = function (missing) {
        // can not happen
    };
    return Source;
})(ItemTile);
exports.Source = Source;
//# sourceMappingURL=source.js.map