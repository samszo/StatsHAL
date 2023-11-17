import anime from '../modules/anime.es.js';
export class posiColor {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'posiColor';
        this.data = params.data ? params.data : false;
        this.pLib = params.pLib ? params.pLib : 'lib';
        this.pVal = params.pVal ? params.pVal : 'value';
        this.pFreq = params.pFreq ? params.pFreq : 'nb';
        this.cont = params.cont ? params.cont : d3.select('body');
        this.svg = params.svg ? params.svg : false;
        this.color = params.color ? params.color : d3.interpolateViridis;
        this.interpolates = params.interpolates ? params.interpolates : false;
        this.frequency = params.frequency ? params.frequency : false;
        this.colors = {};
        this.legendes={};
        // Specify the chart’s position.
        const svgX=params.x ? params.x : 0; 
        const svgY=params.y ? params.y : 0; 
        // Specify the chart’s dimensions.
        const width = params.width ? params.width : 600;
        const height = params.height ? params.height : 600;
        const widthLibTxt = 100;

        let svg, scLin, scLog, scBandY, scColor, dataFreq;

        this.init = function () {
            console.log(me.data);            
            setData();
            setGraph();
        }

        function setData(){
            //définition des échelles
            let domY = me.data.map(d=>d[me.pLib]);		  
            scBandY = d3.scaleBand(domY, [0, height])
                .paddingInner(0.2) // edit the inner padding value in [0,1]
                //.paddingOuter(0.5) // edit the outer padding value in [0,1]
                .align(0.5) // edit the align: 0 is aligned left, 0.5 centered, 1 aligned right.
                ;
            if(me.frequency){
                dataFreq = Array.from(d3.group(me.data, d => d[me.pLib])).map(d=>{
                    let extX = d3.extent(d[1], d=>d[me.pVal]),
                        extY = d3.extent(d[1], d=>d[me.pFreq]),
                        o = {'vals':d[1],
                        'extX':[1,extX[1]],
                        'scX':d3.scaleLinear().domain(extX).range([widthLibTxt, width-widthLibTxt]),
                        //'scX':d3.scaleThreshold([0, 100, 2000, 5000, 10000, 50000, 100000, 1000000, 3000000]),
                        'scY':d3.scaleLinear().domain(extY).range([0, scBandY.bandwidth()])
                        };
                        o[me.pLib]=d[0];
                    return o;
                });
            }
        }

        function setGraph(){
                                                          
            // Create the SVG container.
            svg = me.svg ? me.svg : me.cont.append("svg")
                .attr("viewBox", [0, 0, width, height])
                .attr("x", svgX)
                .attr("y", svgY)
                .attr("width", width)
                .attr("height", height)
                .attr("style", "max-width: 100%; height: auto;")
                .style("font", "10px sans-serif");                

            //création des légendes de couleurs
            let g = svg.selectAll('.gData')
                .data(me.frequency ? dataFreq : me.data)
                .enter()
                .append('g')
                .attr('class', 'gData')
                .attr('id', (d,i)=>"gData_"+i)
                .attr('transform', d=>'translate(0, '+scBandY(d[me.pLib])+')')
                .each((d,i)=>{
                    let c = me.interpolates ? me.interpolates[d[me.pLib]] : me.color; 
                    //me.colors[d[me.pLib]] = d3.scaleSequential([0, d.maxCpx], c); 
                    if(me.frequency){
                        //me.colors[d[me.pLib]] = d3.scaleSequentialLog(d.scX.domain(), c);     
                        //createBrushVal(d3.select("#gData_"+i), d);
                        //me.colors[d[me.pLib]] = d3.scaleThreshold(d.scX.domain(), d3.schemeRdBu[9]);
                        //me.colors[d[me.pLib]] = d3.scaleOrdinal(["<10", "10-100", "101-1K", ">1K <10K", ">10K <100K", ">100K <1M", "≥1M"], d3.schemeSpectral[7]);        
                        //me.colors[d[me.pLib]] = d3.scaleSqrt([0, 1000, 10000, 3000000], ["blue", "white", "green", "red"]);
                        me.colors[d[me.pLib]] = d3.scaleSequentialLog(d.extX, c);
                        me.legendes[d[me.pLib]] = Legend(d3.select("#gData_"+i), me.colors[d[me.pLib]], {
                            title: d[me.pLib],
                            width:width-10,
                            tickFormat: "~s",
                            height:scBandY.bandwidth()
                          })
                    }else{
                        me.colors[d[me.pLib]] = d3.scaleSequentialLog([0, d[me.pVal]], c);             
                        me.legendes[d[me.pLib]] = Legend(d3.select("#gData_"+i), me.colors[d[me.pLib]], {
                            title: d[me.pLib],
                            width:width-10,
                            height:scBandY.bandwidth()
                          })
                    }
                });
        }
        
        this.addPosiInLegend = function(lib,val){
            //return;
            let t, leg = me.legendes[lib];
            //supprime les anciens traits
            leg.g.selectAll('.posiInLegend').remove();
            //ajoute le trait vertical            
            t = leg.g.append("path")
                .attr('class','posiInLegend')
                .attr("d", d3.line()([[leg.x(val), 10], [leg.x(val), scBandY.bandwidth()-30]]))
                .attr("stroke", "white");
            anime({
                targets: t.node(),
                translateY: 30,
                loop: true
                });
            //modifie le titre
            leg.g.select('.title').text(lib+' : '+val);                
        }


        function createBrushVal(gBand, dt){
            let w = width, h = scBandY.bandwidth()
            , area = (x, y) => d3.area()
                .x(d => dt.scX(d[me.pVal]))
                .y0(dt.scY(0.9))
                .y1(d => dt.scY(d[me.pFreq]))
            , xAxis = (g, x, height, title) => g
                .attr("transform", `translate(0,${h})`)
                .call(d3.axisBottom(dt.scX))
                .call(g => g.selectAll(".title").data(['title']).join("text")
                    .attr("class", "title")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .text(title))            
            , yAxis = (g, y, title) => g
                .attr("transform", `translate(${0},0)`)
                .call(d3.axisLeft(dt.scY).ticks(d3.min([4,dt.scY.domain()[1]])))
                .call(g => g.selectAll(".title").data([title]).join("text")
                    .attr("class", "title")
                    .attr("x", 0)
                    .attr("y", 10)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "middle")
                    .text(title));
    
            const svg = gBand.append("svg")
                .attr("viewBox", [0, 0, w, h])
                .style("display", "block");
            const brush = d3.brushX()
                .extent([[0, 0.5], [w, h + 0.5]])
                .on("brush", brushed)
                .on("end", brushended);
            /*la sélection par défaut correspond à une étendu de 100
            let deb = valueExtent[1] > 100 ? valueExtent[1]/2-50 : valueExtent[0], 
                fin = valueExtent[1] > 100 ? valueExtent[1]/2+50 : valueExtent[1];        
            */
            //la sélection par défaut correspond à un élément aléatoire
            let deb = 100, fin = 101,          
                defValSelect = {'v':[deb, fin],'x':[dt.scX(deb), dt.scX(fin)]};
    
            svg.append('defs').append("linearGradient")
                .attr("id", "gradValue")
                //.attr("gradientUnits", "userSpaceOnUse")
                //.attr("x1", 0).attr("y1", 0)
                //.attr("x2", 0).attr("y2", 1)
            .selectAll("stop")
                .data(dt.vals.map((d,i)=>{
                    return {'offset':(i*100/dt.vals.length)+"%", 'color': me.colors[d[me.pLib]](d[me.pVal])}
                }))
            .enter().append("stop")
                .attr("offset", d => d.offset)
                .attr("stop-color", d=>d.color);
    
            svg.append("g")
                .call(xAxis, dt.scX, h, me.pVal);
            svg.append("g")
                .call(yAxis, dt.scY, me.pFreq);
            
            svg.append("path")
                .datum(dt.vals)
                //.attr("fill", "url(#gradValue)")
                .attr("fill", "white")
                .attr("d", area(dt.scX, dt.scY));
            
            const gb = svg.append("g")
                .call(brush)
                //.call(brush.move, defValSelect.x)
                ;
            
            function brushed({selection}) {
                if (selection) {
                    let s = selection.map(dt.scX.invert, dt.scX);
                    container.selectAll('.gInitPlanOccupe').attr('visibility',h=>{
                        if(!h.data)return 'visible';
                        return h.data.value >= s[0] && h.data.value <= s[1] ? 'visible' : 'hidden'
                    });
                }
            }
            
            function brushended({selection}) {
                if (!selection) {
                    gb.call(brush.move, defValSelect.x);
                }else{
                    let s = selection.map(dt.scX.invert, dt.scX);
                    container.style("cursor", "wait");
                    //addChildren(hierarchie,s);
                    container.style("cursor", "default");
                }
            }
    
        }

        // Copyright 2021, Observable Inc.
        // Released under the ISC license.
        // https://observablehq.com/@d3/color-legend
        function Legend(gBand, color, {
            title,
            tickSize = 6,
            width = 320,
            height = 44 + tickSize,
            marginTop = 18,
            marginRight = 10,
            marginBottom = 16 + tickSize,
            marginLeft = 10,
            ticks = width / 64,
            tickFormat,
            tickValues
        } = {}) {

            function ramp(color, n = 256) {
                const canvas = document.createElement("canvas");
                canvas.width = n;
                canvas.height = 1;
                const context = canvas.getContext("2d");
                for (let i = 0; i < n; ++i) {
                    context.fillStyle = color(i / (n - 1));
                    context.fillRect(i, 0, 1, 1);
                }
                return canvas;
            }

            const svg = gBand.append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .style("overflow", "visible")
                .style("display", "block");

            let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
            let x;

            // Continuous
            if (color.interpolate) {
                const n = Math.min(color.domain().length, color.range().length);

                x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

                svg.append("image")
                    .attr("x", marginLeft)
                    .attr("y", marginTop)
                    .attr("width", width - marginLeft - marginRight)
                    .attr("height", height - marginTop - marginBottom)
                    .attr("preserveAspectRatio", "none")
                    .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
            }

            // Sequential
            else if (color.interpolator) {
                x = Object.assign(color.copy()
                    .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
                        range() {
                            return [marginLeft, width - marginRight];
                        }
                    });

                svg.append("image")
                    .attr("x", marginLeft)
                    .attr("y", marginTop)
                    .attr("width", width - marginLeft - marginRight)
                    .attr("height", height - marginTop - marginBottom)
                    .attr("preserveAspectRatio", "none")
                    .attr("xlink:href", ramp(color.interpolator()).toDataURL());

                // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
                if (!x.ticks) {
                    if (tickValues === undefined) {
                        const n = Math.round(ticks + 1);
                        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
                    }
                    if (typeof tickFormat !== "function") {
                        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
                    }
                }
            }

            // Threshold
            else if (color.invertExtent) {
                const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
                    :
                    color.quantiles ? color.quantiles() // scaleQuantile
                    :
                    color.domain(); // scaleThreshold

                const thresholdFormat = tickFormat === undefined ? d => d :
                    typeof tickFormat === "string" ? d3.format(tickFormat) :
                    tickFormat;

                x = d3.scaleLinear()
                    .domain([-1, color.range().length - 1])
                    .rangeRound([marginLeft, width - marginRight]);

                svg.append("g")
                    .selectAll("rect")
                    .data(color.range())
                    .join("rect")
                    .attr("x", (d, i) => x(i - 1))
                    .attr("y", marginTop)
                    .attr("width", (d, i) => x(i) - x(i - 1))
                    .attr("height", height - marginTop - marginBottom)
                    .attr("fill", d => d);

                tickValues = d3.range(thresholds.length);
                tickFormat = i => thresholdFormat(thresholds[i], i);
            }

            // Ordinal
            else {
                x = d3.scaleBand()
                    .domain(color.domain())
                    .rangeRound([marginLeft, width - marginRight]);

                svg.append("g")
                    .selectAll("rect")
                    .data(color.domain())
                    .join("rect")
                    .attr("x", x)
                    .attr("y", marginTop)
                    .attr("width", Math.max(0, x.bandwidth() - 1))
                    .attr("height", height - marginTop - marginBottom)
                    .attr("fill", color);

                tickAdjust = () => {};
            }

            svg.append("g")
                .attr("transform", `translate(0,${height - marginBottom})`)
                .call(d3.axisBottom(x)
                    .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
                    .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
                    .tickSize(tickSize)
                    .tickValues(tickValues))
                .call(tickAdjust)
                .call(g => g.select(".domain").remove())
                .call(g => g.append("text")
                    .attr("x", marginLeft)
                    .attr("y", marginTop + marginBottom - height - 6)
                    .attr("fill", "currentColor")
                    .attr("text-anchor", "start")
                    .attr("font-weight", "bold")
                    .attr("class", "title")
                    .text(title));
            return {'x':x,'g':svg};

        }

        this.init();    
    }
}