
function hxlProxyToJSON(input,headers){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            e.forEach(function(e2,i2){
                var parts = e2.split('+');
                var key = parts[0]
                if(parts.length>1){
                    var atts = parts.splice(1,parts.length);
                    atts.sort();
                    atts.forEach(function(att){
                        key +='+'+att
                    });
                }
                keys.push(key);
            });
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function fetchCtp(callback){
  var cashUrl = "https://proxy.hxlstandard.org/data.json?strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1DL6wRqVwB-x-T8tkH4Qb409yB2u9UBOV3Hjsn-v3kKI/edit%3Fusp%3Ddrive_web"
  $.get(cashUrl, function(response){
    callback(null, hxlProxyToJSON(response));
  });
}

var map = L.map('overview-map').setView([0, 0], 2);
// initialize the SVG layer for D3 drawn features
L.svg().addTo(map);
// pick up the SVG from the map object
var svg = d3.select('#overview-map').select('svg');
var geoGroup = svg.append('g').attr('id', 'geo');

function projectPoint(x, y){
  var point = map.latLngToLayerPoint(new L.LatLng(y, x));
  this.stream.point(point.x, point.y);
}

var transform = d3.geoTransform({point: projectPoint});
var path = d3.geoPath().projection(transform)


// d3.selection.prototype.moveToFront = function() {
//   return this.each(function(){
//     this.parentNode.appendChild(this);
//   });
// };

d3.queue()
  .defer(fetchCtp)
  .defer(d3.json, 'data/ne_50m-simple-topo.json')
  .await(buildPage)

function buildPage(error, ctp, geo){
  world = topojson.feature(geo, geo.objects.ne_50m)
  feature = geoGroup.selectAll("path")
    .data(world.features, function(d){ return d.properties.iso; })
    .enter().append("path")
    .classed("country", true)

  updatePath = function(){
    feature.attr("d", path);
  }
  map.on('zoom move viewreset', updatePath);
  updatePath();

}