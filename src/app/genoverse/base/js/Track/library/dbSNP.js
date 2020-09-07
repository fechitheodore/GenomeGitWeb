Genoverse.Track.dbSNP = Genoverse.Track.extend({
  id: 'dbSNP',
  name: 'dbSNP',
  info: 'All sequence variants from the database of Single Nucleotide Polymorphisms (dbSNP)',
  //url              : '//rest.ensembl.org/overlap/region/human/__CHR__:__START__-__END__?feature=variation;content-type=application/json',
  url: '/getSNPs?chr=__CHR__&start=__START__&end=__END__',
  dataRequestLimit: 5000000, // As per e! REST API restrictions
  threshold: 1e6, //TODO : go back to 1e5 if it's laggings
  labels: false,
  legend: false,
  autoHeight: true,
  colorMap: {
    transcript_ablation: '#ff0000',
    splice_acceptor_variant: '#FF581A',
    splice_donor_variant: '#FF581A',
    stop_gained: '#ff0000',
    frameshift_variant: '#9400D3',
    stop_lost: '#ff0000',
    start_lost: '#ffd700',
    transcript_amplification: '#ff69b4',
    inframe_insertion: '#ff69b4',
    inframe_deletion: '#ff69b4',
    missense_variant: '#ffd700',
    protein_altering_variant: '#FF0080',
    splice_region_variant: '#ff7f50',
    incomplete_terminal_codon_variant: '#ff00ff',
    stop_retained_variant: '#76ee00',
    synonymous_variant: '#76ee00',
    coding_sequence_variant: '#458b00',
    mature_miRNA_variant: '#458b00',
    '5_prime_UTR_variant': '#7ac5cd',
    '3_prime_UTR_variant': '#7ac5cd',
    non_coding_transcript_exon_variant: '#32cd32',
    intron_variant: '#02599c',
    NMD_transcript_variant: '#ff4500',
    non_coding_transcript_variant: '#32cd32',
    upstream_gene_variant: '#a2b5cd',
    downstream_gene_variant: '#a2b5cd',
    TFBS_ablation: '#a52a2a',
    TFBS_amplification: '#a52a2a',
    TF_binding_site_variant: '#a52a2a',
    regulatory_region_ablation: '#a52a2a',
    regulatory_region_amplification: '#a52a2a',
    feature_elongation: '#7f7f7f',
    regulatory_region_variant: '#a52a2a',
    feature_truncation: '#7f7f7f',
    intergenic_variant: '#636363'
  },

  insertFeature: function(feature) {


    //feature.color = this.prop('colorMap')[feature.consequence_type];
    var h = (120 * feature.homo)/360;
    var s = 1;
    var l = 0.5;
    var r, g, b;

    var hue2rgb = function(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);


    var toHex = function(x) {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    var color =  "#" + toHex(r) + toHex(g) + toHex(b);

    feature.color = color


    feature.legend = feature.consequence_type;

    /*if (feature.start > feature.end) {
      feature.decorations = true;
    }*/
    feature.decorations = true;
    this.base(feature);
  },

  decorateFeature: function(feature, context, scale) {


    context.fillStyle = feature.color;
    context.beginPath();
    context.moveTo(feature.position[scale].X - 3, feature.position[scale].Y + this.featureHeight);
    context.lineTo(feature.position[scale].X, feature.position[scale].Y + this.featureHeight - 4);
    context.lineTo(feature.position[scale].X + 3, feature.position[scale].Y + this.featureHeight);
    context.fill();

    if (scale > 1) {
      context.fillRect(feature.position[scale].X - 0.5, feature.position[scale].Y, 1.5, feature.position[scale].height);
    }

    context.fillRect(feature.position[scale].X - 0.5, feature.position[scale].Y, 1.5, feature.position[scale].height);
  },

  populateMenu: function(feature) {


    //var deferred = $.Deferred();
    var menu = [{
      title: feature.id,
      Location: feature.chr + ':' + feature.start + '-' + feature.end,
      Alleles: feature.alleles.join(', '),
      AF: feature.homo,
      QUAL: feature.quality
    }];

    /*$.ajax({
      url      : '//rest.ensembl.org/variation/human/' + feature.id + '?population_genotypes=1;content-type=application/json',
      dataType : 'json',
      success  : function (data) {
        var populationGenotypes = $.grep(data.population_genotypes, function (pop) { return /1000GENOMES.+ALL/.test(pop.population); }); // Only considering 1000 Genomes: ALL population
        var frequencies         = {};
        var pop, i, j;

        if (populationGenotypes.length) {
          for (i = 0; i < populationGenotypes.length; i++) {
            pop           = populationGenotypes[i];
            pop.frequency = parseFloat(pop.frequency, 10);
            pop.count     = parseInt(pop.count, 10);

            frequencies[pop.population] = frequencies[pop.population] || [];
            frequencies[pop.population].push(pop);
          }

          for (i in frequencies) {
            frequencies[i].sort(function (a, b) { return a.count < b.count; });

            pop = {
              title    : i + ' population genotypes',
              Genotype : [ 'Frequency', 'Count' ],
              start    : false,
              end      : false
            };

            for (j in frequencies[i]) {
              pop[frequencies[i][j].genotype] = [ (frequencies[i][j].frequency * 100).toFixed(2) + '%', frequencies[i][j].count ];
            }

            menu.push(pop);
          }

          pop = {
            start : false,
            end   : false
          };

          pop['<a href="http://www.ensembl.org/Homo_sapiens/Variation/Population?v=' + feature.id + '" target="_blank">See all population genotypes</a>'] = '';

          menu.push(pop);
        }

        deferred.resolve(menu);
      }
    });*/

    return menu;
  },

  // Different settings for different zoom level
  5000: { // more than 5k
    bump: false
  },
  1: { // > 1 base-pair, but less then 5k
    bump: true
  }

});
