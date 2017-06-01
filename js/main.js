
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

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

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
    .on('mouseover', function(d){
      d3.select(this).classed('highlight', true).moveToFront();
      var count = d3.select(this).attr("data-count");
      d3.select("#tooltip").html(function(){
        var tooltipHtml = d.properties.name;
        tooltipHtml += (count !== null) ? " - " + count : "";
        return tooltipHtml;
      })
    })
    .on('mouseout', function(d){
      d3.select(this).classed('highlight', false);
      d3.select("#tooltip").html("")
    })

  updatePath = function(){ feature.attr("d", path); }
  map.on('zoom move viewreset', updatePath);
  updatePath();

  var regionColor = d3.scaleOrdinal()
    .domain(d3.map(ctp, function(d){ return d["#region"]; }).keys())
    .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"])

  var regionTotals = d3.nest().key(function(d){ return d["#region"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(ctp).sort(function(a, b){ return d3.descending(a.value, b.value); });

  var totalBox = d3.select("#region-totals").selectAll("div").data(regionTotals).enter()
    .append('div')
    .style("text-align", "center")
    .style("border-bottom", "1px solid #f5f5f5")
  totalBox.append('h2')
      .html(function(d){ return d.value; })
      .style("color", function(d){ return regionColor(d.key); })
  totalBox.append('h4')
      .html(function(d){ return d.key; })

  var countryTotals = d3.nest()
    .key(function(d) { return d["#iso3"]; })
    .entries(ctp);

  d3.select("#count-total").text(countryTotals.filter(function(d){ return d.key !== "ERROR"; }).length);

  feature.each(function(d){
    var countryGeo = d3.select(this);
    countryTotals.forEach(function(country){
      if(d.properties.iso === country.key){
        if(country.values.length){
          if(country.values.length > 0){
            countryGeo.style("fill", function(d){  return regionColor(country.values[0]["#region"]) })
            countryGeo.attr("data-count", country.values.length)
          }
        }
      }
    })
  })

}

$('body').mouseover(function(e){
    //Set the X and Y axis of the tooltip
    $('#tooltip').css('top', e.pageY + 10 );
    $('#tooltip').css('left', e.pageX + 20 );
  }).mousemove(function(e){
    //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
    $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});
});