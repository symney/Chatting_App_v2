var socket=io();
var username;
var read=document.createElement("div");
read.classList.add("tcontain");
socket.on("logged",(un)=>{
    console.log("successfully logged in:"+un)
    username=un;
    socket.on(un,(newobj)=>{
        console.log()
        chat_create(newobj);
    });
});

socket.on('click',(obj)=>{
    
    console.log(obj);
    for(i in obj.messages){
        if(obj.messages[i].sender==username){
            delete obj.messages[i].sender;
        }
    }
    var final=Mustache.to_html(obj.filedata,obj);
    console.log(obj.messages);
    if(messages.childElementCount==1){
        document.getElementById('one').removeChild(document.getElementsByClassName('call')[0])
        document.getElementById('one').insertAdjacentHTML('beforeend','<div class="call"></div>')

        document.getElementsByClassName('call')[0].insertAdjacentHTML('beforeend',final);
        document.getElementsByClassName('call')[0].scrollTop=document.getElementsByClassName('call')[0].scrollHeight+100000000;
    }
    else{
        document.getElementsByClassName('call')[1].insertAdjacentHTML('beforeend',final);
        document.getElementsByClassName('call')[1].scrollTop=document.getElementsByClassName('call')[1].scrollHeight+1000000000;
    }
    if(obj.read==false){
        if(!obj.messages[obj.messages.length-1]||obj.messages[obj.messages.length-1].sender){
            socket.emit("read",obj.id);
        }
        else{

        }
    }
    else if(obj.read==true){
        var read=document.createElement("div");
        read.classList.add("tcontain");
        read.id="read-"+obj.id;
        read.style.background="RGB(200,200,200)";
        document.getElementById(obj.id).parentElement.lastElementChild.appendChild(read);
    }
})
socket.on('search',(results)=>{
    if(document.getElementById('search').value==''){
        document.getElementById('resultcont').style='height:0%;'
    }
    else{
        if(document.getElementById('result')){
            console.log(document.getElementsByClassName("result").length)
            while(document.getElementById("resultcont").lastElementChild){
                document.getElementById("resultcont").lastElementChild.remove();
                console.log("removed");
            }
        }
        console.log(results);
        var list="{{#results}}<div id='result' class='chat result'onclick='check(\"{{profile}}\",\"{{username}}\")'><div class='text-cont' id='chat_cont' ><div class='id {{id}}'>{{id}}</div><img alt='asdf' class='pic' src='{{profile}}'><p class='searchtext' >{{username}}</p></div><ion-icon name='more' class='check'></ion-icon></div>{{/results}} {{^results}}<div id='result' class='chat result'><div class='text-cont' id='chat_cont' ><div class='id'></div><p class='searchtext' >No Users Found</p></div></div>{{/results}}";
        var assembly=Mustache.to_html(list,results)
        document.getElementById('resultcont').style='height:40%;'
        document.getElementById('resultcont').insertAdjacentHTML("beforeend",assembly);
    }
});
socket.on("createc",(newobj)=>{
    chat_create(newobj);
});
function chat_create(newobj){
    console.log("created chat");
    var script   = document.createElement("script");
    script.type  = "text/javascript";
    script.text  = "socket.on('"+newobj._id+"',(msg)=>{console.log('new chat found');on_id('"+newobj._id+"',msg);});";
    document.body.appendChild(script);

    
    var htmls="{{#.}}<div class='chat' id='chat'><div class='text-cont {{user}}' id='chat_cont' onclick='create(this.lastElementChild.innerHTML,this)'><div class='id {{user}}'>{{_id}}</div><img alt='asdf' class='pic' src='{{pic}}'><p class='name' >{{user}}</p></div><ion-icon name='more' class='check'></ion-icon></div>{{/.}}"
    var finale=Mustache.to_html(htmls,newobj);
    document.getElementsByClassName("cont")[0].insertAdjacentHTML("beforeend",finale);
    create(document.getElementsByClassName(newobj.user)[0].lastElementChild.innerHTML,document.getElementsByClassName(newobj.user)[0]);

}

socket.on("read",(chatid)=>{console.log("emitting read");
    if(document.getElementById(chatid)){
        var read=document.createElement("div");
        read.classList.add("tcontain");
        read.id="read-"+chatid;
        document.getElementById(chatid).parentElement.lastElementChild.appendChild(read);
    }
});
