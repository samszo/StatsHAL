import {appUrl} from './appUrl.js';
export class mapWorld {
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
                +"&wt=json&indent=true"
                +"&facet=true&facet.field=country_s"
                + "&rows=" + (pUrl.params.has('rows') ? +pUrl.params.get('rows') : "10000")
                +"&fl=labStructAcronym_s,labStructName_s,labStructId_i,labStructCode_s,labStructCountry_s,labStructType_s,labStructCode_s";
  

        this.init = function () {
            mapImprove();
        }
        function mapImprove() {
            me.cont.select('svg').remove();
            svg =me.cont.append("svg")
                .attr("id", "svgWorldMap")
                .attr("width", width)
                .attr("height", height);
        
            const projection = d3.geoNaturalEarth1()
                .scale(1)
                .translate([0, 0]);
        
            const path = d3.geoPath()
                .pointRadius(2)
                .projection(projection);
        
            svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 25)
                .attr("text-anchor", "middle")
                .style("fill", "black")
                .style("font-weight", "300")
                .style("font-size", "16px")
                .text("Répartition des collaborations par pays de : "+me.urlLabel);
        
            svg.append("text")
                .attr("x", (width / 2))
                .attr("y", 50)
                .attr("text-anchor", "middle")
                .style("fill", "black")
                .style("font-weight", "200")
                .style("font-size", "12px")
                .style("cursor", "pointer")
                .text("(source : HAL API)")
                .on("click",e=>window.open(sourceHAL, "_blanck"));
        
            const cGroup = svg.append("g");
        
            var promises = [];
            promises.push(d3.json("assets/data/world-countries-no-antartica.json"));
            promises.push(d3.csv("assets/data/data.csv"));
            promises.push(d3.json(sourceHAL));
        
            Promise.all(promises).then(function(values) {
                const geojson = values[0];
                let scores = values[1], halData = values[2], 
                pays = [];
                for (let i = 0; i < halData.facet_counts.facet_fields.country_s.length; i++) {
                    let nb = halData.facet_counts.facet_fields.country_s[i+1],
                    c = halData.facet_counts.facet_fields.country_s[i];
                    if(nb && c){
                        if(!pays[c])pays[c]=0;
                        pays[c]+=nb;    
                    }
                    i++;            
                };
                halData.response.docs.forEach(p=>{
                    if(p['labStructCountry_s']){
                        p['labStructCountry_s'].forEach(c=>{
                            if(!pays[c])pays[c]=0;
                            pays[c]++;
                        })    
                    }
                });
                scores.forEach(s=>s.score=0);
                for (const c in pays) {
                    let p = scores.filter(s=>s.code==c.toUpperCase());
                    //ne pas prendre en compte les données de la France 
                    //afin de liser les statistiques 
                    if(p.length){
                        if(c!='fr')p[0].score=pays[c];
                    }
                }
                //supprime les pays à 0
                scores.forEach((s,i)=>{if(s.score==0)delete scores[i];});
                //réindex le tableau
                scores = scores.filter(s=>s);
                var b  = path.bounds(geojson),
                    s = .80 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
                    t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];
        
                projection
                    .scale(s)
                    .translate(t);
                
                cGroup.selectAll("path")
                    .data(geojson.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .attr("id", d => "code" + d.id)
                    .attr("class", "country");
                
                const min = d3.min(scores, d =>  +d.score),
                    max = d3.max(scores, d =>  +d.score);
                var quantile = d3.scaleQuantile().domain([min, max])
                    .range(colors);
                        
                var legend = addLegend(min, max);
                var tooltip = addTooltip();
                    
                scores.forEach(function(e,i) {
                    var countryPath = d3.select("#code" + e.code);
                    countryPath
                        .attr("scorecolor", quantile(+e.score))
                        .style("fill", quantile(+e.score))
                        .on("mouseover", function(d) {
                            countryPath.style("fill", "#F1F501");
                            tooltip.style("display", null);
                            tooltip.select('#tooltip-country')
                                .text(shortCountryName(e.frenchCountry));
                            tooltip.select('#tooltip-score')
                                .text(e.score);
                            legend.select("#cursor")
                                .attr('transform', 'translate(' + (legendCellSize + 5) + ', ' + (getColorIndex(quantile(+e.score)) * legendCellSize) + ')')
                                .style("display", null);
                        })
                        .on("mouseout", function(event, d) {
                            countryPath.style("fill", quantile(+e.score));
                            tooltip.style("display", "none");
                            legend.select("#cursor").style("display", "none");
                        })
                        .on("mousemove", function(event, d) {
                            var mouse = d3.pointer(event);
                            tooltip.attr("transform", "translate(" + mouse[0] + "," + (mouse[1] - 75) + ")");
                        });
                });
            });
        }
        function addLegend(min, max) {
            var legend = svg.append('g')
                .attr('transform', 'translate(40, 50)');
                
            legend.selectAll()
                .data(d3.range(colors.length))
                .enter().append('svg:rect')
                    .attr('height', legendCellSize + 'px')
                    .attr('width', legendCellSize + 'px')
                    .attr('x', 5)
                    .attr('y', d => d * legendCellSize)
                    .attr('class', 'legend-cell')
                    .style("fill", d => colors[d])
                    .on("mouseover", function(event, d) {
                        legend.select("#cursor")
                            .attr('transform', 'translate(' + (legendCellSize + 5) + ', ' + (d * legendCellSize) + ')')
                            .style("display", null);
                        d3.selectAll("path[scorecolor='" + colors[d] + "']")
                            .style('fill', "#F1F501");
                    })
                    .on("mouseout", function(event, d) {
                        legend.select("#cursor")
                            .style("display", "none");
                        d3.selectAll("path[scorecolor='" + colors[d] + "']")
                            .style('fill', colors[d]);
                    });
                
            legend.append('svg:rect')
                .attr('y', legendCellSize + colors.length * legendCellSize)
                .attr('height', legendCellSize + 'px')
                .attr('width', legendCellSize + 'px')
                .attr('x', 5)
                .style("fill", "#929292");
                
            legend.append("text")
                .attr("x", 30)
                .attr("y", 35 + colors.length * legendCellSize)
                .style("font-size", "13px")
                .style("color", "#929292")
                .style("fill", "#929292")
                .text("données manquantes");
            
            legend.append("polyline")
                .attr("points", legendCellSize + ",0 " + legendCellSize + "," + legendCellSize + " " + (legendCellSize * 0.2) + "," + (legendCellSize / 2))
                .attr("id", "cursor")
                .style("display", "none")
                .style('fill', "#F1F501");
                    
            var legendScale = d3.scaleLinear().domain([min, max])
                .range([0, colors.length * legendCellSize]);
            
            legendAxis = legend.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(legendScale));
            
            return legend;
        }
    
        function addTooltip() {
            var tooltip = svg.append("g") // Group for the whole tooltip
                .attr("id", "tooltip")
                .style("display", "none");
            
            tooltip.append("polyline") // The rectangle containing the text, it is 210px width and 60 height
                .attr("points","0,0 210,0 210,60 0,60 0,0")
                .style("fill", "#2B1D1D")
                .style("stroke","black")
                .style("opacity","0.9")
                .style("stroke-width","1")
                .style("padding", "1em");
            
            tooltip.append("line") // A line inserted between country name and score
                .attr("x1", 40)
                .attr("y1", 25)
                .attr("x2", 160)
                .attr("y2", 25)
                .style("stroke","#929292")
                .style("stroke-width","0.5")
                .attr("transform", "translate(0, 5)");
            
            var text = tooltip.append("text") // Text that will contain all tspan (used for multilines)
                .style("font-size", "13px")
                .style("fill", "#D3B8B8")
                .attr("transform", "translate(0, 20)");
            
            text.append("tspan") // Country name udpated by its id
                .attr("x", 105) // ie, tooltip width / 2
                .attr("y", 0)
                .attr("id", "tooltip-country")
                .attr("text-anchor", "middle")
                .style("font-weight", "600")
                .style("font-size", "16px");
            
            text.append("tspan") // Fixed text
                .attr("x", 105) // ie, tooltip width / 2
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .style("fill", "929292")
                .text("Score : ");
            
            text.append("tspan") // Score udpated by its id
                .attr("id", "tooltip-score")
                .style("fill","#D3B8B8")
                .style("font-weight", "bold");
            
            return tooltip;
        }
    
        function shortCountryName(country) {
            return country.replace("Démocratique", "Dem.").replace("République", "Rep.");
        }
    
        function getColorIndex(color) {
            for (var i = 0; i < colors.length; i++) {
                if (colors[i] === color) {
                    return i;
                }
            }
            return -1;
        } 
        this.init();    
    }
}