import {appUrl} from '../../modules/appUrl.js';

document.addEventListener("DOMContentLoaded", mapCollaborations);
s = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : "",
q = s ? "?q="+s : '/LP/?q=*%3A*';

function mapCollaborations() {
  const width = 700, height = 550;

  // Create a path object to manipulate geo data
  const path = d3.geoPath();

  // Define projection property
  const projection = d3.geoConicConformal() // Lambert-93
    .center([2.454071, 46.279229]) // Center on France
    .scale(2600)
    .translate([width / 2 - 50, height / 2]);

  path.projection(projection); // Assign projection to path object

  // Create the DIV that will contain our map
  const svg = d3.select('#chart').append("svg")
    .attr("id", "svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "Blues");

  // Append the group that will contain our paths
  const regions = svg.append("g");

  svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("fill", "#D3B8B8")
        .style("font-weight", "300")
        .style("font-size", "16px")
        .text("Répartition des collaborations par région");

  var promises = [];
  promises.push(d3.json("assets/data/regions.geojson")); // Replace with the path to your regions data file
  promises.push(d3.csv("assets/data/map-data.csv")); // Replace with the path to your collaborations data file

  Promise.all(promises).then(function (values) {
    const geojson = values[0];
    const csv = values[1];

    var features = regions
      .selectAll("path")
      .data(geojson.features)
      .enter()
      .append("path")
      .attr('id', d => "d" + d.properties.code)
      .attr("d", path);

    // Quantile scales map an input domain to a discrete range, 0...max(collaborations) to 1...9
    var quantile = d3.scaleQuantile()
      .domain([0, d3.max(csv, e => +e.COLLABORATION)])
      .range(d3.range(9));

    var legend = svg.append('g')
      .attr('transform', 'translate(525, 150)')
      .attr('id', 'legend');

    legend.selectAll('.colorbar')
      .data(d3.range(9))
      .enter().append('svg:rect')
      .attr('y', d => d * 20 + 'px')
      .attr('height', '20px')
      .attr('width', '20px')
      .attr('x', '0px')
      .attr("class", d => "q" + d + "-9");

    var legendScale = d3.scaleLinear()
      .domain([0, d3.max(csv, e => +e.COLLABORATION)])
      .range([0, 9 * 20]);

    var legendAxis = svg.append("g")
      .attr('transform', 'translate(550, 150)')
      .call(d3.axisRight(legendScale).ticks(6));

    let collaborationsByRegionObj = d3.rollup(csv, v => d3.sum(v, d => +d.COLLABORATION), d => d.CODE_REG);
    let regionsValues = Array.from(d3.group(csv, d => d.CODE_REG))
     //faire la somme des collaboration
    regionsValues.forEach(function (e, i) {
      var totalCollaborations = collaborationsByRegionObj.get(e[0]);
      d3.select("#d" + e[0])      
        .attr("class", "region q" + quantile(totalCollaborations) + "-9")
        .on("mouseover", function (event, d) {
          div.transition()
            .duration(200)
            .style("opacity", .9);
          div.html("<b>Région : </b>" + e[1][0].NOM_REGION + "<br>"
            + "<b>Collaborations : </b>" + totalCollaborations + "<br>")
            .style("left", (event.pageX + 30) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function (event, d) {
          div.style("opacity", 0);
          div.html("")
            .style("left", "-500px")
            .style("top", "-500px");
        });
    });
  });

  // Refresh colors on combo selection
  d3.select("select").on("change", function () {
    d3.selectAll("svg").attr("class", this.value);
  });

  // Append a DIV for the tooltip
  var div = d3.select("body").append("div")
    .attr("class", "chart-tooltip")
    .style("opacity", 0);
}