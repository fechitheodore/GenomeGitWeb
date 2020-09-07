var links = [];
var linkFileCols = [];
var indexStartAdditional;
var header;
var singleGroup;


onmessage = function(e) {

  if (e.data.step == "start") {

    var reader = new FileReader();
    reader.onload = function() {

      let lines = reader.result.split('\n');
      let lineSplit, parsedHeader = false;
      let jsonLine;
      let lineIndex = 0;
      for (let line of lines) {
        if (line != "") {

          lineSplit = line.split(",");

          if (!parsedHeader) {
            header = lineSplit;
            parsedHeader = true;
          } else {

            if (singleGroup == undefined) {
              if (!isNaN(parseInt(lineSplit[0]))) {
                singleGroup = true;
              } else {
                singleGroup = false;
              }

              if (singleGroup) {
                if (header[0] !== 'g1chr' || header[1] !== 'g1start' || header[2] !== 'g1end' || header[3] !== 'g2chr' || header[4] !== 'g2start' || header[5] !== 'g2end' ||
                  header[6] !== 'color' || header[7] !== 'fusion') {
                  postMessage({
                    error: 'The header doesn\'t contain the right column names'
                  });
                }
              } else {
                if (header[0] !== 'g1' || header[1] !== 'g1chr' || header[2] !== 'g1start' || header[3] !== 'g1end' || header[4] !== 'g2' ||
                 header[5] !== 'g2chr' || header[6] !== 'g2start' || header[7] !== 'g2end' || header[8] !== 'color' || header[9] !== 'fusion') {
                  postMessage({
                    error: 'The header doesn\'t contain the right column names'
                  });
                }
              }
            }

            if (lineSplit.length < header.length) {
              postMessage({error: 'Error at line '+lineIndex+': Missing column(s)'});
              return;
            } else if (lineSplit.length > header.length) {
              postMessage({error: 'Error at line '+lineIndex+': More columns than in the header'});
              return;
            }

            if (singleGroup) {
              if(!+lineSplit[1] || !+lineSplit[2] || !+lineSplit[4] || !+lineSplit[5]) {
                postMessage({error: 'Error at line '+lineIndex+': start and end positions must be numbers'});
                return;
              }

              jsonLine = {
                g1chr: lineSplit[0],
                g1start: parseInt(lineSplit[1]),
                g1end: parseInt(lineSplit[2]),
                g2chr: lineSplit[3],
                g2start: parseInt(lineSplit[4]),
                g2end: parseInt(lineSplit[5]),
                color: lineSplit[6],
                fusion: lineSplit[7],
                show: true
              }

            } else {
              if(!+lineSplit[2] || !+lineSplit[3] || !+lineSplit[6] || !+lineSplit[7]) {
                postMessage({error: 'Error at line '+lineIndex+': start and end positions must be numbers'});
                return;
              }

              jsonLine = {
                g1chr: lineSplit[0] + '_' + lineSplit[1],
                g1start: parseInt(lineSplit[2]),
                g1end: parseInt(lineSplit[3]),
                g2chr: lineSplit[4] + '_' + lineSplit[5],
                g2start: parseInt(lineSplit[6]),
                g2end: parseInt(lineSplit[7]),
                color: lineSplit[8],
                fusion: lineSplit[9],
                show: true
              }
            }

            let fusionIndex = header.indexOf("fusion");
            for (let i = fusionIndex + 1; i < header.length; i++) {
              if (!isNaN(parseFloat(lineSplit[i]))) {
                jsonLine[header[i]] = parseFloat(lineSplit[i]);
              } else {
                jsonLine[header[i]] = lineSplit[i];
              }
            }
            links.push(jsonLine);
          }
        }
        lineIndex++;
      }

      linkFileCols.push({
        field: 'g1chr',
        header: 'Chr1',
        type: 'level',
        levels: getLevels(links, "g1chr")
      });

      var minMax = getMinMax(links, "g1start");
      linkFileCols.push({
        field: 'g1start',
        header: 'Chr1 start',
        type: 'numeric',
        min: minMax.min,
        max: minMax.max,
        filterValue: minMax.min
      });

      minMax = getMinMax(links, "g1end");
      linkFileCols.push({
        field: 'g1end',
        header: 'Chr1 end',
        type: 'numeric',
        min: minMax.min,
        max: minMax.max,
        filterValue: minMax.min
      });

      linkFileCols.push({
        field: 'g2chr',
        header: 'Chr2',
        type: 'level',
        levels: getLevels(links, "g2chr")
      });

      minMax = getMinMax(links, "g2start");
      linkFileCols.push({
        field: 'g2start',
        header: 'Chr2 start',
        type: 'numeric',
        min: minMax.min,
        max: minMax.max,
        filterValue: minMax.min
      });

      minMax = getMinMax(links, "g2end");
      linkFileCols.push({
        field: 'g2end',
        header: 'Chr2 end',
        type: 'numeric',
        min: minMax.min,
        max: minMax.max,
        filterValue: minMax.min
      });



      indexStartAdditional = singleGroup ? 8 : 10;

      if (header.length > indexStartAdditional) {
        postMessage({
          code: 1, //waiting for the user to choose the type of the additional columns
          columns: header.slice(indexStartAdditional)
        });
      } else {

        const additionalColumns = header.splice(indexStartAdditional).map(column => {
          return {
            label: column,
            value: column
          };
        });
        additionalColumns.splice(0, 0, {
          label: 'Color',
          value: 'color'
        });

        let results = {
          links: links,
          columns: linkFileCols,
          additionalColumns: additionalColumns,
          mode: singleGroup ? 'single' : 'comparison'
        }
        if (!singleGroup) {
          results.g1 = links[0].g1chr.split('_')[0];
          results.g2 = links[0].g2chr.split('_')[0];
        }


        postMessage({
          code: 200,
          result: results
        });
      }

    }
    reader.readAsText(e.data.file);

  } else {

    const additionalColumns = e.data;

    for (let i = 0; i < additionalColumns.length; i++) {
      linkFileCols.push(parseColumn(links, additionalColumns[i].name, additionalColumns[i].selectedType));
    }

    const additionalColumnsForDropdown = header.splice(indexStartAdditional).map(column => {
      return {
        label: column,
        value: column
      };
    });
    additionalColumnsForDropdown.splice(0, 0, {
      label: 'Color',
      value: 'color'
    });


    let results = {
      links: links,
      columns: linkFileCols,
      additionalColumns: additionalColumns,
      mode: singleGroup ? 'single' : 'comparison'
    }
    if (!singleGroup) {
      results.g1 = links[0].g1chr.split('_')[0];
      results.g2 = links[0].g2chr.split('_')[0];
    }

    postMessage({
      code: 200,
      result: results
    });
  }



}

function getMinMax(links, key) {
  let max = -Infinity,
    min = Infinity,
    val;
  for (let link of links) {
    val = parseFloat(link[key]);
    if (val > max) {
      max = val;
    }
    if (val < min) {
      min = val;
    }
  }
  return {
    min: min,
    max: max
  };
}

function getLevels(links, key) {
  const levels = [];
  for (let link of links) {
    if (!levels.find(l => {
        return l.value === link[key];
      })) {
      levels.push({
        value: link[key],
        label: link[key]
      });
    }
  }
  return levels;
}

function parseColumn(links, key, type) {

  const col = {
    field: key,
    header: key,
    type: type
  }

  switch (type) {
    case 'level':
      col.levels = getLevels(links, key);
      break
    case 'numeric':
      var minMax = getMinMax(links, key);
      col.min = minMax.min;
      col.max = minMax.max;
      col.filterValue = minMax.min;
      break;
  }
  return col;
}

function findColumnType(links, key) {
  let isNumeric = true,
    nbLevels = 0,
    value, floatValue,
    valuesFound = [];


  for (let link of links) {
    value = link[key];
    floatValue = parseFloat(value);
    if (isNaN(floatValue)) {
      isNumeric = false;
    } else {
      value = floatValue;
    }
    if (!valuesFound.includes(value)) {
      nbLevels++;
      valuesFound.push(value);
    }
  }

  if (nbLevels < links.length * 0.5) {
    return "level";
  } else if (isNumeric) {
    return "numeric";
  } else {
    return "list";
  }
}
