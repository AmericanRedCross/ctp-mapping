function validDate(d){
  if(Object.prototype.toString.call(d) === "[object Date]"){
    // it is a date
    if(isNaN(d.getTime())){
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

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
    // clean and format data as needed
    output.forEach(function(appeal){
      var startDate = new Date(appeal["#date+appeal+start"]);
      if(validDate(startDate)){
        appeal.startYear = startDate.getFullYear().toString();
      } else {
        appeal.startYear = "undefined";
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
d3.selection.prototype.moveToBack = function() {
    return this.each(function() {
        var firstChild = this.parentNode.firstChild;
        if (firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
    });
};

d3.queue()
  .defer(fetchCtp)
  .defer(d3.json, 'data/ne_50m-simple-topo.json')
  .await(buildPage)

  // <div id="ctp-by-sector" style="width:100%;font-size: 0;">
  //   <div style="border:0;display:inline-block;height:10px;width:50%;background-color:red;"></div>
  //   <div style="border:0;display:inline-block;height:10px;width:30%;background-color:blue;"></div>
  //   <div style="border:0;display:inline-block;height:10px;width:12%;background-color:orange;"></div>
  //   <div style="border:0;display:inline-block;height:10px;width:8%;background-color:black;"></div>
  // </div>

//
// function drawElements(filteredCtp){
//   // ctp by sector
//   // var ctpSectors = d3.set(filteredCtp.map(function(d) { return d["#sector"]; })).values();
//   var ctpSectors = d3.nest().key(function(d){ return d["#sector"]; })
//     .rollup(function(leaves){ return leaves.length; })
//     .entries(filteredCtp).sort(function(a, b){ return d3.descending(a.value, b.value); });
//   var ctpSectorsTotal = d3.sum(ctpSectors, function(d){ return d.value })
//
//   // ctpSectorsColor = d3.scaleOrdinal()
//   //   .domain(d3.map(filteredCtp, function(d){ return d["#sector"]; }).keys())
//   //   .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"])
//
//   d3.select("#ctp-by-sector").selectAll('div')
//     .data(ctpSectors, function(d){ console.log(d); return d.key; }).enter()
//     .append('div')
//     .attr('class', 'bar-graph-div')
//     .attr('height', '15px')
//     .style('width', function(d) {
//       var x = (d.value / ctpSectorsTotal) * 100;
//       return x + "%";
//     })
//     .style('background-color', function(d){ console.log(d.key); console.log(ctpSectorsColor(d.key)); return ctpSectorsColor(d.key) })
//
//
// }

function filter(){
  var myFilters = {};
  d3.selectAll('.filter-active').each(function(d){
    var thisKey = d3.select(this).attr('data-filterkey');
    var thisValue = d3.select(this).attr('data-filtervalue');
    if(myFilters[thisKey] === undefined){
      myFilters[thisKey] = [thisValue];
    } else{
      myFilters[thisKey].push(thisValue);
    }
  })
  updateElements(myFilters)
}


function updateElements(myFilters){
  // console.log(myFilters)
  // console.log(ctp.length)
  var filteredData = ctp.filter(function(d){
    var passCount = 0;
    var filterCount = 0;
    for(filterKey in myFilters){
      filterCount ++;
      var pass = false;
      myFilters[filterKey].forEach(function(filterValue){
        if(d[filterKey] === filterValue){
          pass = true;
        }
      })
      if(pass === true){ passCount ++; }
    }
    return passCount === filterCount;
  })
  // console.log(filteredData.length)


// DISPLAY THE FILTER CRITERIA
  var filterReadable = {
    "#iso3": "Country code",
    "startYear": "Start year",
    "#region": "Region"
  }
  var theseFilters = []
  for(var prop in myFilters){
      var theseValues = [];
      myFilters[prop].forEach(function(item,index){
        theseValues.push(item);
      });
      var thisStr = filterReadable[prop] + " is " + theseValues.join(" or ") + ".";
      theseFilters.push(thisStr);
  }
  if(theseFilters.length > 0 && filteredData.length > 0){
    d3.select("#filter-info").html("<b>Filters:</b> " + theseFilters.join(" "));
    d3.select("#filter-error").html("");
  } else if (theseFilters.length > 0 && filteredData.length === 0){
    d3.select("#filter-error").html("No appeals match your selected filter criteria.<br>" + "<b>Filters:</b> " + theseFilters.join(" "));
    d3.select("#filter-info").html("");
  } else {
    d3.select("#filter-error").html("");
    d3.select("#filter-info").html("");
  }

  var countryTotals = d3.nest()
    .key(function(d) { return d["#iso3"]; })
    .entries(filteredData);

  mappedCountry.each(function(d){
    var countryGeo = d3.select(this);
    countryGeo.style("fill", null)
    countryGeo.attr("data-count", null);
    countryTotals.forEach(function(country){
      if(d.properties.iso === country.key){
        if(country.values.length){
          if(country.values.length > 0){
            countryGeo.style("fill", function(d){  return regionColor(country.values[0]["#region"]) })
            countryGeo.attr("data-count", country.values.length);
          }
        }
      }
    })
  })

  var regionTotals = d3.nest().key(function(d){ return d["#region"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData);

  var regionClear = d3.select('#region-totals').selectAll("div").select("h2").html("0");

  var regionUpdate = d3.select('#region-totals').selectAll("div").data(regionTotals, function(d){ return d.key; });
  regionUpdate.select("h2")
    .html(function(d){ return d.value; })

  var ctpStartYears = d3.nest().key(function(d){ return d["startYear"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData)

  startYearX.domain([0, d3.max(ctpStartYears, function(d) { return d.value; })]);

  var yearClear = d3.select('#chart_start-year').selectAll("g")
  yearClear.select("rect")
    .transition().duration(1000).ease(d3.easeLinear)
    .attr("width", function(d) { return 0; })
  yearClear.select(".year-total")
    .attr("x", function(d) { return 0; })
    .text(function(d) { return ""; });

  var yearUpdate = d3.select('#chart_start-year').selectAll("g").data(ctpStartYears, function(d){ return d.key; });
  yearUpdate.select("rect")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("width", function(d) { return startYearX(d.value); })
  yearUpdate.select(".year-total")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("x", function(d) { return startYearX(d.value) + 3; })
    .text(function(d) { return d.value; });

}

function drawElements(){

  var regionTotals = d3.nest().key(function(d){ return d["#region"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(ctp);

  var regionEnter = d3.select("#region-totals").selectAll("div").data(regionTotals, function(d){ return d.key; })
    .enter().append("div")
    .style("text-align", "center")
    .style("border-bottom", "1px solid #f5f5f5")
    .classed("filter-region clickable", true)
    .attr('data-filterkey', '#region')
    .attr('data-filtervalue', function(d){ return d.key; })
      .on('click', function(d){
        if(d3.select(this).classed('filter-active')){
          d3.select(this).classed('filter-active', false);
        } else {
          d3.select(this).classed('filter-active', true);
        }
        filter();
      })
  regionEnter.append('h2')
        .html(function(d){ return d.value; })
        .style("color", function(d){ return regionColor(d.key); })
  regionEnter.append('p')
        .html(function(d){ return d.key; })

  regionEnter.sort(function(a, b){ return d3.descending(a.value, b.value); });


  var ctpStartYears = d3.nest().key(function(d){ return d["startYear"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(ctp)
  //  ctpStartYearsTotal = d3.sum(ctpStartYears, function(d){ return d.value; });

  startYearMeas = {top: 10, right: 20, bottom: 30, left: 60, barHeight:20, width: $("#chart_start-year").innerWidth()}
  startYearSvg = d3.select("#chart_start-year").append('svg').attr('width', startYearMeas.width)
  startYearX = d3.scaleLinear().range([0, (startYearMeas.width - startYearMeas.left - startYearMeas.right)]);


  startYearSvg.attr("height", (startYearMeas.barHeight * ctpStartYears.length) + startYearMeas.top + startYearMeas.bottom );

  var yearEnter = startYearSvg.selectAll("g").data(ctpStartYears, function(d){ return d.key; });

  yearEnter.enter().append("g").each(function(d){
      d3.select(this).append('rect')
        .attr("height", startYearMeas.barHeight - 1)
      d3.select(this).append("text")
        .attr("class","year-label")
        .attr("x", -5)
        .attr("y", startYearMeas.barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.key;
        });
      d3.select(this).append("text")
        .attr("class","year-total")
        .attr("y", startYearMeas.barHeight / 2)
        .attr("dy", ".35em")
    }).sort(function(a, b) { return b.key - a.key; })
    .classed("filter-startYear clickable", true)
    .attr("transform", function(d, i) { return "translate(" + startYearMeas.left + "," + ((i * startYearMeas.barHeight) + startYearMeas.top) + ")"; })
    .attr('data-filterkey', 'startYear')
    .attr('data-filtervalue', function(d){ return d.key; })
    .on('click', function(d){
      if(d3.select(this).classed('filter-active')){
        d3.select(this).classed('filter-active', false);
      } else {
        d3.select(this).classed('filter-active', true);
      }
      filter();
    })

    filter();
}


function buildPage(error, appeals, geo){
  ctp = appeals;

  d3.select("#count-total").html(appeals.length);

    world = topojson.feature(geo, geo.objects.ne_50m)
    mappedCountry = geoGroup.selectAll("path")
      .data(world.features, function(d){ return d.properties.iso; })
      .enter().append("path")
      .classed('hasAppeal', function(d){
        var hasAppeal = false;
        ctp.forEach(function(a,b){
          if(a["#iso3"] === d.properties.iso){ hasAppeal = true }
        });
        return hasAppeal;
      })
      .classed("country", true)
      .attr('data-filterkey', '#iso3')
      .attr('data-filtervalue', function(d){ return d.properties.iso; })
      .on('click', function(d){
        if(d3.select(this).classed('filter-active')){
          d3.select(this).classed('filter-active', false);
        } else {
          d3.select(this).classed('filter-active', true).moveToFront();
        }
        filter();
      })
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
        if(!d3.select(this).classed('filter-active')){ d3.select(this).moveToBack(); }
        d3.select(this).classed('highlight', false);
        d3.select("#tooltip").html("");
      })

    updatePath = function(){ mappedCountry.attr("d", path); }
    map.on('zoom move viewreset', updatePath);
    updatePath();

    regionColor = d3.scaleOrdinal()
      .domain(d3.map(ctp, function(d){ return d["#region"]; }).keys())
      .range(["#1b9e77","#d95f02","#7570b3","#e7298a","#66a61e"])

    drawElements();

}


$('body').mouseover(function(e){
    //Set the X and Y axis of the tooltip
    $('#tooltip').css('top', e.pageY + 10 );
    $('#tooltip').css('left', e.pageX + 20 );
  }).mousemove(function(e){
    //Keep changing the X and Y axis for the tooltip, thus, the tooltip move along with the mouse
    $("#tooltip").css({top:(e.pageY+15)+"px",left:(e.pageX+20)+"px"});
});