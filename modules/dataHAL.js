export class dataHAL {
    constructor(params) {
        var me = this;
        this.dataAct = [];
        this.dataDoc = [];
        this.dataTag = [];
        this.dataOrg = [];
        this.dataActDocTag = [];
        this.urlAct = params.urlAct;
        this.urlDoc = params.urlDoc;
        this.urlTag = params.urlTag;
        this.urlOrg = params.urlTag;
        this.urlActDocTag = params.urlActDocTag;
        this.fields = params.fields ? params.fields : "&fl=authIdHal_s,halId_s,keyword_s,title_s,submitType_s,subTitle_s,language_s,abstract_s,domainAllCode_s,docid,uri_s,producedDate_s,publicationDate_s,authFirstName_s,authLastName_s,authStructId_i,docType_s";
        this.csv = params.csv;
        this.showLoader = params.showLoader;
        this.hideLoader = params.hideLoader;
        let apiHAL = "https://api.archives-ouvertes.fr/search",
            apiHALrefAut = "https://api.archives-ouvertes.fr/ref/author",
            apiHALrefAutStr = "https://api.archives-ouvertes.fr/search/authorstructure",
            keys = [];
    
        this.init = function () {
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

        function getDataByRef(){
            if(me.showLoader)me.showLoader();
            me.dataAct = [];
            me.dataOrg = [];
            me.dataDoc = [];
            me.dataTag = [];
            me.dataActDocTag = [];
            d3.csv(me.csv).then(data=>{
                let finData = data.length;
                data.forEach((d,i) => {
                    d3.json(apiHAL+"?q=halId_s:"+d.halId_s+me.fields).then(hal=>{
                        hal.response.docs.forEach(ref=>{
                            for (let i = 0; i < ref.authLastName_s.length; i++) {
                                let idAut = getKey(ref.authFirstName_s[i]+ref.authLastName_s[i],me.dataAct,
                                    {'prenom':ref.authFirstName_s[i],'nom':ref.authLastName_s[i]}
                                );
                            }
                            getKey(d.halId_s,me.dataDoc,
                                {'idHal':d.halId_s,'titre':ref.title_s,'uri':ref.uri_s,'date':ref.publicationDate_s}
                            );
                            addDocActTag(ref,'keyword_s');
                            addDocActTag(ref,'domainAllCode_s');
                            addDocActTag(ref,'language_s');
                            addDocActTag(ref,'submitType_s');
                            addDocActTag(ref,'docType_s');                            
                        })                        
                        if(finData==(i+1)){
                            saveFile(JSON.stringify(me.dataAct),'dataHalAut.json');
                            saveFile(JSON.stringify(me.dataDoc),'dataHalDepot.json');
                            saveFile(JSON.stringify(me.dataTag),'dataHalKeyword.json');
                            saveFile(JSON.stringify(me.dataOrg),'dataHalOrg.json');
                            saveFile(JSON.stringify(me.dataActDocTag),'dataHalAutDepKey.json');
                            /*
                            console.log(me.dataAct);
                            console.log(me.dataDoc);
                            console.log(me.dataTag);
                            console.log(me.dataOrg);
                            console.log(me.dataActDocTag);
                            */
                        }    
                    })
                });
                if(me.hideLoader)me.hideLoader();
            })
        }

        function addDocActTag(data, champ){
            if(data[champ]){
                if(Array.isArray(data[champ])){
                    data[champ].forEach(tag=>{
                        data.authFirstName_s.forEach((n,i)=>{
                            if(!Array.isArray(tag)) tag=[tag];
                            tag.forEach(t=>{
                                me.dataActDocTag.push({
                                    'doc':getKey(data.halId_s),
                                    'act':getKey(data.authFirstName_s[i]+data.authLastName_s[i]),
                                    'tag':getKey(champ+t,me.dataTag,{'type':champ,'val':t})
                                });            
                            })
                        })
                    })
                } else {
                    data.authFirstName_s.forEach((n,i)=>{
                        me.dataActDocTag.push({
                            'doc':getKey(data.halId_s),
                            'act':getKey(data.authFirstName_s[i]+data.authLastName_s[i]),
                            'tag':getKey(champ+data[champ],me.dataTag,{'type':champ,'val':data[champ]})
                        });        
                    })
                }
            }

        }

        function getKey(k,rs=false,r=false){
            if(keys[k]==undefined){
                if(!r.id)r.id=rs.length;
                rs.push(r);
                if(rs==me.dataAct){
                    addActInfos(r);
                    /*pour éviter la surcharge
                    setTimeout(() => {
                        addActInfos(me.dataAct[idAut]);
                    }, 1);
                    */                                                    
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
            request.open("GET", apiHALrefAutStr+"?lastName_t="+rs.nom+"&firstName_t="+rs.prenom, false); // `false` makes the request synchronous
            request.send(null);            
            if (request.status === 200) {
                str=JSON.parse(request.responseText);
            }            
            //d3.json(apiHALrefAutStr+"?lastName_t="+rs.nom+"&firstName_t="+rs.prenom).then(str=>{
                if(str.response.result){
                    if(Array.isArray(str.response.result.org)){
                        str.response.result.org.forEach(o=>{
                            if(o.orgName){
                                idStr = getKey(o.orgName.toString(),me.dataOrg,
                                    {'desc':o.desc,'nom':o.orgName,'idOrg':o.idno}
                                );                    
                                rs.idsOrg.push(idStr);
                            }
                        })
                    }else{
                        let o = str.response.result.org;
                        if(o.orgName){
                            idStr = getKey(o.orgName.toString(),me.dataOrg,
                                {'desc':o.desc,'nom':o.orgName,'idOrg':o.idno}
                            );                    
                            rs.idsOrg.push(idStr);
                        }
                    }
                }
            //});           
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