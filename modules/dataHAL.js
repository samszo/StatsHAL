import {appUrl} from './appUrl.js';

export class dataHAL {
    constructor(params) {
        var me = this;
        this.data = params.data ? params.data : [];
        this.dataAct = [];
        this.dataDoc = [];
        this.dataTag = [];
        this.dataOrg = [];
        this.dataActDocTag = [];
        this.urlData = params.urlData;
        this.urlAct = params.urlAct;
        this.urlDoc = params.urlDoc;
        this.urlTag = params.urlTag;
        this.urlOrg = params.urlTag;
        this.urlActDocTag = params.urlActDocTag;
        this.fields = params.fields ? params.fields : "&fl=authIdHal_s,halId_s,keyword_s,title_s,submitType_s,subTitle_s,language_s,abstract_s,domainAllCode_s,docid,uri_s,producedDate_s,publicationDate_s,authFirstName_s,authLastName_s,authStructId_i,docType_s";
        this.csv = params.csv;
        this.showLoader = params.showLoader;
        this.hideLoader = params.hideLoader;
        this.endLoadData = params.endLoadData ? params.endLoadData : false;
        let apiHAL = "https://api.archives-ouvertes.fr/search",
            apiHALrefAut = "https://api.archives-ouvertes.fr/ref/author",
            apiHALrefAutStr = "https://api.archives-ouvertes.fr/search/authorstructure",
            apiHALrefStr = "https://api.archives-ouvertes.fr/ref/structure",
            keys = [], dataCsv=[];

        this.init = function () {
            if(me.urlData){
                let dateField= 'publicationDate_s',
                pUrl = new appUrl({'url':new URL(me.urlData)}),
                q = pUrl.params && pUrl.params.has('q') ? pUrl.params.get('q') : 'authIdHal_s:samuel-szoniecky',
                fq = pUrl.params && pUrl.params.has('fq') ? "&fq="+pUrl.params.get('fq') : '',//'publicationDate_s:[2000 TO 2023]',
                uri = "https://api.archives-ouvertes.fr/search/?q="+q+fq
                    + "&rows=" + (pUrl.params.has('rows') ? +pUrl.params.get('rows') : "10000")
                    +"&fl=authIdHal_s,keyword_s,title_s,docid,uri_s,producedDate_s,publicationDate_s"
                    +"&sort="+dateField+" asc";
                d3.json(uri).then(data=>{
                    me.data = data.response.docs;
                });                
            }

            if(me.csv)getDataByRef();
            let pJson= [];
            if(me.urlAct)pJson.push({'o':'dataAct','u':d3.json(me.urlAct)});
            if(me.urlDoc)pJson.push({'o':'dataDoc','u':d3.json(me.urlDoc)});
            if(me.urlTag)pJson.push({'o':'dataTag','u':d3.json(me.urlTag)});
            if(me.urlOrg)pJson.push({'o':'dataOrg','u':d3.json(me.urlOrg)});
            if(me.urlActDocTag)pJson.push({'o':'dataActDocTag','u':d3.json(me.urlActDocTag)});
            if(pJson.length){
                Promise.all(pJson.map(p=>p.u)).then((values) => {
                    values.forEach((v,i)=>{
                        me[pJson[i].o]=v;
                    })
                    if(params.endLoadData)params.endLoadData(me);
                });                
            }
    
        }
        this.getActTagcloud = function () {
            let dataTagcloud = []; 
            me.dataAct.forEach(a=>{
                let adt = me.dataActDocTag.filter(d=>d.act==a.id);
                a.nb = adt.length;
                for (let i = 0; i < a.nb; i++) {
                    dataTagcloud.push({'nom':a.prenom+' '+a.nom});                    
                }
            })
            return dataTagcloud;
        }

        this.getKeywordTagcloud = function () {
            let dataTagcloud = [], dataSource = me.dataDoc ? me.dataDoc : me.data; 
            dataSource.map(d=>d.keyword_s).forEach(kw=>{
                if(kw)kw.forEach(w=>dataTagcloud.push({'word':w}));                    
            })
            return dataTagcloud;
        }

        function getDataByRef(){
            if(me.showLoader)me.showLoader();
            me.dataAct = [];
            me.dataOrg = [];
            me.dataDoc = [];
            me.dataTag = [];
            me.dataActDocTag = [];
            d3.csv(me.csv).then(data=>{
                dataCsv = data;
                getDataDoc(0);                
            })
        }

        async function getDataDoc(num){
            let d = dataCsv[num],
            hal = await d3.json(apiHAL+"?q=halId_s:"+d.halId_s+me.fields),
            ref = hal.response.docs[0];
            await getDataAut(0,ref);
            getKey(d.halId_s,me.dataDoc,
                {'idHal':d.halId_s,'titre':ref.title_s,'uri_s':ref.uri_s,'publicationDate_s':ref.publicationDate_s,'authIdHal_s':ref.authIdHal_s,'authFullName_s':ref.authFullName_s,'keyword_s':ref.keyword_s,'title_s':ref.title_s,'docid':ref.docid,'producedDate_s':ref.producedDate_s,'publicationDate_s':ref.publicationDate_s}
            );
            addDocActTag(ref,'keyword_s');
            addDocActTag(ref,'domainAllCode_s');
            addDocActTag(ref,'language_s');
            addDocActTag(ref,'submitType_s');
            addDocActTag(ref,'docType_s');                            
            if(num<(dataCsv.length-1)){
                getDataDoc(num+1);
            }else{
                if(me.hideLoader)me.hideLoader();
                saveFile(JSON.stringify(me.dataAct),'dataHalAut.json');
                saveFile(JSON.stringify(me.dataDoc),'dataHalDepot.json');
                saveFile(JSON.stringify(me.dataTag),'dataHalKeyword.json');
                saveFile(JSON.stringify(me.dataOrg),'dataHalOrg.json');
                saveFile(JSON.stringify(me.dataActDocTag),'dataHalAutDocKey.json');                
            }
        }
        async function getDataAut(i,ref){
            let idAut = await getKey(ref.authFirstName_s[i]+ref.authLastName_s[i],me.dataAct,
                {'prenom':ref.authFirstName_s[i],'nom':ref.authLastName_s[i]}
            );
            if(i<(ref.authLastName_s.length-1)){
                await getDataAut(i+1,ref);
            }   
        }

        function addDocActTag(data, champ){
            if(data[champ]){
                if(Array.isArray(data[champ])){
                    data[champ].forEach(tag=>{
                        data.authFirstName_s.forEach((n,i)=>{
                            if(!Array.isArray(tag)) tag=[tag];
                            tag.forEach(async t=>{
                                me.dataActDocTag.push({
                                    'doc':await getKey(data.halId_s),
                                    'act':await getKey(data.authFirstName_s[i]+data.authLastName_s[i]),
                                    'tag':await getKey(champ+t,me.dataTag,{'type':champ,'val':t})
                                });
                                //console.log('link added for '+data.halId_s+' / '+data.authFirstName_s[i]+data.authLastName_s[i]+' / '+t);        
                            })
                        })
                    })
                } else {
                    data.authFirstName_s.forEach(async (n,i)=>{
                        me.dataActDocTag.push({
                            'doc':await getKey(data.halId_s),
                            'act':await getKey(data.authFirstName_s[i]+data.authLastName_s[i]),
                            'tag':await getKey(champ+data[champ],me.dataTag,{'type':champ,'val':data[champ]})
                        });        
                        //console.log('link added for '+data.halId_s+' / '+data.authFirstName_s[i]+data.authLastName_s[i]+' / '+t);        
                    })
                }
            }

        }

        async function getKey(k,rs=false,r=false){
            if(keys[k]==undefined){
                if(!r.id)r.id=rs.length;
                if(rs==me.dataOrg && k.indexOf('#')>-1){
                    let org = await d3.json(apiHALrefStr+"?q=docid:"+k.replace('#struct-',''));
                    rs.push({
                        'nom':org.response.docs[0].label_s,
                        'idOrg':k,
                        'docid':org.response.docs[0].docid
                        });
                }else{
                    rs.push(r);
                    if(rs==me.dataAct){
                        await addActInfos(r);
                    }
                }
                keys[k]=rs.length-1;
            }
            return keys[k];
        }

        async function addActInfos(rs){
            /*récupère les infos de l'auteur
            d3.json(apiHALrefAut+"?q=fullName_t:"+rs.nom+"&fq=fullName_t:"+rs.nom+"&fq=firstName_t:"+rs.prenom+"&fl=*Id_s,idHal_s,docid").then(aut=>{
                rs.idsHal=aut.response.docs;
            });
            */    
            const request = new XMLHttpRequest();
            request.open("GET", apiHALrefAut+"?q=fullName_t:"+rs.nom+"&fq=fullName_t:"+rs.nom+"&fq=firstName_t:"+rs.prenom+"&fl=*Id_s,idHal_s,docid", false); // `false` makes the request synchronous
            request.send(null);            
            if (request.status === 200) {
                rs.idsHal=JSON.parse(request.responseText);
            }            
            
            //récupère les infos de la structure
            let str, idStr = '';
            rs.idsOrg=[];
            //ATTENTION on passe par l'xml car le json ne renvoie pas toutes les infos
            request.open("GET", apiHALrefAutStr+"?wt=xml&lastName_t="+rs.nom+"&firstName_t="+rs.prenom, false); // `false` makes the request synchronous
            request.send(null);            
            if (request.status === 200) {
                const result = parseXml(request.responseText).response.result;
                if(result.org){
                    if(Array.isArray(result.org)){
                        result.org.forEach(async o=>{
                            await setOrgInfos(o,rs);
                        })
                    }else{
                        setOrgInfos(result.org,rs);
                    }
                }
            } 

        }
        async function setOrgInfos(o,rs) {
            if(o['xml:id']){
                let dt =                     {
                        'nom':o.orgName[1] ? o.orgName[1]['#text'] : o.orgName['#text'],
                        'docid':o['xml:id'].replace('struct-',''),
                        'idOrg':o['xml:id'],
                        'desc':o.orgName[1] ? o.orgName[0]['#text'] : '',
                        'address':o.desc && o.desc.address && o.desc.address.addrLine && o.desc.address.addrLine['#text'] ? o.desc.address.addrLine['#text']:"",
                        'country':o.desc && o.desc.address && o.desc.address.country ? o.desc.address.country.key : "",
                        'relations':o.listRelation && o.listRelation.relation ? o.listRelation.relation : [],
                        'idnos':o.idno ? o.idno : ''
                    },
                    idStr = await getKey(o['xml:id'],me.dataOrg,dt);
                //récupère les relations
                if(dt.relations && dt.relations.length){
                    dt.relations.forEach(async rel=>{
                        //on stocke les relations de structure avec # pour différencier avec les structures des auteurs qui n'ont pas de #
                        await getKey(rel.active,me.dataOrg,rel);
                    })
                };
                rs.idsOrg.push(idStr);
            }
        }

        function parseXml(xml, arrayTags) {
            let dom = null;
            if (window.DOMParser) dom = (new DOMParser()).parseFromString(xml, "text/xml");
            else if (window.ActiveXObject) {
                dom = new ActiveXObject('Microsoft.XMLDOM');
                dom.async = false;
                if (!dom.loadXML(xml)) throw dom.parseError.reason + " " + dom.parseError.srcText;
            }
            else throw new Error("cannot parse xml string!");

            function parseNode(xmlNode, result) {
                if (xmlNode.nodeName == "#text") {
                    let v = xmlNode.nodeValue;
                    if (v.trim()) result['#text'] = v;
                    return;
                }

                let jsonNode = {},
                    existing = result[xmlNode.nodeName];
                if (existing) {
                    if (!Array.isArray(existing)) result[xmlNode.nodeName] = [existing, jsonNode];
                    else result[xmlNode.nodeName].push(jsonNode);
                }
                else {
                    if (arrayTags && arrayTags.indexOf(xmlNode.nodeName) != -1) result[xmlNode.nodeName] = [jsonNode];
                    else result[xmlNode.nodeName] = jsonNode;
                }

                if (xmlNode.attributes) for (let attribute of xmlNode.attributes) jsonNode[attribute.nodeName] = attribute.nodeValue;

                for (let node of xmlNode.childNodes) parseNode(node, jsonNode);
            }

            let result = {};
            for (let node of dom.childNodes) parseNode(node, result);

            return result;
        }        

        function saveFile(fileContent,fileName){
            var bb = new Blob([fileContent ], { type: 'text/plain' });
            var a = document.createElement('a');
            a.download = fileName;
            a.href = window.URL.createObjectURL(bb);
            a.click();
        }
        this.init();
    
    }
}