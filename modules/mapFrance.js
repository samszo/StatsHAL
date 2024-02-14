import {appUrl} from './appUrl.js';
import {posiColor} from './posiColor.js';

export class mapFrance {
    constructor(params) {
        var me = this;
        this.id = params.id ? params.id : 'streamwords';
        this.cont = params.cont ? params.cont : d3.select("#chart");
        this.urlData = params.urlData ? params.urlData : false;
        this.urlDataLabs = params.urlDataLabs ? params.urlDataLabs : "assets/data/labs.json";
        this.urlLabel = params.urlLabel ? params.urlLabel : "rien";
        this.data = params.data ? params.data : false;
        this.dataForVis = [];
        this.labs = [];
        const width = params.width ? params.width : 600;
        const height = params.height ? params.height : 600;
        //const geocoder = new google.maps.Geocoder();
        let legendAxis,svg,legendCellSize = 20,
            colors = ['#EAC7C7', '#E3B5B5', '#DDA2A2', '#D68F8F', '#CF7D7D', '#C86A6A', '#C15757', '#BE4E4E', '#BA4545', '#A83E3E', '#953737', '#823030', '#702929', '#5D2222', '#4A1C1C', '#381515'],
            pUrl = new appUrl({'url':new URL(me.urlData)}),
            q = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : '',
            sourceHAL = "https://api.archives-ouvertes.fr/search/?q="+q
              + "&rows=" + (pUrl.params.has('rows') ? +pUrl.params.get('rows') : "10000")
              +"&fl=labStructAcronym_s,labStructName_s,labStructId_i,labStructAddress_s,labStructCode_s,labStructCountry_s,labStructType_s,labStructCode_s",
            refRegions=[];
        this.init = function () {
          setData();
        }

        const geocode = async (adresse, callback) => {
          const url = new URL('http://api-adresse.data.gouv.fr/search')
          const params = {q:cleanAdresse(adresse),limit:1}
          Object.keys(params).forEach(
            key => url.searchParams.append(key, params[key])
          )
          const response = await fetch(url);
          let result = {}
          if(!response.ok)result.error=response.statusText;     // => false        
          else result = await response.json();
          return result;
        }

        function cleanAdresse(a){
          a = a.replace('- ',' ');
          a = a.replaceAll('"','');
          a = a.replaceAll('[','');
          a = a.replaceAll(']','');
          a = a.substring(0,199);
          return a;
        }

        function setData(){
          showLoader();
          Promise.all([d3.json(sourceHAL),d3.json(me.urlDataLabs)]).then(rs=>{
              me.labs = rs[1];
              /*nettoyage de labs
              let newLabs = d3.sort(Array.from(d3.group(me.labs, d => d.labStructName_s)).map(d=>{ 
                return d[1][0];
              }), d => d.labStructName_s) 
              console.log(newLabs);
              */
              getDataForVis(rs[0].response.docs);          
          });            
        }

        function getDataForVis(data){
          me.dataForVis=[];
          //regroupement par laboratoire
          data.forEach(d=>{
            if(d.labStructId_i){
              for (let i = 0; i < d.labStructId_i.length; i++) { 
                let k='labStructName_s';
                if(d.labStructCountry_s && d.labStructCountry_s[i]=="fr" && d.labStructAddress_s && d.labStructAddress_s.length > i && d.labStructAcronym_s && d.labStructAcronym_s.length > i){
                  let f = me.dataForVis.filter(l=>l[k]==d[k][i]);             
                  if(f.length==0){
                    let lab = me.labs.filter(l=>l[k]==d[k][i]);             
                    if(lab.length){
                      lab[0].nb=0;
                      me.dataForVis.push(lab[0]);
                    }else{
                      me.dataForVis.push({
                        "labStructId_i":[d.labStructId_i[i]],
                        "labStructAcronym_s":d.labStructAcronym_s[i],
                        "labStructName_s":d.labStructName_s[i],
                        "labStructAddress_s":d.labStructAddress_s[i],
                        "labStructCountry_s":d.labStructCountry_s[i],
                        "labStructType_s":d.labStructType_s[i],
                        "geo":false,
                        "nb":0
                      });  
                    }
                  }
                  f = me.dataForVis.filter(l=>l[k]==d[k][i]);             
                  f[0].nb++;
                  let sf = f[0].labStructId_i.filter(sid=>sid==d.labStructId_i[i]);
                  if(sf.length==0)f[0].labStructId_i.push(d.labStructId_i[i]);
                }
              }
            }
          })
          geocodeData();
        }

        const delay = ms => new Promise(res => setTimeout(res, ms));
        async function geocodeData(deb=0, fin=49, wait=0){
          if(wait) await delay(wait);
          //géocode les données abscentes
          let geoPromise = [];
          for (let i = deb; i < fin; i++) {
            const d = me.dataForVis[i];
            if(d && !d.geo){
              //avec google geocoder geoPromise.push({'i':i,'f':geocoder.geocode({address:d.labStructAddress_s})});
              geoPromise.push({'i':i,'f':geocode(d.labStructAddress_s)});
            }
          }
          if(geoPromise.length){
            Promise.all(geoPromise.map(g=>g.f)).then(responses=>{
              responses.forEach((r,i)=>{
                /*pour google
                me.dataForVis[geoPromise[i].i].geo=r.results[0];
                let rg = r.results[0].address_components.filter(ac=>ac.types[0]=="administrative_area_level_1"),
                  dep = r.results[0].address_components.filter(ac=>ac.types[0]=="administrative_area_level_2");
                if(rg.length)me.dataForVis[geoPromise[i].i].region=rg[0].long_name;
                if(dep.length)me.dataForVis[geoPromise[i].i].dep=dep[0].long_name;
                */
                if(r.error || r.features.length==0){
                  console.log('ERREUR geocodeData',r);
                }else if (geoPromise[i].i!=0) {
                  me.dataForVis[geoPromise[i].i].geo=r.features[0];                
                  let ctx = r.features[0].properties.context.split(', ');
                  me.dataForVis[geoPromise[i].i].region = ctx[2];
                  me.dataForVis[geoPromise[i].i].dep = ctx[1];
                  me.dataForVis[geoPromise[i].i].depnum = ctx[0];                                                   
                } 
              });
              if(me.dataForVis.length > fin){
                geocodeData(fin, fin+49, 2000);                
              }else{
                mapImprove();    
              }
            });
          }else mapImprove();              
        };

        function mapImprove() {
          console.log(me.dataForVis);
          
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
            const dep = svg.append("g");
          
            svg.append("text")
                  .attr("x", (width / 2))
                  .attr("y", 25)
                  .attr("text-anchor", "middle")
                  .style("fill", "#D3B8B8")
                  .style("font-weight", "300")
                  .style("font-size", "16px")
                  .text("Répartition des collaborations en France de : "+me.urlLabel);
                    
            Promise.all([d3.json("assets/data/departements.geojson")]).then(function (values) {
              const geojsonDep = values[0];
              var featuresDep = dep
                .selectAll("path")
                .data(geojsonDep.features)
                .enter()
                .append("path")
                .attr('fill','none')
                .attr('stroke','white')                
                .attr('id', d => "d" + d.properties.code)
                .attr("d", path);

              let collaborationsByDepObj = d3.rollup(me.dataForVis, v => d3.sum(v, d => +d.nb), d => d.dep),
                depsValues = Array.from(d3.group(me.dataForVis, d => d.dep)),
                heightLegende = 60,
                contLegende = svg.append('g').attr('transform','translate(0 40)'),
                pc = new posiColor({'data':me.dataForVis.map(d=>{return {'nb':d.nb,'dep':d.dep,'lib':'nb de collaboration'};}),'cont':contLegende
                  ,'pFreq':'dep','pVal':'nb','pLib':'lib','frequency':true
                  ,'width':width,'height':heightLegende}); 
              depsValues.forEach(function (e, i) {
                  let totalCollaborations = collaborationsByDepObj.get(e[0]),
                  geoDep = geojsonDep.features.filter(g=>g.properties.nom==e[0]);
                  if(geoDep.length){                  
                    d3.select("#d" + geoDep[0].properties.code)      
                      .attr("fill", pc.colors["nb de collaboration"](totalCollaborations))
                      .on("mouseover", function (event, d) {
                        div.transition()
                          .duration(200)
                          .style("opacity", .9);
                        div.html("<b>Département : </b>" + e[0] + "<br>"
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
                  }
                });
              hideLoader();       
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