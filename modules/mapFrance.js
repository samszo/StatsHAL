import {appUrl} from './appUrl.js';
export class mapFrance {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'streamwords';
        this.cont = params.cont ? params.cont : d3.select("#chart");
        this.urlData = params.urlData ? params.urlData : false;
        this.urlLabel = params.urlLabel ? params.urlLabel : "rien";
        this.data = params.data ? params.data : false;
        const width = params.width ? params.width : 600;
        const height = params.height ? params.height : 600;
        let legendAxis,svg,
            legendCellSize = 20,
            colors = ['#EAC7C7', '#E3B5B5', '#DDA2A2', '#D68F8F', '#CF7D7D', '#C86A6A', '#C15757', '#BE4E4E', '#BA4545', '#A83E3E', '#953737', '#823030', '#702929', '#5D2222', '#4A1C1C', '#381515'],
            pUrl = new appUrl({'url':new URL(me.urlData)}),
            q = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : '',
            fq = pUrl.params && pUrl.params.has('fq') ? "&fq="+pUrl.params.get('fq') : '',//'publicationDate_s:[2000 TO 2023]',
            sourceHAL = "https://api.archives-ouvertes.fr/search/?q="+q+fq
                +"&wt=json&indent=true&facet=true&facet.field=country_s&rows=0";
        
        this.init = function () {
            mapImprove();
        }

        function mapImprove() {
          
            // Create a path object to manipulate geo data
            const path = d3.geoPath();
          
            // Define projection property
            const projection = d3.geoConicConformal() // Lambert-93
              .center([2.454071, 46.279229]) // Center on France
              .scale(2600)
              .translate([width / 2 - 50, height / 2]);
          
            path.projection(projection); // Assign projection to path object
          
            // Create the DIV that will contain our map
            me.cont.select('svg').remove();
            const svg = me.cont.append("svg")
              .attr("id", "svgMapFrance")
              .attr("width", width)
              .attr("height", height);
          
            // Append the group that will contain our paths
            const regions = svg.append("g");
          
            svg.append("text")
                  .attr("x", (width / 2))
                  .attr("y", 25)
                  .attr("text-anchor", "middle")
                  .style("fill", "#D3B8B8")
                  .style("font-weight", "300")
                  .style("font-size", "16px")
                  .text("Répartition des collaborations par région de : "+me.urlLabel);
          
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
        this.init();    
    }
}