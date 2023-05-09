import {appUrl} from './modules/appUrl.js';

const config = {
    topWord: 40,
    minFont: 12,
    maxFont: 25,
    tickFont: 12,
    legendFont: 12,
    curve: d3.curveMonotoneX,
    topWord: 100
};
let dataForVis = [], authors=[], words=[], svg = d3.select("#canvas").append('svg').attr("id", "mainSVG"),
    margins = {t:10,b:10,l:10,r:10},
    dateField= 'publicationDate_s',
    pUrl = new appUrl({'url':new URL(document.location)}),
    q = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : 'authIdHal_s:samuel-szoniecky',
    fq = pUrl.params && pUrl.params.has('fq') ? "&fq="+pUrl.params.get('fq') : '',//'publicationDate_s:[2000 TO 2023]',
    uri = "https://api.archives-ouvertes.fr/search/?q="+q+fq
        +"&rows=10000"
        +"&fl=authIdHal_s,keyword_s,title_s,docid,uri_s,producedDate_s,publicationDate_s"
        +"&sort="+dateField+" asc";
//d3.json(uri,data=>{
d3.json(uri).then(data=>{
    console.log(data);
    /*
    d3.select('#rows').selectAll('p').data(rs.response.docs).enter()
    .append('p').html(r=>{
        return '"'+r.title_s[0]+'";'+r.producedDate_s.split('-')[0];
    });
    */
    dataForVis = getDataForVis(data.response.docs);
    let w = window.innerWidth-margins.l-margins.r, h = window.innerHeight - margins.t - margins.b;
    d3.select("#canvas")
        .style("max-width", w + "px")
        .style("background-color","black");    
    svg.attr("width", Math.max(120 * dataForVis.length, w))
    svg.attr("height", Math.max(200 * Object.keys(dataForVis[0].words).length, h));

    wordstream(svg, dataForVis, config);
    hideLoader();

});
function getDataForVis(data){
    dataForVis=[];
    //regroupement par année
    //regroupement par année
    let g = d3.group(data, d => d[dateField].split('-')[0]),
    //création des catégories
    typeCat = 'keywords & authors',//"words for each author"
    wCat = getWordCat(data,typeCat);
    g.forEach((docs,date)=>{
        let o = {'date':date,'words':JSON.parse(JSON.stringify(wCat)),'docs':[]};
        docs.forEach(d=>{
            o.docs.push(d);
            if(!d.authIdHal_s)d.authIdHal_s=["No IdHal"];
            switch (typeCat) {
                case "words for each author":
                    d.authIdHal_s.forEach(ka=>{
                        getKeywords(d,o,'keywords for '+ka);
                    })                    
                    break;            
                case "keywords & authors":
                default:
                    getKeywords(d,o,'keywords');
                    getAuthors(d,o);
                    break;
            }
        })
        dataForVis.push(o)
    })
    return dataForVis;
}
function getKeywords(d,o,k){
    if(d.keyword_s) d.keyword_s.forEach(kw=>{
        if(kw)setWord(kw,o,k,d,3)
    });
    let ekw = nlp(cleanText(d.title_s.join())),
    terms = ekw.terms().json();
    terms.forEach(t=>{
        if(t.text)setWord(t.text,o,k,d);
    })    
}
function getAuthors(d,o){
    let fi, frq = 6, k = o.date, a;
    if(!d.authIdHal_s){
        ka = 'No IdHal';
        fi = authors.findIndex(d=>d==ka);
        if(fi<0){
            authors.push(ka);
            fi = (authors.length-1);
        }
        o.words['authors'].push({frequency: frq,id: k+"_"+ka+"_"+fi,text:ka,topic:'authors','d':d})
    }else{
        d.authIdHal_s.forEach(ka=>{
            a = o.words['authors'].filter(d=>d.text==ka);
            if(a.length==0){
                fi = authors.findIndex(d=>d==ka);
                if(fi<0){
                    authors.push(ka);
                    fi = (authors.length-1);
                }
                o.words['authors'].push({frequency: frq,id: k+"_"+ka+"_"+fi,text:ka,topic:'authors','d':d})
            }else
                a[0].frequency = a[0].frequency+1;
        })
    }
}

function getWordCat(data,type){
    let w={}, cat; 
    switch (type) {
        case "words for each author":
            cat = d3.group(data, d => d.authIdHal_s ? d.authIdHal_s : ["No IdHal"]);            
            cat.forEach((v,k)=>{
                k.forEach(a=>{
                    if(!w['keywords for '+a]){
                        w['keywords for '+a]=[];
                    }
                });
            });
            break;    
        case "keywords & authors":
        default:
            w = {'keywords':[],'authors':[]};
        break;
    }
    return w;
}
function cleanText(t){
    t = t.replace(/.'/, '')
    .replace(/.’/, '')
    .replace(/.'/, '')
    .replace(/.’/, '')               
    .replace(/[.,\/#!,«»$%\^&\*;:{}=\-_`~()"َّ"]/mg," ")
    .replace(/\.\s+|\n|\r|\0/mg,' ')
    .replace(/\s-+\s/mg,' ')
    .replace(/[©|]\s?/mg,' ')
    .replace(/[!(–?$”“…]/mg,' ')
    .replace(/\s{2,}|^\s/mg,' ');
    t = sw.removeStopwords(t.split(' '),sw.fra);
    t = sw.removeStopwords(t,sw.eng);
    
    return t.join(' ');
}

function setWord(w,o,t,d,p=1){
    //console.log(t);
    let fi, k = o.date, aw = o.words[t].filter(d=>d.text==w);
    if(aw.length==0){
        fi = words.findIndex(d=>d==w);
        if(fi<0){
            words.push(w);
            fi = words.length-1;
        }
        o.words[t].push({frequency: 1,id: k+"_"+t+"_"+fi,text:w,topic:t,'d':d})
    }else
        aw[0].frequency = aw[0].frequency+(1*p);
}

function showLoader() {
	d3.select("#ws-loading").style("display", "inline-block")
}
function hideLoader() {
	d3.select("#ws-loading").style("display", "none")
}
