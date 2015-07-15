(function () {

    var DstatCsvParser = (function () {

        var DstatCsvParser = function (options) {
            this.parser = options.parser;
        };

        DstatCsvParser.prototype.headerMapCache = null;

        var parseCsvHeader = function (data) {
            return this.parser.parse(data).data;
        };

        DstatCsvParser.prototype.parseCsvHeader = parseCsvHeader;

        /**
         * Get first returned data from the server, parses it and
         * maps header labels with sub-labels to data indexes
         * @param data
         * @returns [{}]
         */
        var buildHeaderMap = function (data) {
            var dataList = this.parseCsvHeader(data);

            var header = dataList[0];
            var subHeader = dataList[1];

            var headerMap = [];
            header.forEach(function (label, index) {
                if (label != "") {
                    var labelNode = {
                        name: label,
                        subLabels: {}
                    };

                    for (var i = index; i < subHeader.length; i++) {
                        var subLabel = subHeader[i];
                        if (index == i || header[i] == '') {
                            labelNode.subLabels[subLabel] = i;
                        } else {
                            break;
                        }
                    }

                    headerMap.push(labelNode);
                }
            });

            this.headerMapCache = headerMap;

            return headerMap;
        };

        DstatCsvParser.prototype.buildHeaderMap = buildHeaderMap;


        /**
         * Get first returned data from the server, parses it and
         * maps header labels with sub-labels to data indexes
         * @param data
         * @returns {{}}
         */
        var parseHeader = function (data) {

            var dataList = this.parser.parse(data).data;

            var header = dataList[0];
            var subHeader = dataList[1];

            var headerMap = {};
            header.forEach(function (item, index) {
                if (item != "") {
                    headerMap[item] = {};
                    for (var i = index; i < subHeader.length; i++) {
                        var subLabel = subHeader[i];
                        if (index == i || header[i] == '') {
                            headerMap[item][subLabel] = i;
                        } else {
                            break;
                        }
                    }
                }
            });

            this.headerMapCache = headerMap;

            return headerMap;
        };


        /**
         * Parse and maps one single data array returned from cvs parsing
         * @param headerMap
         * @param data
         * @returns {{}}
         */
        var getMappedData = function (headerMap, data) {
            var dataRow = {};

            for (var key in headerMap) {
                if (headerMap.hasOwnProperty(key)) {
                    var headerLabel = headerMap[key];
                    dataRow[key] = {};

                    for (var subLabel in headerLabel) {
                        if (headerLabel.hasOwnProperty(subLabel)) {
                            var dataIndex = headerLabel[subLabel];
                            dataRow[key][subLabel] = data[dataIndex];
                        }
                    }
                }
            }

            return dataRow;
        };

        DstatCsvParser.prototype.getMappedData = getMappedData;

        var parseDataRow = function (row) {
            if (!row)
                throw "Empty data row!";

            return this.parser.parse(row).data[0];
        };

        DstatCsvParser.prototype.parseDataRow = parseDataRow;

        return DstatCsvParser;
    })();

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports = DstatCsvParser;
    else
        window.DstatCsvParser = DstatCsvParser;
})();


(function () {

    var DsSubLabelModule = (function () {

        function DsSubLabel(options) {
            this.name = options.name;
            this.parsed = DsSubLabel.parseValues(options.data);
        }

        DsSubLabel.prototype.getValues = function() {
            return this.parsed.values;
        };

        DsSubLabel.prototype.getItem = function() {
            return this.parsed.item || "";
        };

        DsSubLabel.prototype.getUnits = function() {
            return this.parsed.units || "";
        };

        /**
         * Value may come from dstat in different formats, as :
         * ['gnome-terminal / 0:24576'], [' / 784983:17361'],
         * ['java / 571150336%'], [ '37343531008.0'],
         * ['']
         * @param str
         * @returns {{}}
         */
        DsSubLabel.parseValues = function (str) {
            var model = {};

            if (str.indexOf('/') != -1) {
                var tmp = str.split('/');
                model.item = tmp[0].trim();
                str = tmp[1];
            }

            if (str.indexOf(':') != -1) {
                model.values = str.split(':');
            } else {
                var lastChar = str.charAt(str.length - 1);
                if (lastChar == '%') {
                    model.units = lastChar;
                    str = str.slice(0, -1);
                }
                model.values = [str];
            }

            /**
             * Clean values from an garbage symbols
             */
            for (var i = 0; i < model.values.length; i++) {
                model.values[i] = parseFloat(model.values[i].replace('%', '').trim());
            }

            return model;
        };

        return DsSubLabel;
    })();

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
        module.exports.dsSubLabel = DsSubLabelModule;
    else
        window.dsSubLabel = DsSubLabelModule;
})();