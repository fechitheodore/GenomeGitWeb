Genoverse.Track.Gene = Genoverse.Track.extend({
  id: 'genes',
  name: 'Genes',
  height: 200,
  legend: false,
  fileID: undefined,

  populateMenu: function(feature) {

    var menu = {
        title: '<span>' + feature.id + '</span>',
      Location: feature.chr + ':' + feature.start + '-' + feature.end,
      Biotype: feature.biotype,
      Version: feature.version
  };

  if (feature.feature_type === 'transcript') {
    menu.Gene = feature.external_name;
  }

  return menu;
},

// Different settings for different zoom level
2000000: { // This one applies when > 2M base-pairs per screen
  labels: false
},
100000: { // more than 100K but less then 2M
  labels: true,
  model: Genoverse.Track.Model.Gene.Ensembl,
  view: Genoverse.Track.View.Gene.Ensembl
},
1: { // > 1 base-pair, but less then 100K
  labels: true,
  model: Genoverse.Track.Model.Transcript.Ensembl,
  view: Genoverse.Track.View.Transcript.Ensembl
}
});
