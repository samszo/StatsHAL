function main() {
    var svg = d3.select("svg"),
        margin = 200, 
        width = svg.attr("width") - margin,
        height = svg.attr("height") - margin;

    svg.append("text")
            .attr("transform", "translate(100,0)")
            .attr("x", 70)
            .attr("y", 50)
            .attr("font-size", "24px")
            .text("Diagramme à barre")

    var xScale = d3.scaleBand().range([0, width]).padding(0.5),
        yScale = d3.scaleLinear().range([height, 0]);

    var g = svg.append("g").attr("transform", "translate(100, 100)");   
    d3.csv("data.csv").then(function(data){
        //nettoyage - formatage des données
        data.forEach(d=>{
            d.Membre=parseInt(d.Membre);
        })

        xScale.domain(data.map(function(d){ return d.Grade; }));
        yScale.domain([0, d3.max(data, function(d){ return d.Membre; })]);

        g.append("g").attr('transform', 'translate(0,'+height+')')
            .call(d3.axisBottom(xScale))
            .selectAll("text")  
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");
        
        g.append("g").call(d3.axisLeft(yScale).tickFormat(function(d){
            return d;
        }).ticks(6));

        g.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("x", function(d){ return xScale(d.Grade); })
            .attr("y", function(d){ return yScale(d.Membre); })
            .attr("width", xScale.bandwidth())
            .attr("height", function(d){ return height - yScale(d.Membre); });
    });
}

main();

