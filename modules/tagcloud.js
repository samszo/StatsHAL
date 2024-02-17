/**
 * 
 * 
 * merci à http://www.jasondavies.com/wordcloud/
 */
import * as noUiSlider from './nouislider.min.mjs';

export class tagcloud {
    constructor(config={}) {
    var me = this;
    this.cont = config.cont ? config.cont : d3.select('body');  
	this.idDoc = config.idDoc ? config.idDoc : 'tc';  
	this.user = config.user ? config.user : false; 
	this.h = config.h ? config.h : 600; 
	this.w = config.w ? config.w : 800; 
	this.colorTag = config.colorTag ? config.colorTag : {'select':'red','visit':'green','over':'orange','init':'white'}; 
    this.keyTag = config.keyTag ? config.keyTag : 'titleCpt';
    this.fct = config.fct ? config.fct : false;
	this.sauve = config.sauve; 
	this.global = config.global;  
	this.verif = config.verif;  
	this.txt = config.txt;  
	this.data = config.data;
	this.term = config.term;
	this.utiWords = config.utiWords;
	this.poidsTag = 1;
	this.urlJson = config.urlJson;
	this.div = config.div;
    this.tags = [];
	// From 
	// Jonathan Feinberg's cue.language, see lib/cue.language/license.txt.
	// 
	this.stopWords = /^(tout|comme|fois|puis|encore|aussi|quoi|aujourd|hui|tôt|lors|plus|estce|vousmême|puisqu|estàdire|très|cela|alors|donc|etc|for|tant|au|en|un|une|aux|et|mais|par|c|d|du|des|pour|il|ici|lui|ses|sa|son|je|j|l|m|me|moi|mes|ma|mon|n|ne|pas|de|sur|on|se|soi|notre|nos|qu|s|même|elle|t|que|celà|la|le|les|te|toi|leur|leurs|eux|y|ces|ils|ce|ceci|cet|cette|tu|ta|ton|tes|à|nous|ou|quel|quels|quelle|quelles|qui|avec|dans|sans|vous|votre|vos|été|étée|étées|étés|étant|suis|es|est|sommes|êtes|sont|serai|seras|sera|serons|serez|seront|serais|serait|serions|seriez|seraient|étais|était|étions|étiez|étaient|fus|fut|fûmes|fûtes|furent|sois|soit|soyons|soyez|soient|fusse|fusses|fût|fussions|fussiez|fussent|ayant|eu|eue|eues|eus|ai|as|avons|avez|ont|aurai|auras|aura|aurons|aurez|auront|aurais|aurait|aurions|auriez|auraient|avais|avait|avions|aviez|avaient|eut|eûmes|eûtes|eurent|aie|aies|ait|ayons|ayez|aient|eusse|eusses|eût|eussions|eussiez|eussent|i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;
	this.punctuation = /["“!()&*+,-\.\/:;<=>?\[\\\]^`\{|\}~]+/g;
	this.elision = /[’'’''0123456789]+/g;
	this.wordSeparators = /[\s\u3031-\u3035\u309b\u309c\u30a0\u30fc\uff70]+/g;
	
    let fill = d3.scaleOrdinal(d3.schemeSet3),
        hpt,
        complete = 0,
        maxLength = 30,
        maxTag = 3000,
        minmaxFont = [6, 96],
        statusText, posiTxt,
        svg, background, vis, tooltip,ext,fontSize,slider,initWords;	    

	this.init = function() {
            //initialisation des éléments graphiques
            me.cont.selectAll('div').remove();
            me.cont.select('svg').remove();

            //création des éléments graphiques
            let s = me.cont.append('div').attr('id',"tools_"+me.idDoc);
            statusText = me.cont.append('div').attr('id',"status_"+me.idDoc);
            posiTxt = me.cont.append('div').attr('id',"select_txt_"+me.idDoc);

            if(posiTxt){
                hpt  = posiTxt.clientHeight;
                if(hpt>me.h)me.h=hpt;
            }

            if(me.data){
                if(me.verif)me.verif = me.data;
                me.data = parseData();
            }
            if(me.txt){
                me.data=parseText();
                //hypertextualise seulement les sélections des utilisateurs
                if(me.user){
                    hypertextualise();	    		
                }
                //colorise le term de la recherche
                if(me.term)showTerm();
                posiTxt.innerHTML = me.txt;
            }
                            
            svg = me.cont.append("svg")
                .attr("id", "svg_"+me.idDoc)
                .attr("width", me.w)
                .attr("height", me.h);
            background = svg.append("g");
            vis = svg.append("g")
                    .attr("transform", "translate(" + [me.w >> 1, me.h >> 1] + ")"); 

            tooltip = d3.select("body")
                .append("div")
                .attr("class", "term")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden")
                .style("font","32px sans-serif")
                .style("background-color","white")		    
                .text("a simple tooltip");
            
            ext = d3.extent(me.data.map(function(x) { return parseInt(x.value); }));
            fontSize =  d3.scaleLog().domain([ext[0],ext[1]]).range(minmaxFont);
            d3.layout.cloud().size([me.w, me.h])
                .words(me.data)
                .rotate(0)
                .spiral("rectangular")
                //
                .fontSize(function(d) {
                    /*
                    var n = d.value*16;
                    if(me.user){
                        var uw = inUtiWords(d.key);
                        if(uw) n = uw.value*8;
                    }
                    if(me.global)n=fontSize(d.value);
                    if(n>me.h)n=me.h/2;
                    */
                    let n=fontSize(d.value);
                    return n; 
                })
                //
                .text(function(d) { 
                    return d.key; 
                    })
                .on("word", progress)
                .on("end", draw)
                .start();

            setSlider(s);
			
            if(me.fct.hideLoader)me.fct.hideLoader();

		}
		    	
        function setSlider(s){
            s.append('h3').text('Occurrence intervals');
            slider =s.append('div').attr('id',"tcSlider").node();
                        
            var formatForSlider = {
                from: function (formattedValue) {
                    return parseInt(formattedValue);
                },
                to: function(numericValue) {
                    return parseInt(numericValue);
                }
            };
            noUiSlider.create(slider, {
                start: ext,
                connect: true,
                range: {
                    'min': ext[0],
                    'max': ext[1]
                },
                format: formatForSlider,
                tooltips: {
                    // tooltips are output only, so only a "to" is needed
                    to: function(numericValue) {
                        return parseInt(numericValue);
                    }
                }            
            });   
            slider.noUiSlider.on('end', function (values, handle, unencoded, tap, positions, noUiSlider) {
                draw(null,null,values);
             });         

        }


		function draw(words,wordExt,slideExt=false) {
            if(!slideExt){
                ext = d3.extent(words.map(function(x) { return parseInt(x.value); }));
                initWords = words;
            }else{
                vis.selectAll("text").remove();
                words = initWords.filter(w=>w.value>=slideExt[0] && w.value<=slideExt[1]);
            }
			var text = vis.selectAll("text")
		        .data(words)
			    .enter().append("text")
		    	  	//.style("fill", function(d) { return fill(d.text.toLowerCase()); })
		    	  	.style("fill", function(d) {
                        return me.colorTag.init;
		    	  	})
		        	.style("font-size", function(d) { 
		        		return d.size + "px"; 
		        		})
			        .attr("text-anchor", "middle")
		    	    .attr("transform", function(d) { return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")"; })
		        	.text(function(d) { return d.text; })
		        	.on("click", function(e, d) {
                        if(me.fct.showLoader)me.fct.showLoader();
                        d.select = d.select ? false : true;
                        let t = d3.select(e.target);
                        vis.selectAll("text").style("fill",me.colorTag.init);
                        t.style("fill",me.colorTag.select)
                            .attr('class',d.select?"textSelect":"");
                        if(me.fct.clickTag){
                            me.fct.clickTag(d,vis.selectAll(".textSelect"));
                        }
                        if(me.fct.hideLoader)me.fct.hideLoader();
		        	})
		        	.on("mouseover", function(e, d) { 
                        if(d.select)return;
                        d3.select(this).style("fill", me.colorTag.over);
		        	})
		        	.on("mouseout", function(e, d) {
                        if(d.select)return; 
		        		d3.select(e.target).style("fill", me.colorTag.visit);
                    })
	    	        .on("mousemove", function(e, d){
                        if(d.select)return;
                        //TODO:gérer les tooltip
	    	        	if(me.global) return tooltip
			        		.style("top", (event.pageY+10)+"px")
			        		.style("left",(event.pageX+10)+"px")
	    	        		.text(d.text);
	    	        	})
		        	.attr("cursor", (me.user || me.global || me.verif) ? "pointer" : "none")
		        	;
		}
		function progress(d) {
			statusText.text(++complete + "/" + me.data.length);
		}
				
		function parseText() {
			me.tags = {};
			var cases = {};
			me.txt.split(me.wordSeparators).forEach(function(word) {
				var j = word.search("&quot;");
				if(j==0){
					word = word.substr(6);
				}else if(j>0){
					word = word.substr(0, j);
				}
				var i = word.search(me.elision);
				if(i>0)word = word.substr(i+1);
				word = word.replace(me.punctuation, "");
				if (me.stopWords.test(word.toLowerCase())) return;
				if (word.length <= 2) return;
		    	if(me.user){
		    		var uw = inUtiWords(word);
		    		if(uw.value<0) return;
		    	}				
				word = word.substr(0, maxLength);
				cases[word.toLowerCase()] = word;
				me.tags[word = word.toLowerCase()] = (me.tags[word] || 0) + 1;
			});
			me.tags = d3.entries(me.tags).sort(function(a, b) { return b.value - a.value; });
			me.tags.forEach(function(d) {d.key = cases[d.key];});
			return me.tags;
		}

		function parseData() {

            const gTags = Array.from(d3.group(me.data, (d) => d[me.keyTag])).map(d=>{ return {'value': d[1].length,'k':d[0],'vals':d[1]};}).sort(function (a, b) {
                return b.value - a.value;
              });
			me.tags = [];
			var j=0;
			gTags.forEach((t)=> {
				if (t.value <= 0) return;
				if(j>maxTag) return;
				var word = t.k;
				var i = word.search(me.elision);
				if(i>0) word = word.substr(i+1);
				word = word.replace(me.punctuation, "");
				var wlc = word.toLowerCase();
				if (me.stopWords.test(wlc)) return;
				if (word.length <= 2) return;
				word = word.substr(0, maxLength);
                me.tags.push({'key':word,'vals':t.vals,'value':t.value});
				j++;
			});
			return me.tags;
		}
		
		function inUtiWords(txt) {
            if(!me.utiWords)return false;
			for(var i= 0; i < me.utiWords.length; i++)
			{
                if(txt.toLowerCase()==me.utiWords[i]['code']){
                    return me.utiWords[i];					 
                } 
            }
            return false;
		}
		function hypertextualise() {
			 var d, reg, str;
			 for(var i= 0; i < me.data.length; i++)
			 {
				 d = me.data[i];
				 reg=new RegExp("("+d.key+")", "g");
				 str = "<span id='tag_"+me.idDoc+"' class='tag' v='"+d.value+"'>$1</span>";
				 me.txt =  me.txt.replace(reg, str);
			 }
		}

		function showTerm() {
			var arr = me.term.split(" and ");
			if(arr.length==1) arr = me.term.split(" or ");
			 for(var i= 0; i < arr.length; i++)
			 {
				 reg=new RegExp("("+arr[i]+")", "g");
				 str = "<span id='tag_"+me.idDoc+"' class='term' >$1</span>";
				 me.txt =  me.txt.replace(reg, str);				 
			 }			
		}

        if(me.urlJson){
            d3.json(me.urlJson).then(donnes=>{
                me.data = donnes;
                me.init();
            });
        } else {
            me.init();
        }
		
    };      
}
