"use strict";
exports.__esModule = true;
var CommitInfo = /** @class */ (function () {
    function CommitInfo() {
    }
    return CommitInfo;
}());
exports.CommitInfo = CommitInfo;
var FileInfo = /** @class */ (function () {
    function FileInfo() {
    }
    return FileInfo;
}());
exports.FileInfo = FileInfo;
var LinksDataPoint = /** @class */ (function () {
    function LinksDataPoint() {
        //FastaLink.data in database. Thus links data and links file have to be separate collections
        this.group1Name = "";
        this.group2Name = "";
        this.g1value = "";
        this.g2value = "";
        this.isSNP = false;
        this.isInDel = false;
        this.isDelta = false;
    }
    Object.defineProperty(LinksDataPoint.prototype, "g1chr", {
        get: function () {
            return (this.group1Name === "" ? this._g1chr : this.group1Name.concat("_").concat(this._g1chr));
        },
        set: function (value) {
            this._g1chr = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LinksDataPoint.prototype, "g2chr", {
        get: function () {
            return (this.group2Name === "" ? this._g2chr : this.group2Name.concat("_").concat(this._g2chr));
        },
        set: function (value) {
            this._g2chr = value;
        },
        enumerable: true,
        configurable: true
    });
    return LinksDataPoint;
}());
exports.LinksDataPoint = LinksDataPoint;
var FastaLink = /** @class */ (function () {
    function FastaLink() {
    }
    return FastaLink;
}());
exports.FastaLink = FastaLink;
