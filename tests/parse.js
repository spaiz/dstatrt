var expect = require("chai").expect,
    Baby = require('babyparse'),
    fs = require('fs'),
    DstatCsvParser = require('../client/js/dstat.js'),
    dsSubLabel = DstatCsvParser.dsSubLabel;

var parser = new DstatCsvParser({parser: Baby});

var csv = fs.readFileSync(__dirname +'/data/dstat.csv').toString();

describe("Build header mapping", function() {

    var labelsMapping;

    describe("Parsing CVS text and find header", function() {
        it("returns array with header labels at [0] and sub-labels in [1]", function() {
            var header = parser.parseCsvHeader(csv);
            expect(header).to.be.a('Array');
            expect(header.length >= 2).to.be.true;
            expect(header[0].length).to.be.equal(header[1].length);
        });
    });

    describe("Build array of labels with sub-labels mapped to position in csv row", function() {
        it("builds header labels to sub-labels mapping", function() {
            labelsMapping = parser.buildHeaderMap(csv);
            expect(labelsMapping).to.be.a('Array');
        });
    });
});

describe("Parse cvs data", function() {

    describe("Parse single data row and build data mapping", function() {
        it("parse single csv row", function() {
            var row = "0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,13.0,8.609,0.0,0.0,0.0,0.0,gnome-terminal / 0:24576,1.0,111.0,2.0,183.0,0.0,37343531008.0,55590047744.0,0.0,10485760.0,655360.0,838844416.0,37343531008.0,55590047744.0,0.0,5242880.0,237568.0,1678753792.0,0.0,0.0,Xorg / 1%, / 784983:17361,java / 571150336%,8.0,0.230,0.360,0.290,1356779520.0,91009024.0,982175744.0,5965021184.0,";
            var data = parser.parseDataRow(row);

            expect(data).to.be.a('Array');
            expect(data.length).to.be.equal(48);
        });

        it("takes sub-label data value by its index", function() {
            var labelsMapping = parser.buildHeaderMap(csv);

            var row = "0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,13.0,8.609,0.0,0.0,0.0,0.0,gnome-terminal / 0:24576,1.0,111.0,2.0,183.0,0.0,37343531008.0,55590047744.0,0.0,10485760.0,655360.0,838844416.0,37343531008.0,55590047744.0,0.0,5242880.0,237568.0,1678753792.0,0.0,0.0,Xorg / 1%, / 784983:17361,java / 571150336%,8.0,0.230,0.360,0.290,1356779520.0,91009024.0,982175744.0,5965021184.0,";
            var data = parser.parseDataRow(row);

            var singleRowDataMapping = [];

            for(var i=0; i < labelsMapping.length; i++) {
                var singleLabel = labelsMapping[i];
                var subLabels = singleLabel.subLabels;

                var singleLabelData = [];

                for(var subLabel in subLabels) {
                    var model = new dsSubLabel({name: subLabel, data: data[subLabels[subLabel]]});

                    singleLabelData.push(model);
                }
                singleRowDataMapping.push(singleLabelData);
            }

            expect(data).to.be.a('Array');
            expect(data.length).to.be.equal(48);
            expect(labelsMapping.length).to.be.equal(singleRowDataMapping.length);

        });
    });


    describe("Parse plain data value cell", function() {
        it("parses one value string with process name, slash and double dots", function() {
            var expected = {item: 'gnome-terminal', values: [0, 24576]};
            var row = "gnome-terminal / 0:24576";

            var checked = dsSubLabel.parseValues(row);

            expect(checked).to.be.deep.equal(expected);
        });

        it("parses one value string with empty name, slash and double dots", function() {
            var expected = {item: '', values: [784983, 17361]};
            var row = " / 784983:17361";

            var checked = dsSubLabel.parseValues(row);
            expect(checked).to.be.deep.equal(expected);
        });

        it("parses one value string with process name, slash and single value with unit indication %", function() {
            var expected = {item: 'java', values: [571150336], units: '%'};
            var row = "java / 571150336%";

            var checked = dsSubLabel.parseValues(row);
            expect(checked).to.be.deep.equal(expected);
        });

        it("parses one value given as single string", function() {
            var expected = {values: [37343531008.0]};
            var row = "37343531008.0";

            var checked = dsSubLabel.parseValues(row);
            expect(checked).to.be.deep.equal(expected);
        });
    });

    describe("Creating sub-label model from plain on cell data", function() {
        it("create model from one value string with process name, slash and double dots", function() {
            var model = new dsSubLabel({name: "test", data:"gnome-terminal / 0:24576"});

            var values = model.getValues();
            var units = model.getUnits();
            var item = model.getItem();

            expect(model.name).to.be.equal("test");
            expect(values).to.be.deep.equal([0, 24576]);
            expect(units).to.be.equal("");
            expect(item).to.be.equal("gnome-terminal");
        });

        it("parses one value string with empty name, slash and double dots", function() {
            var model = new dsSubLabel({name: "test", data: " / 784983:17361"});

            var values = model.getValues();
            var units = model.getUnits();
            var item = model.getItem();

            expect(model.name).to.be.equal("test");
            expect(values).to.be.deep.equal([784983, 17361]);
            expect(units).to.be.equal("");
            expect(item).to.be.equal("");
        });

        it("parses one value string with process name, slash and single value with unit indication %", function() {
            var model = new dsSubLabel({name: "test", data: "java / 571150336%"});

            var values = model.getValues();
            var units = model.getUnits();
            var item = model.getItem();

            expect(model.name).to.be.equal("test");
            expect(values).to.be.deep.equal([571150336]);
            expect(units).to.be.equal("%");
            expect(item).to.be.equal("java");
        });

        it("parses one value given as single string", function() {
            var model = new dsSubLabel({name: "test", data: "37343531008.0"});

            var values = model.getValues();
            var units = model.getUnits();
            var item = model.getItem();

            expect(model.name).to.be.equal("test");
            expect(values).to.be.deep.equal([37343531008.0]);
            expect(units).to.be.equal("");
            expect(item).to.be.equal("");
        });
    });
});