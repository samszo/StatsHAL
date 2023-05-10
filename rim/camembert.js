function main() {
    var width = 800;
    var height = 600;
    var radius = Math.min(width, height) / 2;
    var colors = d3.scaleOrdinal(d3.schemeCategory10);
  
    var svg = d3.select("svg")
      .attr("width", width)
      .attr("height", height);
  
    var g = svg.append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  
    var arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
  
    var pie = d3.pie()
      .sort(null)
      .value(function(d) { return d.Membre; });
  
    d3.csv("data.csv").then(function(data) {
      var arcs = g.selectAll(".arc")
        .data(pie(data))
        .enter()
        .append("g")
        .attr("class", "arc");
  
      arcs.append("path")
        .attr("d", arc)
        .attr("fill", function(d, i) { return colors(i); });
  
      arcs.append("text")
        .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
        .attr("dy", "0.35em")
        .text(function(d) { return d.data.Institution; });
    });
  }
  
  main();
  
