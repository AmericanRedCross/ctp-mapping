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

function sizeSlider(){
  var view = $(".dataTables_scrollBody").width(); // screen window width
  var full = $("#dataTable").width(); // full width
  // hide slider if there is no overflow
  if(view >= full){ $(slider).hide(); } else { $(slider).show(); }
  var viewMin = $(".dataTables_scrollBody").scrollLeft();
  var viewMax = viewMin + view;
  slider.noUiSlider.updateOptions({
    start: [viewMin, viewMax],
    range: {
      'min': 0,
      'max': full
    }
  });
}

var disasterList = {
  "Cholera":"icon-disaster_epidemic",
  "Civil unrest":"icon-crisis_conflict",
  "Complex emergency":"icon-crisis_conflict",
  "Conflict":"icon-crisis_conflict",
  "Cyclone":"icon-disaster_cyclone",
  "Drought":"icon-disaster_drought",
  "Earthquake(s)":"icon-disaster_earthquake",
  "Ebola":"icon-disaster_epidemic",
  "Extreme Winter":"icon-disaster_snowfall",
  "Fire(s)":"icon-disaster_fire",
  "Flood(s)":"icon-disaster_flood",
  "Food Insecurity":"icon-disaster_drought",
  "Hail Storm(s)":"icon-disaster_storm",
  "Hurricane":"icon-disaster_cyclone",
  "Industrial Explosion":"icon-disaster_technological",
  "Landslide(s)":"icon-disaster_landslide",
  "Population Movement":"icon-crisis_population_displacement",
  "Storm(s)":"icon-disaster_storm",
  "Tornado(es)":"icon-disaster_tornado",
  "Tsunami":"icon-disaster_tsunami",
  "Typhoon":"icon-disaster_cyclone",
  "Volcano":"icon-disaster_volcano"
}

function fetchCtp(cb){
  Tabletop.init( { key: 'https://docs.google.com/spreadsheets/d/1DL6wRqVwB-x-T8tkH4Qb409yB2u9UBOV3Hjsn-v3kKI/pubhtml',
       callback: function(data, tabletop) {
         columnlookup = data.shift();
         data.forEach(function(appeal){
            var startDate = new Date(appeal["#date+appeal+start"]);
            if(validDate(startDate)){
              appeal["#date+appeal+start"] = startDate.getFullYear().toString();
            } else {
              appeal["#date+appeal+start"] = "undefined";
            }
          });
          cb(null, data);
       },
       simpleSheet: true } )
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

function clearFilters(){
  d3.selectAll('.filter-active').each(function(d){
    d3.select(this).classed('filter-active', false);
  })
  filter()
}

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
    "#date+appeal+start": "Appeal start year",
    "#region": "Region",
    "#sector": "Response sector",
    "#modality+type": "Modality type",
    "#delivery+mechanism": "Delivery mechanism"
  }
  var theseFilters = []
  for(var prop in myFilters){
      var theseValues = [];
      myFilters[prop].forEach(function(item,index){
        theseValues.push('"' + item + '"');
      });
      var thisStr = filterReadable[prop] + " is " + theseValues.join(" or ") + ".";
      theseFilters.push(thisStr);
  }
  if(theseFilters.length > 0 && filteredData.length > 0){
    var displayHtml = "<b>Filters:</b> " + theseFilters.join(" ") +
      '<div class="clickable" onClick="clearFilters();"><i class="fa fa-fw fa-times-circle"></i> Clear all filters</div>';
    d3.select("#filter-info").html(displayHtml);
    d3.select("#filter-error").html("");
  } else if (theseFilters.length > 0 && filteredData.length === 0){
    var displayHtml = '<i class="fa fa-fw fa-exclamation-circle"></i> No appeals match your selected filter criteria.<br>' +
      "<b>Filters:</b> " + theseFilters.join(" ") +
      '<div class="clickable" onClick="clearFilters();"><i class="fa fa-fw fa-times-circle"></i> Clear all filters</div>';
    d3.select("#filter-error").html(displayHtml);
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

  // #region
  // =======
  var regionTotals = d3.nest().key(function(d){ return d["#region"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData);

  var regionClear = d3.select('#region-totals').selectAll("div").select("h2").html("0");

  var regionUpdate = d3.select('#region-totals').selectAll("div").data(regionTotals, function(d){ return d.key; });
  regionUpdate.select("h2")
    .html(function(d){ return d.value; })

  // startYear
  // =========
  var ctpStartYears = d3.nest().key(function(d){ return d["#date+appeal+start"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData)

  startYearX.domain([0, d3.max(ctpStartYears, function(d) { return d.value; })]);

  var yearClear = d3.select('#chart_start-year').selectAll("g")
  yearClear.select("rect")
    .transition().duration(1000).ease(d3.easeLinear)
    .attr("width", function(d) { return 0; })
  yearClear.select(".year-total")
    .text(function(d) { return ""; });

  var yearUpdate = d3.select('#chart_start-year').selectAll("g").data(ctpStartYears, function(d){ return d.key; });
  yearUpdate.select("rect")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("width", function(d) { return startYearX(d.value); })
  yearUpdate.select(".year-total")
    .transition().duration(600).ease(d3.easeLinear)
    .text(function(d) { return d.value; });

  // #sector
  // =======
  var ctpSectors = d3.nest().key(function(d){ return d["#sector"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData)

  sectorsX.domain([0, d3.max(ctpSectors, function(d) { return d.value; })]);

  var sectorClear = d3.select('#chart_sectors').selectAll("g")
  sectorClear.select("rect")
    .transition().duration(1000).ease(d3.easeLinear)
    .attr("width", function(d) { return 0; })
  sectorClear.select(".sectors-total")
    .text(function(d) { return ""; });

  var sectorUpdate = d3.select('#chart_sectors').selectAll("g").data(ctpSectors, function(d){ return d.key; });
  sectorUpdate.select("rect")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("width", function(d) { return sectorsX(d.value); })
  sectorUpdate.select(".sectors-total")
    .transition().duration(600).ease(d3.easeLinear)
    .text(function(d) { return d.value; });

  // #delivery+mechanism
  // ===================
  deliveryMech  = d3.nest().key(function(d){ return d["#delivery+mechanism"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData)

  deliveryMechX.domain([0, d3.max(deliveryMech, function(d) { return d.value; })]);

  var deliveryMechClear = d3.select('#chart_delivery-mech').selectAll("g")
  deliveryMechClear.select("rect")
    .transition().duration(1000).ease(d3.easeLinear)
    .attr("width", function(d) { return 0; })
  deliveryMechClear.select(".deliveryMech-total")
    .text(function(d) { return ""; });

  var deliveryMechUpdate = d3.select('#chart_delivery-mech').selectAll("g").data(deliveryMech, function(d){ return d.key; });
  deliveryMechUpdate.select("rect")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("width", function(d) { return deliveryMechX(d.value); })
  deliveryMechUpdate.select(".deliveryMech-total")
    .transition().duration(600).ease(d3.easeLinear)
    .text(function(d) { return d.value; });

  // #modality+type
  // ==============
  var modalities  = d3.nest().key(function(d){ return d["#modality+type"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(filteredData)

  modalitiesX.domain([0, d3.max(modalities, function(d) { return d.value; })]);

  var modalitiesClear = d3.select('#chart_modality').selectAll("g")
  modalitiesClear.select("rect")
    .transition().duration(1000).ease(d3.easeLinear)
    .attr("width", function(d) { return 0; })
  modalitiesClear.select(".modalities-total")
    .text(function(d) { return ""; });

  var modalitiesUpdate = d3.select('#chart_modality').selectAll("g").data(modalities, function(d){ return d.key; });
  modalitiesUpdate.select("rect")
    .transition().duration(600).ease(d3.easeLinear)
    .attr("width", function(d) { return modalitiesX(d.value); })
  modalitiesUpdate.select(".modalities-total")
    .transition().duration(600).ease(d3.easeLinear)
    .text(function(d) { return d.value; });



  // TABLE
  // =====

  var includedColumns = ["#region", "#crisis+code", "#country", "#iso3", "#crisis+type", "#sector", "#modality+type", "#budget+ctp", "#delivery+mechanism", "#reached", "#planned" ]

  $("#table-div").empty();
  if(filteredData.length === 0) {
    // $("#loading").hide();
    $("#nodata").show();
    return false;
  }
  // render headers
  $("#table-div").html('<table data-sortable id="dataTable" class="compact nowrap stripe cell-border" cellspacing="0"><thead><tr></tr></thead><tbody></tbody></table>');

  for (var i = 0; i < includedColumns.length; i++) {
    // if(field !== "rowid"){
      $("#dataTable thead tr").append('<th>' + includedColumns[i] + ' <br><input class="column-search" type="search" placeholder="search..." /></th>');
    // }
  }
  // render body of table
  var tbody = $("#dataTable tbody")[0];
  for (var i = 0; i < filteredData.length; i++) {
      var tr = document.createElement("tr");
      // for (field in filteredData[i]) {
      for (var j = 0; j < includedColumns.length; j++) {
          var td = document.createElement("td");
          var field = includedColumns[j];
          var cell = filteredData[i][field];
          $(td)
              .html(cell)
              .attr("title", filteredData[i][field]);
          tr.appendChild(td);
      }
      tbody.appendChild(tr);
  }
  // initialize dataTable
  table = $('#dataTable').DataTable({
    scrollX: true,
    "sDom":'lrtip',
    "lengthChange": false,
    "pageLength": 10,
    // "lengthMenu": [ 10, 50, 100 ],
    "language": {
      "lengthMenu": "Display _MENU_ records",
      "info": "Showing _START_ to _END_ of _TOTAL_ records",
    }
    // first column is the edit button, so disable sort
    // "columnDefs": [
    //   { "orderable": false, "targets": 0 }
    // ]
  });

  // stop a click in the search input box from triggering a sort on the column
  $('.column-search').on('click', function(e){
    e.stopPropagation();
  });

  // initialize column search functionality
  table.columns().every( function() {
    var that = this;
    $('input', this.header() ).on('keyup change', function(){
      if( that.search() !== this.value ){
        that
        .search( this.value )
        .draw();
      }
    });
  });

  // if too few columns the body columns center while the header rows stay left
  // if that's the case, shrink the table wrapper
  if($('#table-div thead').width() < $("#table-div").width()){
    $("#table-div").width($('#table-div thead').width())
  }

  // need a custom scroll bar that is always visible
  // so user can x-scroll the table even if they only have a mouse (i.e. no touchpad)
  $("<div id='myslider'></div>").insertAfter(".dataTables_scroll")
  slider = document.getElementById('myslider');
  noUiSlider.create(slider, {
  	start: [null, null],
  	connect: true,
    behaviour: "drag-fixed",
  	range: {
  		'min': 0,
  		'max': 1
  	}
  });


  sizeSlider();

  // update the slider position when the div is scrolled via direct interaction
  var divScroll = function(){
    var viewMin = $(".dataTables_scrollBody").scrollLeft();
    var view = $(".dataTables_scrollBody").width(); // visible width
    var viewMax = viewMin + view;
    slider.noUiSlider.set([viewMin, viewMax]);
  }
  $(".dataTables_scrollBody").on('scroll', divScroll);
  // update the table view when the slider is dragged
  slider.noUiSlider.on('slide', function(values, handle, unencoded){
    $(".dataTables_scrollBody").off('scroll', divScroll) // turn off the direct interaction scroll listener to keep things smooth
    $(".dataTables_scrollBody").scrollLeft(Math.round(unencoded[0])) // move the view based on the new slider position
    $(".dataTables_scrollBody").css("overflow-x", "hidden") // prevent the browser scrollbar from showing
  });
  slider.noUiSlider.on('end', function(){
    $(".dataTables_scrollBody").on('scroll', divScroll); // after done dragging the slider turn back on the direct interaction scroll listener
    $(".dataTables_scrollBody").css("overflow-x", "auto"); // turn back on the browser scroll styling
  })



}



function drawElements(){

  // #region
  // =======
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


  // startYear
  // =========
  var ctpStartYears = d3.nest().key(function(d){ return d["#date+appeal+start"]; })
    .rollup(function(leaves){ return leaves.length; })
    .entries(ctp)

  startYearMeas = {top: 10, right: 20, bottom: 30, left: 25, barHeight:20, width: $("#chart_start-year").innerWidth()}
  startYearSvg = d3.select("#chart_start-year").append('svg').attr('width', startYearMeas.width)
  startYearX = d3.scaleLinear().range([0, (startYearMeas.width - startYearMeas.left - startYearMeas.right)]);

  startYearSvg.attr("height", (startYearMeas.barHeight * ctpStartYears.length) + startYearMeas.top + startYearMeas.bottom );

  var yearEnter = startYearSvg.selectAll("g").data(ctpStartYears, function(d){ return d.key; });

  yearEnter.enter().append("g").each(function(d){
      d3.select(this).append('rect')
        .attr("height", startYearMeas.barHeight - 1)
      d3.select(this).append("text")
        .attr("class","year-label")
        .attr("x", 5)
        .attr("y", startYearMeas.barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.key;
        });
      d3.select(this).append("text")
        .attr("class","year-total")
        .attr("x", -5)
        .attr("y", startYearMeas.barHeight / 2)
        .attr("dy", ".35em")
    }).sort(function(a, b) { return b.key - a.key; })
    .classed("filter-startYear clickable", true)
    .attr("transform", function(d, i) { return "translate(" + startYearMeas.left + "," + ((i * startYearMeas.barHeight) + startYearMeas.top) + ")"; })
    .attr('data-filterkey', '#date+appeal+start')
    .attr('data-filtervalue', function(d){ return d.key; })
    .on('click', function(d){
      if(d3.select(this).classed('filter-active')){
        d3.select(this).classed('filter-active', false);
      } else {
        d3.select(this).classed('filter-active', true);
      }
      filter();
    })

  // #sector
  // =======
  var ctpSectors = d3.nest().key(function(d){ return d["#sector"]; })
      .rollup(function(leaves){ return leaves.length; })
      .entries(ctp)

  sectorsMeas = {top: 10, right: 20, bottom: 30, left: 25, barHeight:20, width: $("#chart_sectors").innerWidth()}
  sectorsSvg = d3.select("#chart_sectors").append('svg').attr('width', sectorsMeas.width)
  sectorsX = d3.scaleLinear().range([0, (sectorsMeas.width - sectorsMeas.left - sectorsMeas.right)]);

  sectorsSvg.attr("height", (sectorsMeas.barHeight * ctpSectors.length) + sectorsMeas.top + sectorsMeas.bottom );

  var sectorsEnter = sectorsSvg.selectAll("g").data(ctpSectors, function(d){ return d.key; });

  sectorsEnter.enter().append("g").each(function(d){
      d3.select(this).append('rect')
        .attr("height", sectorsMeas.barHeight - 1)
      d3.select(this).append("text")
        .attr("class","sectors-label")
        .attr("x", 3)
        .attr("y", sectorsMeas.barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) {
          return d.key;
        });
      d3.select(this).append("text")
        .attr("class","sectors-total")
        .attr("x", -5)
        .attr("y", sectorsMeas.barHeight / 2)
        .attr("dy", ".35em")
    }).sort(function(a, b) { return b.key - a.key; })
    .classed("filter-sectors clickable", true)
    .attr("transform", function(d, i) { return "translate(" + sectorsMeas.left + "," + ((i * sectorsMeas.barHeight) + sectorsMeas.top) + ")"; })
    .attr('data-filterkey', '#sector')
    .attr('data-filtervalue', function(d){ return d.key; })
    .on('click', function(d){
      if(d3.select(this).classed('filter-active')){
        d3.select(this).classed('filter-active', false);
      } else {
        d3.select(this).classed('filter-active', true);
      }
      filter();
    })

    // #delivery+mechanism
    // ===================
    var deliveryMech = d3.nest().key(function(d){ return d["#delivery+mechanism"]; })
        .rollup(function(leaves){ return leaves.length; })
        .entries(ctp)

    deliveryMechMeas = {top: 10, right: 20, bottom: 30, left: 25, barHeight:20, width: $("#chart_delivery-mech").innerWidth()}
    deliveryMechSvg = d3.select("#chart_delivery-mech").append('svg').attr('width', deliveryMechMeas.width)
    deliveryMechX = d3.scaleLinear().range([0, (deliveryMechMeas.width - deliveryMechMeas.left - deliveryMechMeas.right)]);

    deliveryMechSvg.attr("height", (deliveryMechMeas.barHeight * deliveryMech.length) + deliveryMechMeas.top + deliveryMechMeas.bottom );

    var deliveryMechEnter = deliveryMechSvg.selectAll("g").data(deliveryMech, function(d){ return d.key; });

    deliveryMechEnter.enter().append("g").each(function(d){
        d3.select(this).append('rect')
          .attr("height", deliveryMechMeas.barHeight - 1)
        d3.select(this).append("text")
          .attr("class","deliveryMech-label")
          .attr("x", 3)
          .attr("y", deliveryMechMeas.barHeight / 2)
          .attr("dy", ".35em")
          .text(function(d) {
            return d.key;
          });
        d3.select(this).append("text")
          .attr("class","deliveryMech-total")
          .attr("x", -5)
          .attr("y", deliveryMechMeas.barHeight / 2)
          .attr("dy", ".35em")
      }).sort(function(a, b) { return b.key - a.key; })
      .classed("filter-deliveryMech clickable", true)
      .attr("transform", function(d, i) { return "translate(" + deliveryMechMeas.left + "," + ((i * deliveryMechMeas.barHeight) + deliveryMechMeas.top) + ")"; })
      .attr('data-filterkey', '#delivery+mechanism')
      .attr('data-filtervalue', function(d){ return d.key; })
      .on('click', function(d){
        if(d3.select(this).classed('filter-active')){
          d3.select(this).classed('filter-active', false);
        } else {
          d3.select(this).classed('filter-active', true);
        }
        filter();
      })

      // #modality+type
      // ==============
      var modalities = d3.nest().key(function(d){ return d["#modality+type"]; })
          .rollup(function(leaves){ return leaves.length; })
          .entries(ctp)

      modalitiesMeas = {top: 10, right: 20, bottom: 30, left: 25, barHeight:20, width: $("#chart_modality").innerWidth()}
      modalitiesSvg = d3.select("#chart_modality").append('svg').attr('width', modalitiesMeas.width)
      modalitiesX = d3.scaleLinear().range([0, (modalitiesMeas.width - modalitiesMeas.left - modalitiesMeas.right)]);

      modalitiesSvg.attr("height", (modalitiesMeas.barHeight * modalities.length) + modalitiesMeas.top + modalitiesMeas.bottom );

      var modalitiesEnter = modalitiesSvg.selectAll("g").data(modalities, function(d){ return d.key; });

      modalitiesEnter.enter().append("g").each(function(d){
          d3.select(this).append('rect')
            .attr("height", modalitiesMeas.barHeight - 1)
          d3.select(this).append("text")
            .attr("class","modalities-label")
            .attr("x", 3)
            .attr("y", modalitiesMeas.barHeight / 2)
            .attr("dy", ".35em")
            .text(function(d) {
              return d.key;
            });
          d3.select(this).append("text")
            .attr("class","modalities-total")
            .attr("x", -5)
            .attr("y", modalitiesMeas.barHeight / 2)
            .attr("dy", ".35em")
        }).sort(function(a, b) { return b.key - a.key; })
        .classed("filter-modalities clickable", true)
        .attr("transform", function(d, i) { return "translate(" + modalitiesMeas.left + "," + ((i * modalitiesMeas.barHeight) + modalitiesMeas.top) + ")"; })
        .attr('data-filterkey', '#modality+type')
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